# Healthify project changes

This record covers the available Git history from the initial project through commit 26bfb11, plus the current uncommitted username and JSON-storage work. Historical changes are based on commit history and existing documentation; they have not all been retested in this session. Merge commits and intermediate implementations are not separate current features.

## Initial application

- Built a React, TypeScript and Vite food-exploration nutrition game for children.
- Added Home, learning, tutorial, food selection and food-specific game screens, plus About, Terms and Contact pages.
- Added 3D foods, cutting interactions, microscope exploration, quizzes and animated feedback.
- Used Zustand for application state and React Router for navigation.

## Learning, navigation and interface

- Added tissue views beside cut food models, including a science view alongside the cartoon representation.
- Added a guided website tour, Home side drawer, skip/rotate controls and a chart.
- Added Home breadcrumbs and interactive navigation trails; moved breadcrumbs to the top-left.
- Adjusted Let's Play navigation and made the automatic tour a first-visit experience.
- Added category tabs, a four-column food grid, card lock badges and letter badges on quiz answers.
- Improved backgrounds with mesh gradients, dot patterns, ambient lighting and translucent cards.
- Updated animations and food previews when changing pages.

## Gameplay and visual bug fixes

- Fixed the bottom speech bubble overlapping the scale bar.
- Recorded food categories when food URLs are opened directly.
- Fixed category selection state in the game store.
- Fixed guided-tour popup positioning and added positioning regression tests.
- Fixed procedural model visibility and removed the flash of 2D icons before 3D previews.
- Improved rendering for 12 foods and removed cutting/knife interactions for foods designed to remain open or whole.
- Used 3D food models in microscope cross-sections and prevented inappropriate 2D splitting of uncut foods.
- Corrected geometry bounds and food scaling so food sits on the cutting board.
- Fixed camera framing, clipped board/pedestal edges and cutting-button overlap.
- Corrected 3D cut views and improved scanned-food information markers.
- Added bowl splitting support and bowl colours, with adjustments to several food and cross-section models.
- Keyed game routes by food ID so changing between food routes remounts the game rather than retaining stale screen state.

## Loading and performance

- Optimized thumbnail rendering and preview caching, reduced snapshot cloning lag and improved transitions.
- Added a kitchen-themed preloader and staged model loading.
- Reduced initial priority loading to four essential models with a timeout rather than waiting for all assets.
- Removed eager/background model-loading patterns that caused startup congestion and stutter.
- Added demand-driven preview rendering to reduce idle GPU work.
- Added idle-time, page-by-page preview warmup.
- Disabled thumbnail antialiasing, capped pixel density, memoized thumbnails and tracked downloaded bytes.
- Throttled tour animation-frame work and fixed warmup concurrency.
- Preloaded game models on card hover/click and page changes.
- Cached food-model geometry and added canvas loading placeholders.
- Ignored model-file writes in Vite's watcher to avoid Windows file-locking errors.

## Profiles and leaderboard

- Introduced explorer profiles, persistent scores and a leaderboard; an early commit included login work, but the current experience opens on Home without login.
- Added randomly generated explorer names and a first-visit name confirmation popup.
- Initially limited username editing to one save; the current implementation allows repeated changes.
- Username changes preserve points and remove the previous local leaderboard entry.
- Validate username format and reject duplicate browser-local names case-insensitively.
- Show the username and Change username action in the Home side drawer.
- Removed the floating username-edit button that overlapped other screens.
- Persist profiles and scores in localStorage and refresh across browser tabs.
- Preserve temporary play when browser storage is unavailable and report failed name saves.
- Rank by points and give equal scores the same rank.

## Shared JSON data ? current work

- Added public/data/players.json with versioned username-keyed player objects.
- Added a shared snapshot store, separate from local player profiles.
- Merge published rankings with local profiles; local records take precedence for matching names.
- Fetch snapshots at startup and every 15 seconds while visible, when returning to the tab and on reconnection.
- Update displayed rankings without reloading the page.
- Cache the latest valid shared snapshot for offline use.
- Validate snapshot format, username keys, safe integer scores and duplicate names.
- Retain the previous snapshot on failed requests or invalid data; remove deleted shared records after a successful fetch.
- Add request timeouts and abort polling requests when the app unmounts.
- Add Download rankings JSON to prepare a file for review and redeployment.
- Ignore public/data changes in Vite's watcher so updating JSON does not force a development page reload.

## Tooling, tests and documentation

- Fixed production TypeScript checking that previously did not run correctly.
- Fixed the FoodModel stage-prop type definition.
- Added tests for game category state, tour positioning, preview building/caching and player persistence.
- Updated player tests for repeated renames and interactions between browser tabs.
- Added shared-snapshot tests for validation, merging, caching and failure handling.
- Added TECH_STACK.md, a build/prompt sharing guide and detailed explanations of game-screen and performance fixes.
- Updated README instructions for username editing, JSON publication, local storage and future backend security.
- Latest targeted verification: 10 player tests and 3 shared-snapshot tests passed. Production build and lint completed with warnings. Historical test suites were not rerun as part of this documentation update.

## Current limitations

- Local changes do not automatically upload to the published JSON file.
- Publishing shared changes requires reviewing/merging JSON and rebuilding/redeploying to a configured host.
- Data polling updates rankings, not already-loaded application code.
- Published JSON is public; use nicknames and scores only.
- Browser scores are editable and unverified. Secure authentication, globally unique usernames and trusted scores require a backend.
- The current username and JSON work is uncommitted; no deployment was performed in this session.

## Recorded commit history

The first-parent history below includes original commit titles; titles describe work at that point and may refer to behaviour later changed.

- `38fa526` ? Healthify: 3D food-exploration nutrition game for kids
- `a2b46ef` ? Show the tissue itself beside the cut model
- `5d040b9` ? Add a science view of the tissue beside the cartoon one
- `73b9651` ? Stop the bottom speech bubble landing on the scale bar
- `73eaa54` ? Record the food category when a food URL is opened directly
- `5f9848d` ? Add guided tour, side drawer, skip/rotate controls, and a real chart
- `50a7b13` ? Fix production build: type-check was silently a no-op all along
- `5d561e8` ? Add TECH_STACK.md documenting frameworks and tooling
- `a7f474c` ? create branch: new
- `70f8bd9` ? update animation
- `3ff8eda` ? Render On pagination changes
- `31ff41b` ? Merge branch 'main' into Render-changes
- `33d8a2c` ? fix(types): allow stage prop in FoodModel definition
- `24670bb` ? perf(preview): optimize 3D thumbnail rendering, remove snapshot cloning lag, prevent cache eviction, and add smooth transition
- `b6a0780` ? fix(render): fix procedural models visibility and eliminate 2D icon flash
- `cc29bb7` ? Elevate app background with modern mesh gradients, subtle dot grid, ambient glow, and glassmorphic cards
- `b20dcf0` ? feat(nav): add Breadcrumbs with Home option and interactive navigation trails across screens
- `25b97fd` ? fix(nav): move breadcrumbs to top-left and navigate Let's Play directly to foods
- `3f3f622` ? feat(onboarding): show website tour trip only on first visit and direct Let's Play to foods for returning players
- `90bc007` ? feat(3d): enhance renders of 12 foods and eliminate knife/cutting for open foods
- `b0548f3` ? fix(micro): use 3D models in microscope cross-section and prevent 2D cut split on uncut foods
- `0487454` ? feat(ui): add category tabs, fixed 4-col grid, card lock badges, and polished quiz options with letter badges
- `60ea2e6` ? fix(game): seat food flush on cutting board, fix camera framing, and eliminate pedestal clipping and button overlap
- `12d8e9f` ? feat(perf): add unique kitchen preloader for initial 18 models on Let's Play and lazy background streaming
- `8e5c3df` ? perf: reduce initial preloader to 4 essential models with 1.4s max timeout for fast startup
- `8284872` ? docs: add CHANGES_EXPLAINED.md detailing game screen fixes and 3D performance architecture
- `af4756a` ? perf: eliminate deployment lag with demand-driven rendering and stop background GLTF thrashing
- `5b8cd21` ? perf: idle-time page-by-page warmup of all 3D model previews after initial splash load
- `db351d8` ? perf: antialias off for thumbnails, dpr cap 1.5, real byte tracking, memo FoodThumbnail3D, throttle tour rAF, fix warmup concurrency bug
- `4cea7d9` ? fix: game screen model loads instantly via preloadForGame wired to food card hover/click/page-change
- `ce17e17` ? perf: cache 3D food model geometry and add canvas loading placeholders
- `3a82d54` ? docs: add a build guide and prompt pack for sharing
- `03e9068` ? Added Leaderboard and Login
- `4e36e50` ? fix Food Catetorgy Selection
- `d2db04f` ? Added Pop Up and single Edit per username
- `8b94721` ? Fix Tutorial
- `26bfb11` ? Fix 3D cut views, add info markers to scanned foods, colour bowls (#3)
