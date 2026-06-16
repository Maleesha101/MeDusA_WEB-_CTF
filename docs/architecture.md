# Architecture Explanation

## System Shape

MEDUSA is a single web application with one frontend, one backend, one shared database, and one reverse proxy. Chambers are not split into microservices.

## Request Flow

1. Player opens the Next.js frontend.
2. The frontend logs in the team through the Express API.
3. The backend issues a session cookie and serves chamber data.
4. Chamber actions call specific API endpoints that contain the intended weaknesses.
5. Solves are recorded in PostgreSQL and reflected in the scoreboard.

## Backend Responsibilities

- Authentication
- Chamber metadata
- Submission scoring
- Scoreboard aggregation
- Admin control routes
- Challenge-specific vulnerable workflows
- Traffic logging

## Frontend Responsibilities

- Immersive landing page
- Team login
- Temple map dashboard
- Chamber detail pages
- Hint display
- Admin console UI

## Database Responsibilities

- Persist teams
- Persist chambers and flags
- Persist solves
- Persist transactions, comments, chat, and logs for the challenge chains

## API Endpoints

### Mirror URL Filtering

The **`fetchMirrorTarget`** helper in `backend/src/challenges.ts` originally performed a simple substring check (`url.includes(value)`) against a block list of unsafe hostnames and protocols. This caused legitimate sub‑domains such as `127.0.0.1.nip.io` to be incorrectly blocked, breaking the SSRF‑prone mirror bypass test.

**Current implementation** parses the URL, extracts the **hostname** and **protocol**, and then checks those *exact* values against the block list:

```ts
const blocked = [
  '127.0.0.1', 'localhost', '0.0.0.0', '::1',
  '169.254.169.254', 'file:', 'gopher:'
];

if (blocked.includes(hostname) || blocked.includes(protocol)) {
  throw new Error('Blocked by mirror filter');
}
```

- **Why hostname‑exact matching?**
  - Prevents false positives where a blocked string appears as a prefix of a legitimate domain (e.g., `127.0.0.1.nip.io`).
  - Keeps the original security intent—blocking direct references to loopback or internal‑only resources—while allowing external sub‑domains that merely contain those strings.

This change is covered by the new unit test `mirror-subdomain.test.ts`, which asserts that a request to `http://127.0.0.1.nip.io:4000/healthz` returns **200 OK**.

---

## Changelog

- **2026‑06‑16** – Updated `fetchMirrorTarget` to use hostname‑exact matching and added unit test `mirror-subdomain.test.ts` to verify sub‑domain allowances.
- Adjusted Treasury audit report query to return the *oldest* audit token (`ORDER BY created_at ASC`).