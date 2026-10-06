# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
# Explorer profiles and leaderboard

The app opens directly on Home and automatically assigns a random explorer name, saves it as `healthify_username`
in localStorage, and reuses it on future visits. Each profile's score is saved
under `healthify_player_<username>`. On Home, a first-visit popup lets the child keep or edit the assigned name. The current username and Change username option are available in the Home side drawer after onboarding. Saving preserves points, removes the previous leaderboard entry, and allows further edits. The tour starts after saving.
There is no login screen or option to create extra profiles. No password or personal information is required.

Open `/#/leaderboard` to see local profiles ordered by score. Equal scores share
a rank. The existing quiz rules remain: +10 for a correct answer, -5 for the first
wrong attempt, and no extra deduction for subsequent wrong retries. Playing a
question again can earn points again, as in the original game.

The leaderboard combines a shared, published JSON snapshot with browser-local profiles.
Clearing browser storage removes local profiles and scores. Automatic cross-device
writes and centrally enforced unique names require a backend.
When storage is unavailable, play continues with temporary in-memory profiles.

Run the profile persistence tests with:
`node --experimental-strip-types --test tests/playerStore.test.mjs`

## Shared data and production security

localStorage is a browser-local demo cache. It cannot share data between computers or enforce trustworthy scores. Never commit real user records or private credentials to Git.

A shared version needs a hosted database and authentication service, for example Supabase:

- Use immutable account IDs. Username changes update a profile field; scores stay linked to the ID. Enforce username validation and case-insensitive uniqueness in the database.
- Authenticate profile writes and enforce ownership with row-level security and column permissions. Owners may update usernames, but never IDs or scores.
- Expose only nicknames, points and ranks in a dedicated leaderboard endpoint. Keep account details and activity private.
- Validate answers and calculate points on the server. Reject client totals, rate-limit requests and prevent duplicate awards. Existing browser scores are unverified and should not enter trusted rankings.
- Keep database secrets and service-role keys on the server. Browser publishable keys require correctly configured grants and row-level security. Use HTTPS, input validation, restrictive security headers and dependency updates.
- Give collaborators separate accounts with least-privilege access. Use a shared development database with synthetic data, separate from production. Configure backups, access logs and retention/deletion rules.
- Anonymous authentication can preserve the no-login experience; cross-device recovery requires sign-in or account linking.

Backend integration is not configured in this repository. Current player edits remain browser-local; published rankings are shared through the JSON snapshot described below.

References: [Supabase API security](https://supabase.com/docs/guides/api/securing-your-api), [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [OWASP browser storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html).

## JSON snapshots and local storage

The app fetches `public/data/players.json` on startup, every 15 seconds while visible, when returning to the tab, and when reconnecting. It updates React state without reloading the page. Vite ignores data-file changes to avoid a development full-page reload.

The file uses username keys:

```json
{ "version": 1, "players": { "HappyPanda": { "username": "HappyPanda", "score": 50 } } }
```

Shared records are cached separately in localStorage for offline use. Local profiles and scores remain separate and take precedence over shared records with the same name (case-insensitive). Shared records never become the current player's account. Removed shared entries disappear on the next successful fetch. Invalid files retain the previous snapshot.

To publish an update: download rankings JSON from the leaderboard, review/merge records from other browsers as needed, replace `public/data/players.json`, run `npm run build`, and redeploy the built site to your existing host. Open pages pick up the newly served JSON within about 15 seconds. Configure the host/CDN to avoid caching `data/players.json` (Cache-Control: no-store) and purge stale CDN copies if necessary; requests also bypass browser caching with a timestamp.

A static frontend cannot write back to its deployed JSON or redeploy itself. Local changes are not automatically uploaded or shared. JSON snapshots are public and scores are unverified; include nicknames and points only. This polling updates data, not already-loaded application code. No hosting target or deployment credentials are configured by this change.

## Complete project change history

See [PROJECT_CHANGELOG.md](docs/PROJECT_CHANGELOG.md) for features, bug fixes, performance improvements and the recorded commit history from the start of the project.
