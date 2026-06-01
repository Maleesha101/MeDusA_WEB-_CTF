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
