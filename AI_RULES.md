# AI Engineering Rules for This Repository

These rules apply to any AI agent modifying or generating code in this repository.

---

# 1. Understand Before Changing
Before writing any code:

1. Read the relevant files completely.
2. Identify:
   - Architecture
   - Dependencies
   - Existing patterns
3. Explain the proposed plan before implementing.

Never modify code blindly.

---

# 2. Keep Code Simple

Prefer:

- simple functions
- minimal abstractions
- readable logic

Avoid:

- unnecessary design patterns
- premature optimization
- complex abstractions for small problems

Goal: maintainable production code.

---

# 3. Follow Existing Architecture

When implementing features:

- match folder structure
- follow naming conventions
- reuse existing utilities
- avoid introducing new frameworks unless necessary

Do not rewrite working systems.

---

# 4. Error Handling

All backend code must include:

- proper error handling
- meaningful error messages
- safe fallbacks when possible

Never silently ignore errors.

---

# 5. Edge Case Thinking

Before finalizing a solution, check:

- null/undefined inputs
- invalid user input
- API failures
- database failures
- network timeouts
- concurrency issues

Robust code > quick code.

---

# 6. Testing Mindset

For new features:

1. Suggest unit tests
2. Verify edge cases
3. Confirm existing functionality still works

Never assume code works without verification.

---

# 7. Performance Awareness

While writing backend logic:

Check for:

- N+1 database queries
- unnecessary loops
- blocking operations
- large memory usage

Prefer efficient algorithms and queries.

---

# 8. Minimal Impact Principle

Changes should:

- modify only required files
- avoid breaking unrelated modules
- maintain backward compatibility

Do not introduce large refactors unless requested.

---

# 9. Code Review Mode

After implementing code:

Perform a self-review:

- readability
- maintainability
- performance
- error handling
- security

Suggest improvements if needed.

---

# 10. Communication Style

When responding:

1. First explain the plan.
2. Then provide code.
3. Then explain important decisions.

Avoid long explanations unless necessary.

---

# 11. Security Awareness

Always check for:

- input validation
- injection vulnerabilities
- unsafe file operations
- exposed secrets

Never store API keys or credentials in code.

---

# 12. Logging and Observability

When appropriate:

- add logs for important actions
- log errors with context
- avoid excessive logging

Logs should help debugging in production.

---

# 13. When Unsure

If requirements are unclear:

Stop and ask for clarification instead of guessing.

---

# Core Principle

Write code like a **senior production engineer**, not a prototype script.
Write production-quality code similar to what an experienced software engineer would ship.