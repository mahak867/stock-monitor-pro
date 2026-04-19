# Contributing to Stock Monitor Pro

Thank you for your interest in contributing! This guide covers everything you need to get started.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Issue Reporting](#issue-reporting)
- [Security Vulnerabilities](#security-vulnerabilities)

---

## Getting Started

1. **Fork** the repository on GitHub and clone your fork:

   ```bash
   git clone https://github.com/<your-username>/stock-monitor-pro.git
   cd stock-monitor-pro
   npm install
   ```

2. **Copy the env template** and fill in the minimum required keys (Clerk):

   ```bash
   cp .env.example .env.local
   ```

3. **Start the dev server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and sign in.

---

## Development Workflow

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server with hot-reload |
| `npm run build` | Production build (catches type and ESLint errors) |
| `npm run lint` | Run ESLint across the codebase |
| `npm run typecheck` | Run TypeScript compiler without emitting files |
| `npm test` | Run the Jest unit-test suite |
| `npm audit` | Check for known vulnerabilities in dependencies |

All of the above run automatically in CI on every push and pull request.

---

## Code Style

- **Language:** TypeScript — all new files must be fully typed; avoid `any`.
- **Formatting:** The project uses ESLint with `eslint-config-next`. Run `npm run lint` before committing.
- **Naming:** Follow the existing conventions in each file (`camelCase` for variables/functions, `PascalCase` for components and types).
- **Comments:** Add a comment only when the *why* is not obvious from the code itself.
- **React components:** Prefer functional components with hooks. Class components are used only for the `ErrorBoundary`.

---

## Testing

Tests live under `__tests__/` and mirror the `lib/` or `app/` directory structure they cover.

- Write tests for any new pure utility functions you add.
- The suite uses **Jest + ts-jest** in CommonJS mode (`tsconfig.test.json`).
- Keep unit tests free of network calls and environment variable dependencies.

Run the full suite:

```bash
npm test
```

---

## Submitting a Pull Request

1. Create a feature branch from `main`:

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes in small, logical commits with clear messages.

3. Ensure all checks pass locally:

   ```bash
   npm run lint && npm run typecheck && npm test
   ```

4. Push your branch and open a pull request against `main`.

5. In your PR description, explain **what** you changed and **why**. Include screenshots for UI changes.

---

## Issue Reporting

- Use the [GitHub Issues](https://github.com/mahak867/stock-monitor-pro/issues) page.
- Search for existing issues before opening a new one.
- Include: what you expected, what actually happened, reproduction steps, and your environment (OS, Node version, browser).

---

## Security Vulnerabilities

Please **do not** open a public GitHub issue for security vulnerabilities. Instead, follow the process described in [SECURITY.md](./SECURITY.md).
