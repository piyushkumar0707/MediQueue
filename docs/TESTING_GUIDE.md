# Testing Guide

This guide defines the baseline testing workflow, quality gates, and maintenance policy for CareQueue + Health-Vault.

## Test Levels

1. Backend integration tests
- Location: backend/tests/integration
- Tooling: Jest + Supertest + real Mongo/Redis test env
- Goal: verify auth, role access, queue lifecycle, and critical negative paths

2. Frontend unit/component tests
- Location: frontend/src/**/*.test.js|jsx
- Tooling: Vitest + Testing Library
- Goal: verify auth store and API interceptor behavior deterministically

3. Browser E2E smoke tests
- Location: frontend/tests/e2e
- Tooling: Playwright (Chromium lane)
- Goal: verify route guards and basic authenticated shell behavior

## Coverage Baselines

Coverage thresholds are intentionally conservative and will be raised over time.

1. Backend (Jest)
- branches: 0% (baseline)
- functions: 0% (baseline)
- lines: 0% (baseline)
- statements: 0% (baseline)

2. Frontend (Vitest)
- branches: 0% (baseline)
- functions: 0% (baseline)
- lines: 0% (baseline)
- statements: 0% (baseline)

## Commands

1. Backend
- npm run lint
- npm test -- --passWithNoTests
- npm run test:integration
- npm run test:coverage
- npm run test:integration:coverage

2. Frontend
- npm run test:run
- npm run test:coverage
- npm run e2e -- --project=chromium --grep "@smoke"
- npm run build

## CI Gating Policy

1. Pull requests
- Backend lint and tests
- Frontend build
- Playwright smoke tests only (@smoke)

2. Main/nightly/manual
- Backend lint and tests
- Backend integration coverage (advisory, non-blocking)
- Frontend build
- Full Playwright suite

3. Failure artifacts
- Playwright HTML report uploaded on failures
- Backend integration coverage artifact uploaded on all runs

## Test Data Lifecycle

1. Backend integration tests
- Tests run with NODE_ENV=test
- Database and Redis are cleaned between tests via setup hooks
- Do not rely on test execution order

2. Frontend tests
- Use deterministic mocks for network and browser side effects
- Reset localStorage and store state between tests

## Flaky Test Triage Protocol

1. Detection
- Any test that fails intermittently across reruns is considered flaky

2. Immediate response
- Tag test with the root-cause note in PR comments
- Keep smoke lane stable: either fix immediately or temporarily exclude non-critical flaky test from smoke only

3. Ownership and SLA
- Author of the breaking change owns first remediation
- Target fix SLA: 2 working days for smoke-lane flakes

4. Prevention
- Prefer state-based waits over fixed sleeps
- Keep assertions focused on user-visible state
- Avoid coupling tests to implementation details

## Increment Plan

1. Raise thresholds from baseline to 10% once current test base is stable
2. Raise to 25% after adding appointment and consent flow E2E
3. Re-evaluate thresholds quarterly
