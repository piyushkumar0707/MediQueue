import 'dotenv/config';
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import WebSocket from 'ws';
import User from '../src/models/User.js';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientCount = readPositiveInt('BENCHMARK_SOCKET_CLIENTS', 120);
const rounds = readPositiveInt('BENCHMARK_SOCKET_ROUNDS', 5);
const deliveryTimeoutMs = readPositiveInt('BENCHMARK_SOCKET_DELIVERY_TIMEOUT_MS', 15_000);
const runId = `${Date.now()}-${crypto.randomBytes(5).toString('hex')}`;
const dbName = `mediqueue_socket_benchmark_${runId.replaceAll('-', '_')}`;
const redisContainerName = `mediqueue-socket-redis-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'mediqueue-socket-benchmark-'));

let mongoProcess;
let redisProcess;
let backendProcess;
let mongoDbName;
let mongoConnected = false;
let redisContainerStarted = false;
let redisRuntime = 'unknown temporary Redis instance';
let socketClients = [];
let serverPort;
let redisPort;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const percentile = (values, fraction) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * fraction) - 1];
};
const fixed = (value) => value === null ? null : Number(value.toFixed(2));

function readPositiveInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function runCommand(command, args, timeoutMs = 120_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      else reject(new Error(`${command} exited ${code}: ${stderr.trim() || stdout.trim()}`));
    });
  });
}

async function reservePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function tcpIsOpen(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.setTimeout(500);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.once('error', () => resolve(false));
  });
}

function findExecutable(name, environmentPath) {
  if (environmentPath) return environmentPath;
  const lookup = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', [name], {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (lookup.status === 0) return lookup.stdout.trim().split(/\r?\n/)[0];
  return null;
}

async function findMongod() {
  const found = findExecutable('mongod', process.env.MONGOD_PATH);
  if (found) return found;
  if (process.platform !== 'win32') return null;
  const installRoot = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'MongoDB', 'Server');
  const versions = await fs.readdir(installRoot).catch(() => []);
  versions.sort((left, right) => right.localeCompare(left, undefined, { numeric: true }));
  for (const version of versions) {
    const executable = path.join(installRoot, version, 'bin', 'mongod.exe');
    try {
      await fs.access(executable);
      return executable;
    } catch { /* Try the next installed MongoDB version. */ }
  }
  return null;
}

function uriForDatabase(uri, databaseName) {
  const parsed = new URL(uri);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
}

async function waitForService(host, port, processHandle, label, timeoutMs = 30_000, getLogs = () => '') {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (processHandle?.exitCode !== null && processHandle?.exitCode !== undefined) {
      throw new Error(`${label} exited before becoming ready (code ${processHandle.exitCode})${getLogs() ? `: ${getLogs()}` : ''}`);
    }
    if (await tcpIsOpen(host, port)) return;
    await sleep(200);
  }
  throw new Error(`${label} did not become ready on ${host}:${port}`);
}

async function startMongo() {
  const explicitBenchmarkUri = process.env.BENCHMARK_MONGODB_URI;
  const configuredUri = explicitBenchmarkUri || process.env.MONGODB_URI;
  const requestedUri = configuredUri || 'mongodb://127.0.0.1:27017';
  const requested = new URL(requestedUri);
  const requestedHost = requested.hostname || '127.0.0.1';
  const requestedPort = Number(requested.port || 27017);

  if (explicitBenchmarkUri || requested.protocol === 'mongodb+srv:'
    || !['localhost', '127.0.0.1', '::1'].includes(requestedHost)) {
    return uriForDatabase(requestedUri, dbName);
  }

  if (await tcpIsOpen(requestedHost, requestedPort)) {
    return uriForDatabase(requestedUri, dbName);
  }

  const mongodPath = await findMongod();
  if (!mongodPath) {
    throw new Error(`MongoDB is not listening at ${requestedHost}:${requestedPort}, and mongod was not found. Set BENCHMARK_MONGODB_URI or MONGOD_PATH.`);
  }

  const port = await reservePort();
  const dbPath = path.join(temporaryRoot, 'mongo-data');
  await fs.mkdir(dbPath, { recursive: true });
  const mongoLogs = [];
  mongoProcess = spawn(mongodPath, [
    '--dbpath', dbPath,
    '--bind_ip', '127.0.0.1',
    '--port', String(port),
    '--quiet',
  ], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  mongoProcess.stdout.on('data', (chunk) => mongoLogs.push(chunk.toString()));
  mongoProcess.stderr.on('data', (chunk) => mongoLogs.push(chunk.toString()));
  await waitForService('127.0.0.1', port, mongoProcess, 'temporary MongoDB', 30_000, () => mongoLogs.join('').trim().slice(-2000));
  return `mongodb://127.0.0.1:${port}/${dbName}`;
}

async function startRedis() {
  redisPort = await reservePort();
  const redisPath = findExecutable('redis-server', process.env.REDIS_SERVER_PATH);
  if (redisPath) {
    const redisDataPath = path.join(temporaryRoot, 'redis-data');
    await fs.mkdir(redisDataPath, { recursive: true });
    redisProcess = spawn(redisPath, [
      '--bind', '127.0.0.1',
      '--port', String(redisPort),
      '--save', '',
      '--appendonly', 'no',
      '--dir', redisDataPath,
    ], { windowsHide: true, stdio: 'ignore' });
    await waitForService('127.0.0.1', redisPort, redisProcess, 'temporary Redis');
    redisRuntime = 'temporary redis-server process';
    return `redis://127.0.0.1:${redisPort}`;
  }

  const docker = findExecutable('docker', process.env.DOCKER_PATH);
  if (!docker) throw new Error('redis-server and Docker were not found; set REDIS_SERVER_PATH or DOCKER_PATH.');
  await runCommand(docker, [
    'run', '--detach', '--rm', '--name', redisContainerName,
    '--publish', `127.0.0.1:${redisPort}:6379`,
    process.env.BENCHMARK_REDIS_IMAGE || 'redis:7-alpine',
  ]);
  redisContainerStarted = true;
  await waitForService('127.0.0.1', redisPort, null, 'temporary Redis');
  redisRuntime = `temporary Docker container (${process.env.BENCHMARK_REDIS_IMAGE || 'redis:7-alpine'})`;
  return `redis://127.0.0.1:${redisPort}`;
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    sleep(5_000),
  ]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

async function waitForBackend(baseUrl, child) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Backend exited before becoming healthy (code ${child.exitCode})`);
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch { /* Wait for backend startup. */ }
    await sleep(250);
  }
  throw new Error('Backend did not become healthy within 45 seconds');
}

function openSocketClient(token, clientIndex, patientId, baseUrl) {
  const startedAt = performance.now();
  const wsUrl = baseUrl.replace(/^http/, 'ws') + '/socket.io/?EIO=4&transport=websocket';
  const socket = new WebSocket(wsUrl);
  const joined = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Socket client ${clientIndex} did not join its room in time`)), 15_000);
    socket.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Socket client ${clientIndex} failed: ${error.message}`));
    });
    socket.on('close', () => {
      clearTimeout(timeout);
      reject(new Error(`Socket client ${clientIndex} disconnected during setup`));
    });
    socket.on('message', (raw) => {
      const packet = raw.toString();
      if (packet.startsWith('2')) {
        socket.send(`3${packet.slice(1)}`);
        return;
      }
      if (packet.startsWith('0')) {
        socket.send(`40${JSON.stringify({ token })}`);
        return;
      }
      if (packet.startsWith('40')) {
        socket.send('421["join"]');
        return;
      }
      if (packet.startsWith('431')) {
        try {
          const ack = JSON.parse(packet.slice(3));
          const joinResult = Array.isArray(ack) ? ack[0] : ack;
          if (!joinResult?.joined) throw new Error('server did not confirm room join');
          clearTimeout(timeout);
          resolve(performance.now() - startedAt);
        } catch (error) {
          clearTimeout(timeout);
          reject(new Error(`Socket client ${clientIndex} room join failed: ${error.message}`));
        }
      }
    });
  });

  return {
    socket,
    patientId,
    clientIndex,
    joined,
    waiters: new Map(),
    onNotification(runId, counters) {
      socket.on('message', (raw) => {
        const packet = raw.toString();
        if (!packet.startsWith('42')) return;
        let event;
        try { event = JSON.parse(packet.slice(2)); } catch { return; }
        if (event?.[0] !== 'notification' || event[1]?.type !== 'new_notification') return;
        const notification = event[1]?.data;
        const metadata = notification?.metadata;
        if (metadata?.benchmarkRunId !== runId) return;

        const key = `${metadata.benchmarkRound}:${metadata.benchmarkClientIndex}`;
        const waiter = this.waiters.get(key);
        const actualRecipient = String(notification?.recipient?._id ?? notification?.recipient ?? '');
        if (metadata.benchmarkClientIndex !== this.clientIndex || actualRecipient !== this.patientId) {
          counters.wrongClientEvents += 1;
          counters.errors.push({ key, connectedClient: this.clientIndex, recipient: actualRecipient });
          if (waiter && waiter.receivedAt === null) {
            waiter.receivedAt = performance.now();
            waiter.resolve();
          }
          return;
        }

        if (waiter) {
          if (waiter.receivedAt !== null) {
            counters.duplicateEvents += 1;
            return;
          }
          waiter.receivedAt = performance.now();
          waiter.receivedCorrectly = true;
          waiter.resolve();
        }
      });
    },
  };
}

const counters = {
  totalSent: 0,
  httpSuccess: 0,
  totalReceived: 0,
  duplicateEvents: 0,
  wrongClientEvents: 0,
  errors: [],
  latenciesMs: [],
  requestStartAt: null,
  lastReceiptAt: null,
};

try {
  const mongoUri = await startMongo();
  mongoDbName = dbName;
  const redisUrl = await startRedis();
  serverPort = process.env.BENCHMARK_SOCKET_PORT
    ? readPositiveInt('BENCHMARK_SOCKET_PORT', 5058)
    : await reservePort();

  process.env.JWT_ACCESS_SECRET = 'mediqueue_socket_benchmark_access_secret_32_bytes';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10_000 });
  mongoConnected = true;
  const databaseInfo = await mongoose.connection.db.admin().command({ buildInfo: 1 });

  const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12);
  const users = await User.insertMany(Array.from({ length: clientCount }, (_, index) => ({
    phoneNumber: String(9_100_000_000 + index),
    countryCode: '+91',
    email: `socket-benchmark-${runId}-${index}@example.invalid`,
    password: passwordHash,
    role: 'patient',
    permissions: [],
    personalInfo: {
      firstName: `Load${index}`,
      lastName: 'Patient',
      dateOfBirth: new Date('1995-01-01'),
      gender: 'other',
    },
    isActive: true,
  })));

  const accessSecret = 'mediqueue_socket_benchmark_access_secret_32_bytes';
  process.env.JWT_ACCESS_SECRET = accessSecret;

  backendProcess = spawn(process.execPath, ['src/server.js'], {
    cwd: backendRoot,
    windowsHide: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(serverPort),
      MONGODB_URI: mongoUri,
      REDIS_URL: redisUrl,
      JWT_ACCESS_SECRET: accessSecret,
      JWT_REFRESH_SECRET: 'mediqueue_socket_benchmark_refresh_secret_32_bytes',
      JWT_MFA_SECRET: 'mediqueue_socket_benchmark_mfa_secret_32_bytes',
      JWT_ACCESS_EXPIRY: '5m',
      ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef',
      FRONTEND_URL: 'http://localhost:5173',
      EMAIL_HOST: '',
      EMAIL_PORT: '',
      EMAIL_USER: '',
      EMAIL_PASSWORD: '',
      EMAIL_FROM: '',
      TWILIO_ACCOUNT_SID: '',
      TWILIO_AUTH_TOKEN: '',
      TWILIO_PHONE_NUMBER: '',
      LOG_LEVEL: 'error',
    },
  });

  const baseUrl = `http://127.0.0.1:${serverPort}`;
  await waitForBackend(baseUrl, backendProcess);

  // Open sockets only after the server is ready, and install event listeners before load starts.
  const clients = users.map((user, clientIndex) => {
    const token = jwt.sign({
      userId: user._id.toString(),
      role: 'patient',
      permissions: [],
      type: 'access',
    }, accessSecret, {
      expiresIn: '5m',
      issuer: 'mediqueue-api',
      audience: 'mediqueue-client',
    });
    const client = openSocketClient(token, clientIndex, user._id.toString(), baseUrl);
    client.token = token;
    return client;
  });
  socketClients = clients;
  const connectionStart = performance.now();
  const connectionTimes = await Promise.all(clients.map((client) => client.joined));
  for (const client of clients) client.onNotification(runId, counters);
  const connectionSetupElapsedMs = performance.now() - connectionStart;

  const expectedCount = clientCount * rounds;
  for (let round = 0; round < rounds; round += 1) {
    const requests = clients.map((client) => {
      const key = `${round}:${client.clientIndex}`;
      const receipt = {
        requestStartAt: performance.now(),
        receivedAt: null,
        receivedCorrectly: false,
        resolve: null,
      };
      const receiptPromise = new Promise((resolve) => { receipt.resolve = resolve; });
      client.waiters.set(key, receipt);
      counters.totalSent += 1;
      counters.requestStartAt ??= receipt.requestStartAt;
      return {
        client,
        round,
        receipt,
        receiptPromise,
        request: fetch(`${baseUrl}/api/v1/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${client.token}`,
          },
          body: JSON.stringify({
            recipient: client.patientId,
            type: 'queue_update',
            title: `Socket benchmark round ${round + 1}`,
            message: 'Synthetic queue update for local Socket.IO delivery benchmark.',
            priority: 'low',
            channels: { inApp: true, email: false, sms: false },
            metadata: {
              benchmarkRunId: runId,
              benchmarkRound: round,
              benchmarkClientIndex: client.clientIndex,
            },
          }),
        }).then(async (response) => {
          const body = await response.json().catch(() => ({}));
          if (response.status !== 201 || !body.success) {
            throw new Error(`Notification request for client ${client.clientIndex}, round ${round + 1} returned HTTP ${response.status}: ${body.message || 'request failed'}`);
          }
          const notification = body.data;
          const recipient = String(notification?.recipient?._id ?? notification?.recipient ?? '');
          if (recipient !== client.patientId || notification?.type !== 'queue_update') {
            throw new Error(`REST response did not match recipient/type for client ${client.clientIndex}, round ${round + 1}`);
          }
          counters.httpSuccess += 1;
        }),
      };
    });

    await Promise.all(requests.map(({ request }) => request));
    const receiptTimeout = sleep(deliveryTimeoutMs);
    await Promise.race([Promise.all(requests.map(({ receiptPromise }) => receiptPromise)), receiptTimeout]);

    for (const { client, round: receiptRound, receipt } of requests) {
      client.waiters.delete(`${receiptRound}:${client.clientIndex}`);
      if (receipt.receivedCorrectly) {
        counters.totalReceived += 1;
        counters.latenciesMs.push(receipt.receivedAt - receipt.requestStartAt);
        counters.lastReceiptAt = Math.max(counters.lastReceiptAt || 0, receipt.receivedAt);
      }
    }
  }

  const workloadElapsedMs = counters.lastReceiptAt && counters.requestStartAt
    ? counters.lastReceiptAt - counters.requestStartAt
    : connectionSetupElapsedMs;
  const connectionAverageMs = connectionTimes.reduce((sum, value) => sum + value, 0) / connectionTimes.length;
  const machine = {
    platform: `${os.platform()} ${os.release()}`,
    architecture: os.arch(),
    cpuCount: os.cpus().length,
    memoryGiB: fixed(os.totalmem() / (1024 ** 3)),
    node: process.version,
    mongodb: databaseInfo.version,
    redis: redisRuntime,
  };
  const result = {
    date: new Date().toISOString(),
    database: dbName,
    machine,
    clients: clientCount,
    rounds,
    totalSent: counters.totalSent,
    httpSuccess: counters.httpSuccess,
    totalReceived: counters.totalReceived,
    deliveryPercent: fixed((counters.totalReceived / expectedCount) * 100),
    workloadElapsedSeconds: Number((workloadElapsedMs / 1000).toFixed(5)),
    throughputNotificationsPerSecond: fixed(counters.totalReceived / (workloadElapsedMs / 1000)),
    connectionSetup: {
      averageMs: fixed(connectionAverageMs),
      p95Ms: fixed(percentile(connectionTimes, 0.95)),
    },
    requestStartToReceiptMs: {
      median: fixed(percentile(counters.latenciesMs, 0.5)),
      p95: fixed(percentile(counters.latenciesMs, 0.95)),
      max: fixed(counters.latenciesMs.length ? Math.max(...counters.latenciesMs) : null),
    },
    duplicates: counters.duplicateEvents,
    wrongClientEvents: counters.wrongClientEvents,
    expected: expectedCount,
    lost: expectedCount - counters.totalReceived,
    errors: counters.errors.slice(0, 10),
    measurementClock: 'performance.now() in this process',
  };
  console.log(JSON.stringify(result, null, 2));

  if (counters.httpSuccess !== expectedCount
    || counters.totalReceived !== expectedCount
    || counters.duplicateEvents > 0
    || counters.wrongClientEvents > 0) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`Socket notification benchmark failed: ${error.stack || error.message}`);
  process.exitCode = 1;
} finally {
  for (const client of socketClients) {
    try { client.socket.close(); } catch { /* Continue cleanup. */ }
  }
  await Promise.all(socketClients.map(async (client) => {
    if (client.socket.readyState === WebSocket.CLOSED) return;
    await Promise.race([
      new Promise((resolve) => client.socket.once('close', resolve)),
      sleep(1_000),
    ]);
    if (client.socket.readyState !== WebSocket.CLOSED) client.socket.terminate();
  }));

  await stopProcess(backendProcess);
  if (redisContainerStarted) {
    const docker = findExecutable('docker', process.env.DOCKER_PATH);
    if (docker) await runCommand(docker, ['stop', redisContainerName]).catch((error) => {
      console.error(`Failed to stop temporary Redis container: ${error.message}`);
      process.exitCode = 1;
    });
  }
  await stopProcess(redisProcess);

  if (mongoConnected) {
    if (mongoose.connection.db.databaseName === mongoDbName) {
      await mongoose.connection.dropDatabase().catch((error) => {
        console.error(`Failed to drop temporary MongoDB database ${mongoDbName}: ${error.message}`);
        process.exitCode = 1;
      });
    }
    await mongoose.disconnect().catch(() => {});
  }
  await stopProcess(mongoProcess);
  await fs.rm(temporaryRoot, { recursive: true, force: true }).catch(() => {});
}
