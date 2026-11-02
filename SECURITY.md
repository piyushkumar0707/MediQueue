# Security Policy

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Email your report privately to **121piyush466mits@gmail.com** with the subject line:
`[SECURITY] MediQueue — <brief description>`

Include:
- A clear description of the vulnerability
- Steps to reproduce (proof-of-concept code or request/response pairs are welcome)
- Potential impact assessment
- Your suggested fix, if you have one

You will receive an acknowledgement within **48 hours** and a status update within **7 days**.
Please allow reasonable time for a fix before any public disclosure.

---

## Scope

The following are **in scope** for vulnerability reports:

| Area | Examples |
|---|---|
| **Authentication & session management** | JWT forgery, token leakage, refresh token replay, MFA bypass |
| **Encryption of medical records** | AES-256-GCM key exposure, IV reuse, weak key derivation |
| **Consent & access control** | Accessing records without a valid consent grant, RBAC bypass, unauthorized role escalation |
| **Audit log integrity** | Tampered SHA-256 integrity hashes going undetected, audit entries that can be deleted or modified |
| **Input validation / injection** | NoSQL injection, path traversal in file uploads, SSRF via record proxying |
| **Emergency-access workflow** | Bypassing the admin approval gate on doctor override requests |

The following are **out of scope**:

- Denial-of-service attacks that require enormous request rates
- Social engineering or phishing attacks against users
- Issues in third-party dependencies that have an already-published fix upstream
- Findings from automated scanners submitted without a working proof of concept

---

## Patient Data — Important Notice

> **Never include real patient data in a security report or test.**

MediQueue handles sensitive medical records. Any reproduction or testing **must** use synthetic or fictional data only. Using real patient identifiers, diagnoses, or records — even for demonstration purposes — is a serious privacy violation and will not be accepted.

---

## Disclosure Policy

Once a fix is merged and released, we will:
1. Credit the reporter (unless they prefer to remain anonymous) in the release notes.
2. Publish a brief advisory describing the vulnerability class and the fix.

We follow a responsible disclosure model: please give us a reasonable remediation window (typically 90 days) before any public disclosure.
