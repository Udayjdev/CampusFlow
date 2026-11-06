# CampusFlow source review

## Changes

- Formatted the main page, stylesheet, server, scheduling logic, database schema and domain tests into readable blocks.
- Added an explicit RoomQuery type for room recommendations.
- Fixed CSV imports accepting trailing characters after a closing quote or empty headers.
- Reject null, array and primitive request bodies with a validation response.
- Restrict demo role selection to explicitly registered roles; inherited object properties are no longer accepted.
- Validate imported rows before accessing their fields.
- Added test and typecheck package scripts and regression coverage.
- Kept the original UI behavior, attribution, hosting files and honest demo-data labels.

## Verification (6 November 2026)

- 13 Node tests passed: nine scheduling/CSV tests and four live API integration tests.
- SQLite concurrency checks passed: simultaneous collision, adjacent slots, cancelled booking and update overlap.
- TypeScript checking passed.
- Production build passed.
- Lint is not clean: 73 errors and three warnings remain, predominantly existing explicit-any types, plus React hook rules. Lint rules have not been disabled to hide them.
- No browser visual review or external judge test suite was run. Passing these checks does not guarantee passing unknown tests.

## Run checks

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm test:database
pnpm typecheck
pnpm build
pnpm lint
```

API tests skip unless CAMPUSFLOW_TEST_URL is set. Initialize the local database using the README instructions, start the development server, then run:

```sh
CAMPUSFLOW_TEST_URL=http://127.0.0.1:5173 pnpm test
```

PowerShell:

```powershell
$env:CAMPUSFLOW_TEST_URL = 'http://127.0.0.1:5173'
pnpm test
```

Use only an isolated local database for integration tests. They create demo sessions.

In this review environment standalone Wrangler startup hit a network-interface error. The API tests passed using Vite directly on port 5180 with the local Cloudflare bindings. The production build was verified, but production server startup was not.

This is still a prototype with simulated role switching, not institutional authentication. Formatting cannot establish who authored code or guarantee an AI-detector result.
