import { spawn } from 'node:child_process';

const rawArgs = process.argv.slice(2);
const runIntegration = rawArgs.includes('--integration');
const jestArgs = rawArgs.filter((arg) => arg !== '--integration');

if (runIntegration) {
  jestArgs.push('tests/integration', '--runInBand');
}

const child = spawn(
  process.execPath,
  ['--experimental-vm-modules', './node_modules/jest/bin/jest.js', ...jestArgs],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      RUN_BACKEND_INTEGRATION_TESTS: runIntegration ? 'true' : 'false',
    },
  }
);

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
