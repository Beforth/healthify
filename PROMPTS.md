# Healthify — Build Guide & Prompt Pack

Everything needed to understand, rebuild, or continue this project. Share this file with a
developer, a designer, or paste sections of it into an AI coding tool.

**Live repo:** https://github.com/Beforth/healthify
**Last surveyed:** 1 October 2026

---

## Table of contents

1. [What Healthify is](#1-what-healthify-is)
2. [The client brief](#2-the-client-brief)
3. [Where the nutrition data comes from](#3-where-the-nutrition-data-comes-from)
4. [Current state of the build](#4-current-state-of-the-build)
5. [Tech stack](#5-tech-stack)
6. [The master prompt](#6-the-master-prompt)
7. [Step-by-step build guide (10 stages, each with a prompt)](#7-step-by-step-build-guide)
8. [Data model reference](#8-data-model-reference)
9. [Design system](#9-design-system)
10. [Hard-won technical lessons](#10-hard-won-technical-lessons)
11. [Running and deploying](#11-running-and-deploying)
12. [Known gaps and open decisions](#12-known-gaps-and-open-decisions)

---

## 1. What Healthify is

A browser game that teaches children what is actually inside their food.

A child picks a food, chooses what they want to investigate (sugar, fat, calories, or
vitamins), cuts the food open with a knife in 3D, inspects the cross-section and the
cell structure under a microscope, then answers one question about it. Correct answers
earn points and a celebration; wrong answers get encouragement and a retry. The game then
pushes them toward the opposite category — healthy, then junk, then healthy — so they
build a comparison rather than just collecting facts.

- **End users:** children, roughly 6–11.
- **Immediate purpose:** an investor-facing prototype.
- **Architecture:** frontend only. No backend, no database, no accounts, no API keys.

**The core teaching idea** is that a number on a label means nothing to a child. "A donut
has 9 g of sugar" is forgettable. Seeing the sugar crystals under a lens, and then
watching an energy curve spike and crash, is not. Every design decision follows from that.

---

## 2. The client brief

Transcribed from `HEALTHIFY ( draft ).pdf`. This is the authoritative specification.

### Slide 1 — Splash

> Background must be in green and some icon like microscope, fruits & games label over moving.

### Slide 2 — Core idea

> Present a core idea with big headlines.
> Example: explore food in 3D. Learn nutrition through play. Features like 3D models,
> quizzes, and points. Benefits.
> Keep the background bright and cheerful, and include a small preview icon such as a child
> cutting a food item or peering through a microscope. Keep it short, clean, and engaging.

### Slide 3 — Tutorial

> **Step 1:** Choose a food
> **Step 2:** Select the option that you think is right
> **Step 3:** Tap the knife to cut virtually
> **Step 4:** Use a microscope to zoom in and view content.

### Slide 4 — Food selection

> Choose your food to play further. No matter healthy or junk food.
> Options of food to select: Mango, apple, banana, chocolate bar, ice-cream, doughnut.
> The child will select one of them to play further.

### Slide 5 — The question flow

> Let me first choose the option about content present in any food (like fat, sugar,
> calories, vitamin & minerals)
> - Next if possible to cut that food give him knife option
> - Next give the microscope access
> - Next if he need then give more details of that food ask in question and make an
>   animation to show the effect of junk and healthy food
> - If correct give him points and cheerful smile
> - If incorrect ask him to try again and encourage him to stay on game
>
> Next take him to the alternate food if first [was healthy, give junk, and so on]

**Note on the food list:** the brief names six foods. The build has since grown well beyond
that list (see §4). Banana and ice-cream were deliberately excluded by the client in a later
conversation.

---

## 3. Where the nutrition data comes from

The file `Question set 1 .pdf` is **not** a list of written questions — it is a nutrition
composition sheet. Each line is a real measured value, and the quiz turns each line into a
question by pairing the true value with one plainly wrong one.

> **Example:** the sheet says a donut contains `Refined flour (maida) 24 g`.
> The question becomes *"Most of a donut is refined flour (maida). How much is in one donut?"*
> with options **24 g** (correct) and **50 g** (wrong).

The original sheet covers eight foods:

| # | Food | Serving | Key figures |
|---|---|---|---|
| 1 | Donut | 60 g | maida 24 g · sugar 9 g · fats (butter) 6 g |
| 2 | French fries | 100 g | potatoes 75 g · oil 12 g · salt 1.5 g |
| 3 | Chocolate bar | 100 g | cocoa powder 20 g · sugar 40 g · cocoa butter 18 g · emulsifier 2 g · saturated fat 19 g |
| 4 | Rasgulla | 45 g | chhena 15–18 g · sugar syrup 25–28 g · sugar 11–13 g · protein 2 g · fat 1–2 g · carbs 17–20 g · fibre 0 g · 85–100 kcal |
| 5 | Apple | 180 g | carbs 25 g · sugars 19 g · fibre 4.5 g · vit C 8 mg · potassium 195 mg · 95 kcal |
| 6 | Banana | 188 g | water 88 g · sugars 14 g · fibre 3.1 g · carbs 27 g · protein 1.3 g · potassium 420 mg · vit C 10 mg |
| 7 | Dragon fruit | — | water 170 g · sugars 14 g · fibre 4 g · carbs 22 g · protein 2 g |
| 8 | Cotton candy | 30 g | sugar 28 g · protein ~0 g · fat ~0 g · fibre ~0 g |

Item 9 on the sheet is blank.

> ⚠️ **Mango is not on this sheet**, even though the client brief names it. Mango's figures in
> the app are researched stand-ins and are flagged in code with `isPlaceholder: true`. Any
> food added beyond the eight above is in the same position — double-check before quoting
> those numbers to a client.

**Both PDFs are scans with no text layer.** To read them you need OCR or page rendering:

```bash
brew install poppler
pdftoppm -png -r 130 "HEALTHIFY ( draft ).pdf" draft
```

---

## 4. Current state of the build

Verified against the repository on 1 Oct 2026.

| Thing | Count / value |
|---|---|
| Foods | **66** |
| Quiz questions | **198** (3 per food, one per topic) |
| Hand-built procedural 3D models | **16** |
| Photoscanned `.glb` models | **61** (in `public/models`, ~90 MB) |
| Bespoke microscope cross-sections | **18** |
| Foods that cannot be cut (liquids, grains, pulses) | **23** (`NO_CUT_FOODS`) |
| Routes | 8 |
| Commits | 32 |

### Routes

| Path | Screen |
|---|---|
| `/` | Splash |
| `/learn` | Core idea |
| `/tutorial` | How to play |
| `/foods` | Food picker |
| `/play/:foodId` | The game |
| `/about`, `/terms`, `/contact` | Static pages |

Routing uses **`HashRouter`**, so URLs look like `/#/play/apple`. This is deliberate — it
means static hosts need no rewrite rules (see §11).

### The game loop

`choose-topic` → `cut` → `microscope` → `quiz` → `result`

Held in `src/store/gameStore.ts`. The store also tracks `lastCategoryPlayed`, which drives
the healthy/junk alternation: the food picker locks every card that is not the required
next category.

### Two kinds of 3D model

1. **Hand-built** (`HAND_BUILT` in `foodRegistry.tsx`) — written in code as Three.js
   geometry. Donut, apple, mango, chocolate bar, burger, egg, carrot, etc. These can be cut
   into two separating halves with matching cut faces.
2. **Photoscanned** (`SCANNED`) — `.glb` files loaded from `public/models`. A scan is only an
   outer shell, so cut-face colours (`rim`, `flesh`, `heart`) are specified per food in the
   registry.

### The microscope screen

Two panels side by side (stacking on phones):

- **Left — "Your cut, in 3D":** the cut model, with pulsing tappable markers stuck onto the
  model itself. Tapping one grows it, fades the others back, and opens a fact card.
- **Right — the tissue:** a procedurally generated cell field with a **Fun view / Science
  view** toggle. Fun view has cartoon cells with blinking faces and speech bubbles; Science
  view is monochrome with anatomical names on leader lines and a scale bar.

> The science view is a **drawing**, not a photograph, and says so on screen. A real SEM
> micrograph is a copyrighted photograph of an actual sample. Never present it as one.

### After a correct answer

`BodyEffect.tsx` draws an energy curve for the hour after eating: junk spikes and crashes,
healthy climbs and holds. This is the brief's "animation to show the effect of junk and
healthy food".

---

## 5. Tech stack

| Tool | Version | Why |
|---|---|---|
| React | 19.2 | UI |
| TypeScript | 6.0 | Types |
| Vite | 8.3 | Dev server and build |
| React Router | 7.18 | Routing (HashRouter) |
| Zustand | 5.0 | Game state |
| Three.js | 0.186 | 3D |
| @react-three/fiber | 9.7 | React renderer for Three.js |
| @react-three/drei | 10.7 | Three.js helpers (`Environment`, `Billboard`, `RoundedBox`) |
| three-stdlib | 2.36 | GLTF loading |
| Framer Motion | 13.3 | Animation |
| Recharts | 3.10 | Charts |
| Lucide React | 1.46 | Icons |
| Oxlint | 1.81 | Linting |

Plain CSS with custom properties. **No CSS framework.**

---

## 6. The master prompt

Paste this into an AI coding tool to generate the whole project from scratch.

````markdown
Build "Healthify", a frontend-only educational web game that teaches children aged 6–11
what is inside their food. It is an investor-facing prototype. No backend, no database,
no authentication, no API keys.

## Stack
React 19 + TypeScript + Vite. React Three Fiber and @react-three/drei for 3D. Zustand for
state. Framer Motion for animation. react-router-dom with HashRouter. lucide-react for
icons. Plain CSS with custom properties — no Tailwind, no component library.

## Screens
1. `/` Splash — green gradient, the title "Healthify", the tagline "Discover what's inside
   your food!", a floating microscope / fruit / gamepad badge animation, and a "Let's Play!"
   button.
2. `/learn` Core idea — big headline "Explore Food in 3D", four benefit cards (explore in
   3D, learn through play, quizzes and points, real benefits).
3. `/tutorial` How to play — four steps, one card at a time with dot pagination:
   choose a food → pick the option you think is right → tap the knife to cut → use the
   microscope to look inside.
4. `/foods` Food picker — a grid of food cards, each showing a 3D thumbnail, the name, and
   a Healthy/Junk tag.
5. `/play/:foodId` The game — the five-step loop below.

## The game loop
choose-topic → cut → microscope → quiz → result

- **choose-topic:** the child picks one of sugar / fat / calories / vitamins & minerals.
  Only offer the topics that food actually has a question for.
- **cut:** the food sits on a cutting board in 3D with a knife above it. Dragging the knife
  down (or pressing the button) slices the food into two halves that separate, revealing
  matching cut faces.
- **microscope:** two panels side by side, stacking on narrow screens. Left is the cut 3D
  model with pulsing, tappable markers stuck onto the model itself — tapping one makes it
  grow, fades the others back, and opens a fact card in that marker's colour. Right is a
  procedurally generated cell-structure view with a "Fun view / Science view" toggle.
- **quiz:** one question with two options and a Submit button.
- **result:** correct → balloons, confetti, "+10 points", and an animated energy curve
  showing what the food does inside the body over the next hour (junk spikes then crashes;
  healthy climbs and holds). Wrong → a red shake, the wrong option flagged, encouragement,
  and a Try Again button.

After the result, send the child back to the picker, where every food of the category they
just played is locked, so healthy and junk alternate.

## Data
One `FoodItem` per food holding: id, name, category ('healthy' | 'junk'), servingSize,
ingredients, nutrition rows, and a quiz array. Each quiz entry has a topic, question, two
options, correctIndex, and a kid-readable explanation. Every number must come from a real
nutrition source; pair the true value with one plainly wrong one so the child chooses
between them. Flag any food whose figures are not from the source sheet.

## Rules that matter
- **Children are the users.** No nutrition-science vocabulary anywhere a child can see.
  "Skin & Pectin Fiber" is wrong; "The Red Skin" is right. Put grams in a small badge, never
  in the headline.
- **Discoverability beats explanation.** A child will not read an instruction. Anything
  tappable must pulse, glow, or carry a "+".
- **Tap targets must be far larger than the visible dot** — small fingers, small screens.
- **Everything must work at 375 px wide.**
- **No image assets for the microscope view** — generate cell structure procedurally from a
  jittered hex grid. Real micrographs are copyrighted photographs.
- **No emoji.** Use lucide icons consistently.
````

---

## 7. Step-by-step build guide

Ten stages. Each is independently shippable, and each has a prompt you can paste. Build in
this order — later stages depend on earlier ones.

### Stage 1 — Scaffold and design system

```bash
npm create vite@latest healthify -- --template react-ts
cd healthify
npm install three @react-three/fiber @react-three/drei three-stdlib \
            zustand framer-motion react-router-dom lucide-react
```

> **Prompt:** Set up `src/index.css` with CSS custom properties for a bright, child-friendly
> green theme: `--green-dark #1f7a4d`, `--green #2ecc71`, `--green-light #eafff2`, plus
> yellow, orange and pink accents, an ink colour for text, a card background, a soft shadow
> and a 20 px radius. Add a `.screen` class that fills the viewport, centres its content, and
> paints a layered mesh-gradient background with a faint dot grid and a slow ambient glow.
> Add a `.card` class with glassmorphism, and a `.btn` class with a chunky offset shadow that
> presses down on `:active`. Mount the app with `HashRouter`.

### Stage 2 — Data model

> **Prompt:** Create `src/data/nutritionData.ts` exporting a `FoodItem[]`. Types:
> `FoodCategory = 'healthy' | 'junk'`, `QuizTopic = 'fat' | 'sugar' | 'calories' | 'vitamins'`.
> Each `FoodItem` has id, name, category, servingSize, an optional `isPlaceholder` flag,
> `ingredients`, `nutrition`, and `quiz`. Each `QuizQuestion` has topic, question, a
> two-element options array, correctIndex, and a kid-readable explanation. Add a
> `getFoodById` helper. Start with donut, chocolate bar and apple using the real figures from
> the source sheet; pair each true value with one plainly wrong one.

### Stage 3 — The five static screens

> **Prompt:** Build Splash, CoreIdea, Tutorial and FoodSelect as described in the master
> prompt, plus a `BackButton` that uses `location.key !== 'default'` to decide whether to go
> back in history or fall back to a given route. Wire them up in `App.tsx`. Animate entrances
> with Framer Motion. Use lucide icons — no emoji.

### Stage 4 — The 3D canvas

> **Prompt:** Create `FoodCanvas.tsx`: a react-three-fiber `<Canvas>` with
> `camera={{ position: [0, 1.25, 5.6], fov: 46 }}`, ambient plus two directional lights, a
> drei `<Environment preset="apartment" background={false} />`, and `<OrbitControls>` with
> panning disabled and clamped polar angles. Add an optional round cutting-board pedestal and
> a cheap static ground shadow. Accept `height`, `width`, `autoRotate` and `controlsEnabled`
> props.

### Stage 5 — Procedural food models

> **Prompt:** Create `halfSolid.ts`, a shared builder that takes a radius and a deform
> function, generates half a sphere, applies the deform per vertex, collects the seam ring,
> and fan-triangulates a flat cut face that always matches the deformed silhouette. Then
> build `AppleModel.tsx` and `MangoModel.tsx` on top of it, each with its own deform shaping
> the profile, vertex-colour gradients for the skin, and cut-face detail (rim, flesh, core,
> seeds). Each model takes a `cutProgressRef` and separates its two halves as that ref goes
> from 0 to 1.

### Stage 6 — The knife and the cut

> **Prompt:** Build `Knife3D.tsx` — a blade and handle that the user drags downward. Use
> native `window` pointermove/pointerup listeners rather than React Three Fiber's synthetic
> events, because fast drags are otherwise lost. Write progress into a
> `MutableRefObject<number>` rather than React state so the cut does not re-render every
> frame. Add a slice-impact flash when the cut completes.

### Stage 7 — The microscope: cut model with markers

> **Prompt:** Build `Hotspot.tsx`: a drei `<Billboard>` marker stuck to a point on a 3D
> model. It needs a soft radial-gradient glow, an expanding ripple, a white collar so it
> stays legible on both dark chocolate and pale flesh, a glossy highlight, and a white "+"
> that becomes a "–" when open. Give it `depthTest: false` and a high `renderOrder` so it
> cannot be half-buried by its own geometry at grazing angles. Make the invisible tap target
> roughly three times the visible dot. When one marker is open, the others shrink and fade.
> Then build `CrossSectionShell.tsx`, which renders the cut model plus its markers, a row of
> colour-matched chips, and a fact card — where tapping a marker and tapping its chip are the
> same action.

### Stage 8 — The microscope: cell structure

> **Prompt:** Build `microStructures.ts` and `CellView.tsx`. For each food define a palette,
> a cell radius, a corner radius (0.5 = round bubbles for a donut crumb, 0.12 = angular
> crystals for chocolate), probabilities for air pockets and inclusions, whether it has a
> vascular strand, and three labels. `CellView` generates a jittered hex grid inside a
> circular lens clip, rounds every cell's corners, assigns kinds, scatters starch grains, and
> gives a few cells blinking faces. Seed the RNG so the tissue is identical on every render.
> Add a `variant` prop: `cartoon` draws it in colour with speech bubbles; `science` repaints
> the same tissue monochrome with grain, anatomical names on leader lines, and a scale bar —
> captioned "Drawn illustration of real structure — not a photograph".

### Stage 9 — Quiz, celebration, and the body effect

> **Prompt:** Build the quiz and result steps in `GameScreen.tsx`. Wrong answers keep the
> chosen option flagged in red with an X across the retry. Build `Celebration.tsx` —
> full-screen balloons rising, a few popping, confetti falling, `pointerEvents: none`,
> `zIndex: 60`. Build `BodyEffect.tsx` — an SVG energy curve for the hour after eating, drawn
> with an animated `pathLength` and a dot riding along it, built from Catmull-Rom points
> converted to cubic Béziers. Junk spikes and crashes in red; healthy climbs and holds in
> green. Under it, three staggered "beats" explaining what happens.

### Stage 10 — Alternation, polish, deploy

> **Prompt:** Add `lastCategoryPlayed` to the Zustand store and a `nextRequiredCategory`
> helper. In the food picker, disable and dim every card whose category is not the required
> one. Record the category on `GameScreen` mount — not only in the picker — so that opening a
> `/play/<food>` URL directly still counts. Key the game route on `foodId` so navigating
> between two foods fully remounts and no stale state survives.

---

## 8. Data model reference

```ts
export type FoodCategory = 'healthy' | 'junk';
export type QuizTopic = 'fat' | 'sugar' | 'calories' | 'vitamins';

export interface IngredientLine { name: string; amount: string }
export interface NutritionFact   { label: string; value: string }

export interface QuizQuestion {
  topic: QuizTopic;
  question: string;
  options: string[];      // exactly two
  correctIndex: number;
  explanation: string;    // kid-readable, quotes the real figure
}

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  servingSize: string;
  isPlaceholder?: boolean;   // figures are NOT from the client's source sheet
  ingredients: IngredientLine[];
  nutrition: NutritionFact[];
  quiz: QuizQuestion[];
}
```

### Adding a new food — checklist

1. Add a `FoodItem` to `src/data/nutritionData.ts` with three questions (one per topic).
2. Either write a procedural model and register it in `HAND_BUILT`, **or** drop a `.glb` into
   `public/models` and add a `SCANNED` entry with `rim`, `flesh` and `heart` cut-face colours.
3. If the food cannot sensibly be cut (a liquid, a grain, a pulse), add its id to
   `NO_CUT_FOODS`.
4. Optionally add a bespoke cross-section component to `FOOD_CROSS_SECTIONS`.
5. Optionally add a `MICRO` entry in `microStructures.ts` for the cell view.
6. Optionally add a size to `FOOD_SIZES`.

---

## 9. Design system

```css
--green-dark:    #1f7a4d;
--green:         #2ecc71;
--green-light:   #eafff2;
--bright-yellow: #ffd166;
--bright-orange: #ff8c42;
--bright-pink:   #ff6b9d;
--ink:           #1b3a2b;
--ink-soft:      #4a6357;
--card-bg:       #ffffff;
--shadow:        0 10px 30px rgba(0, 0, 0, 0.12);
--radius:        20px;
```

**Font:** `'Baloo 2', 'Comic Sans MS', system-ui, sans-serif` — rounded and friendly.

**Classes:** `.screen` (full-height, centred, mesh-gradient background with dot grid and
ambient glow), `.card` (glassmorphic), `.btn` (chunky offset shadow, presses down on
`:active`), `.btn.secondary`.

**Voice:** short sentences, no nutrition jargon, numbers demoted to badges. Compare:

| ❌ Don't | ✅ Do |
|---|---|
| "Skin & Pectin Fiber — ≈4.4g Fiber" | "The Red Skin — 4.5 g fibre" |
| "soluble pectin fiber and polyphenol antioxidants" | "Fibre is like a little broom that keeps your tummy working properly." |

---

## 10. Hard-won technical lessons

These cost real debugging time. Read before touching the 3D code.

**A Three.js torus is born standing on its edge.** Its hole points at the camera, like a
wheel. It needs roughly −90° about X to lie flat. A donut that looks "vertical" is almost
always this.

**`fov` is vertical and fixed.** Making a canvas taller in pixels does **not** reveal more of
the scene vertically. If something is clipped, change the fov, the camera distance, or the
target — resizing the canvas will not help.

**Rotating a radially symmetric primitive about its own long axis does nothing.** This bit us
three separate times — a knife handle, a mango pit, and a torus. If a cylinder or capsule
"won't rotate", check which axis you are turning it about.

**`metalness > 0` renders nearly black without an environment map.** Add drei's
`<Environment />` or drop the metalness.

**Cut-face orientation:** with `THREE.SphereGeometry(r, w, h, -PI/2, PI)`, the solid occupies
`x ≤ 0` and the flat cut face's normal points **+X**. Getting this backwards means the
microscope shows the skin instead of the cut.

**A left/right cut forces a left-right symmetric silhouette.** Any asymmetric character in a
fruit's shape must come from along its length, not from a sideways bend — the bend will be
cancelled by the mirror.

**Markers on a curved surface need `depthTest: false`.** A billboard sitting exactly on a
surface gets half-buried by its own geometry near the silhouette and simply disappears. A
marker a child cannot see is a marker they cannot tap.

**Deep links bypass the picker.** Anything the food picker sets in the store must also be set
on game-screen mount, or a shared link quietly breaks the healthy/junk alternation.

**The browser console buffer does not clear** across navigations or new tabs during
development. Stale errors persist and will send you chasing ghosts — verify a module
actually compiles with `curl -o /dev/null -w "%{http_code}" <url>` instead.

**Blank-looking 3D screenshots are usually timing**, not failure — react-three-fiber's first
paint or a mid-animation frame. Re-screenshot before assuming a bug.

---

## 11. Running and deploying

### Local

```bash
npm install
npm run dev
```

### Checks

```bash
npx tsc --noEmit -p tsconfig.app.json   # types
npm run lint                             # oxlint
npm run build                            # production build
```

### Vercel

| Setting | Value |
|---|---|
| Framework preset | Vite (auto-detected) |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variables | none |

**No rewrite rules are needed.** The app uses `HashRouter`, so every route lives after a `#`
(`/#/play/apple`) and the server only ever serves `index.html`. This is the thing that
usually breaks a React SPA on its first deploy, and it cannot bite here.

Expect a build warning that the JS bundle exceeds 500 kB. That is Three.js. It is a warning,
not an error, and the deploy will succeed.

---

## 12. Known gaps and open decisions

### Content

- **Mango has no source data.** It is flagged `isPlaceholder: true`. The client's sheet does
  not include it. Any food beyond the original eight is in the same position.
- **Banana and ice cream** appear in the client brief's food list but were explicitly
  excluded by the client later.
- **No replay value.** Each food has exactly three questions, one per topic, so a second
  play-through is identical. The source sheet has more nutrients per food than are used.

### Technical

- **`public/` is ~90 MB** of `.glb` models, all committed to git (the repo's `.git` is
  114 MB). This will slow first loads substantially and is the single biggest performance
  problem. Worth compressing with Draco, or moving to a CDN.
- **Bundle is ~1.4 MB** (405 kB gzipped), almost all Three.js. Code-splitting would make the
  splash and tutorial screens appear instantly.
- **Score resets on refresh** — the Zustand store is in-memory only. `localStorage`
  persistence is about five lines.
- **`README.md` is still the Vite boilerplate.**
- **`src/game/food3d/SliceLayer.tsx` is dead code** — nothing imports it.
- The linter flags `Math.random` during render in `Celebration`, `DonutModel` and
  `SliceImpact`. All are inside `useMemo`, so they are stable — false positives.

### Suggested next, in priority order

1. **Sound.** There is no audio anywhere. For a children's game this is the biggest single
   gap. A knife slice, a pop on correct, a soft note on wrong. The Web Audio API can
   synthesise all of it in code — no files, no licensing.
2. **An ending.** The loop never concludes. There is no "you explored every food, here's your
   score" screen, which means there is no way to *finish* the product in front of an investor.
3. **Read-aloud.** Everything is text-only, so a child who cannot read yet cannot play.
   `speechSynthesis` is built into every browser — free, no assets, no API key.
4. **Free-angle cutting.** Currently every cut is the same vertical slice. Cutting from any
   angle was requested early on and never built; it is the step where the child actually
   *does* something.

### Copy mismatches

- The tutorial says "Drag the knife to cut it virtually"; the brief says "**Tap** the knife".
  The button does respond to a plain click.
- Emoji (⭐, ➜) crept into `GameScreen`, inconsistent with the lucide icons used everywhere
  else.
