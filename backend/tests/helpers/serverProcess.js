import { spawn } from 'node:child_process';

const HEALTH_TIMEOUT_MS = 30000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForHealth = async (baseUrl) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < HEALTH_TIMEOUT_MS) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until timeout.
    }

    await wait(500);
  }

  throw new Error(`Server did not become healthy within ${HEALTH_TIMEOUT_MS}ms`);
};

export const startServerProcess = (cwd, env = {}) => {
  const child = spawn('node', ['src/server.js'], {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', () => {
    // Keep process pipes drained for long-running tests.
  });

  child.stderr.on('data', () => {
    // Keep process pipes drained for long-running tests.
  });

  return child;
};

export const stopServerProcess = async (child) => {
  if (!child || child.killed) {
    return;
  }

  child.kill('SIGTERM');

  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 5000);

    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
};
