# Contributing to MediQueue

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Fork and Clone](#fork-and-clone)
- [Development Setup](#development-setup)
- [Branch Naming](#branch-naming)
- [Running Checks Locally](#running-checks-locally)
- [Commit Message Style](#commit-message-style)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

By participating, you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Fork and Clone

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/MediQueue.git
cd MediQueue

# 2. Add the upstream remote
git remote add upstream https://github.com/piyushkumar0707/MediQueue.git
```

---

## Development Setup

### Option A — Docker (recommended, no local Node/Mongo/Redis required)

```bash
# Copy example env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Fill in your values (see README Environment Variables table)

# Start all services
docker-compose up --build
# Frontend → http://localhost:80   Backend API → http://localhost:5000
```

### Option B — Manual

**Prerequisites:** Node.js v18+, MongoDB, Redis, npm ≥ 9

```bash
# Backend
cd backend
cp .env.example .env   # fill in required vars
npm install
npm run dev            # → http://localhost:5000

# Frontend (new terminal)
cd frontend
cp .env.example .env   # set VITE_API_URL and VITE_SOCKET_URL
npm install
npm run dev            # → http://localhost:5173
```

**Required backend env vars** (app crashes fast if missing):
`MONGODB_URI`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_MFA_SECRET`, `ENCRYPTION_KEY`

**Optional:** `GROQ_API_KEY` — if omitted, AI endpoints return `503` and the app starts normally.

---

## Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/<short-description>` | `feat/export-audit-csv` |
| Bug fix | `fix/<short-description>` | `fix/queue-duplicate-join` |
| Chore / docs | `chore/<short-description>` | `chore/update-deps` |
| Tests | `test/<short-description>` | `test/consent-controller` |

Always branch off `main`:

```bash
git checkout main && git pull upstream main
git checkout -b feat/your-feature
```

---

## Running Checks Locally

Run the same checks CI runs before opening a PR:

```bash
# Backend lint
npm --prefix backend run lint

# Backend unit tests (pass with no tests — integration tests need running Mongo + Redis)
npm --prefix backend test -- --passWithNoTests

# Frontend production build
npm --prefix frontend run build
```

---

## Commit Message Style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short imperative description>

[optional body — what and why, not how]

[optional footer: BREAKING CHANGE, Fixes #<issue>]
```

**Types:** `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `perf`, `ci`

Examples:
```
feat(consent): add record-type scoped consent grants
fix(queue): prevent duplicate join when re-joining same day
docs: add CONTRIBUTING guide
test(auth): unit tests for OTP expiry edge cases
```

---

## Pull Request Process

1. Ensure all three checks pass locally (lint, test, build — see above).
2. Keep PRs focused: one feature or fix per PR.
3. Fill in the [PR template](.github/pull_request_template.md) — do not delete the checklist.
4. Reference any related issues in the PR description (`Fixes #<n>`).
5. A maintainer will review within a few days. Address review comments with additional commits (do not force-push during review).
6. Once approved, the maintainer will squash-merge into `main`.

> **Security issues** — do **not** open a public PR or issue. See [SECURITY.md](SECURITY.md).

