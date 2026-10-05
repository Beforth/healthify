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
under `healthify_player_<username>`. The assigned name is displayed on Home and cannot be edited or switched in the app.
There is no login screen or option to create extra profiles. No password or personal information is required.

Open `/#/leaderboard` to see local profiles ordered by score. Equal scores share
a rank. The existing quiz rules remain: +10 for a correct answer, -5 for the first
wrong attempt, and no extra deduction for subsequent wrong retries. Playing a
question again can earn points again, as in the original game.

This is a browser-local leaderboard, not a shared online leaderboard or secure
authentication system. Clearing browser storage removes profiles and scores.
Cross-device rankings and centrally enforced unique names require a backend.
When storage is unavailable, play continues with temporary in-memory profiles.

Run the profile persistence tests with:
`node --experimental-strip-types --test tests/playerStore.test.mjs`
