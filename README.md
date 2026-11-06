# CampusFlow — Smart Campus Classroom Management

A working full-stack prototype for BUILD WITH AI: DevOps 2026 at DDUGU. It coordinates classroom reservations and academic updates across IET and Deeksha Bhawan.

## Features

- Responsive dashboard, room finder, interactive floor schematic, campus bulletin.
- Search by building, floor, room, date, time, duration, capacity and purpose.
- Faculty bookings for extra classes, minor examinations, practical sessions and events.
- Transactional booking changes and database triggers that prevent simultaneous overlap.
- Ranked alternative rooms across buildings and later time suggestions.
- Automatic rescheduling/cancellation notices with an audit trail.
- Student read-only schedules, academic group filters, CSV export and issue reporting.
- API-checked faculty, student and administrator demo roles.
- Admin room configuration, student mapping, validated CSV imports and persistent blueprint uploads.

## What is still required from the organizers

**The attached PDF contained the problem statement, not the actual student datasets or building blueprints. Official dataset/blueprint integration is therefore pending.** Import the supplied records and upload plans for both buildings before claiming this requirement is complete.

IET room names and floors follow the problem statement. First-floor classrooms have an approximate capacity of 75; IET32 approximately 200. The library uses the lower end of the 150–180 range and remains unverified pending permission. Unknown laboratory and second-floor classroom capacities remain unbookable.

LH01–LH12 represent Deeksha Bhawan. Floor placements and LH01–LH04 capacities of 80 are labelled demo configuration, not confirmed campus facts. Correct them from supplied records. The illustrated map is a schematic; uploaded original plans appear separately in Campus map.

All seeded students, notices and bookings are test data. New bookings are also marked test data. Demo faculty share one account. The role selector demonstrates permission rules; **it is not institutional authentication**. Replace it with verified identity and administrator-managed role assignment before real campus use.

Smart Assist uses a deterministic scheduling algorithm and simple text parser, not an external AI model. The brief permits scheduling algorithms. It understands a people count, today/tomorrow, start time after “at”, IET/Deeksha and purpose keywords. Review the interpreted filters. Suggestions use current records and bookings are checked again when confirmed.

## Technology

React 19, TypeScript, Vinext, custom CSS, Lucide icons, Worker API routes, Cloudflare D1 (SQLite), Drizzle migrations and Cloudflare R2 file storage. No external AI API key, PostgreSQL account or Docker is required. Google Fonts have system-font fallbacks.

## Quick start (no Linux/bash needed)

Install Node.js 22.13+ only, then:

- **Windows:** double-click `start.bat`
- **macOS/Linux:** `./start.sh`
- **Any OS:** `npm run go` (or `make` if you have make)

First run installs, builds, creates the local DB and starts http://localhost:5173. Next time `npm run dev` is enough. `npm run db:reset` wipes the local DB.

## Setup (Windows / macOS / Linux)

Install Node.js 22.13+ and pnpm matching the packageManager field in package.json. Python 3 is only needed for the optional concurrency test.

```sh
pnpm install --frozen-lockfile
pnpm build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_daily_toxin.sql
pnpm dev
```

Open the local URL printed by the server, normally http://localhost:5173. Run the migration **once per new local database**, not on every startup. The first request initializes labelled demo data. Local data is under `.wrangler/state` and is separate from hosted data.

Keep `.openai/hosting.json` with `d1: "DB"` and `r2: "BUCKET"` for local bindings. Its project ID belongs to this hosted prototype: do not reuse the ID to register an unrelated site. The portable execution profile is selected on a fresh local checkout; runtime profile files are intentionally excluded.

## Validation

```sh
pnpm exec tsc --noEmit
node --experimental-strip-types --test tests/domain.test.mjs
python3 tests/database_test.py
pnpm build
```

On Windows, `py tests/database_test.py` may be the appropriate Python command. Database tests create an isolated temporary SQLite database from the actual migration and do not change the application database.

## Import the supplied data

Select **Administrator → Data manager**. Download templates, fill them from the actual supplied data, upload a CSV, preview rows, then choose **Validate & import**. Existing IDs update and unrelated records remain. All rows validate before the batch commits. The limit is 500 rows / 1 MB per CSV; split larger student datasets into batches.

Student columns: `id,name,branch,year,section,batch`. Branch: `CSE`, `AI ML`, `AI DS`, `ECE`, `ME`, `IT`; year: `1`–`4`; section: `A`, `B` or `All`. Batch strings must match the corresponding booking audience. Use “View schedule” in student mapping to demonstrate dataset-driven filtering.

Room columns: `id,building,floor,capacity,uses,availability`. Building: `IET` or `Deeksha Bhawan`; floor: `0`, `1`, `2`; blank capacity: unknown. Availability: `confirmed`, `unverified`, `maintenance`. Uses: one or more of `Extra class|Minor examination|Practical session|Event`. Use the exact IDs in the room template. Changes invalidating an active booking are rejected until that booking is rescheduled/cancelled.

Upload both buildings' supplied blueprints as PDF/PNG/JPEG, up to 10 MB, and associate the correct floor. Open them from Campus map. Do not describe sample source files as official.

## Main files

- `app/page.tsx`: UI, forms, all views.
- `app/globals.css`: responsive design.
- `app/api/[...path]/route.ts`: API dispatch.
- `lib/server.ts`: permissions, validation, storage, imports and transactions.
- `lib/domain.ts`: inventory, overlap and recommendation logic.
- `lib/csv.ts`: CSV parser.
- `db/schema.ts` and `drizzle/`: schema and database overlap triggers.
- `tests/`: domain, CSV and database concurrency tests.
- `DEMO_GUIDE.md`: judging flow and feature mapping.

## API

GET `/api/state` returns campus records; student roster is administrator-only and the audit log is faculty/admin-only. GET `/api/blueprint/:id` reads an uploaded file.

POST `/api/session` switches the explicit demo role. `/api/recommend` checks alternatives and later slots. `/api/book`, `/api/reschedule`, `/api/cancel`, `/api/notice` require faculty/admin permission; existing bookings can be changed only by the owner or admin. `/api/report` records feedback. `/api/resolve`, `/api/room`, `/api/import`, `/api/blueprint` require admin. Mutations are server-validated and audited; upload routes check allowed type, file signature and size.

## Submission

The hosted site is owner-private by default. Confirm judge access or explicitly change sharing before submitting a link. The source is versioned in Git and the downloadable source archive includes setup instructions. A GitHub repository has not been created automatically; upload the source to your own repository if the organizer requires a GitHub URL. Never commit `.env*`, `.dev.vars*`, `.wrangler`, `node_modules` or local runtime state.
