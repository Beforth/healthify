# Healthify: Recent Changes & Architectural Explanations

This document explains the recent improvements made to the **Game Cutting Screen** and the **3D Model Loading System**, written in clear, simple terms with before-and-after examples.

---

## 1. Fixing the Game Screen (3D Food Cutting Stage)

### The Problems
When viewing a food (like Mango) on the cutting stage:
1. **Floating Food**: The mango was floating high in mid-air with an unnatural empty gap above the round cutting board.
2. **Clipped Cutting Board**: The bottom rim and shadow of the round pedestal plate were sliced in half by the container.
3. **Button Collision**: The green **"DRAG TO CUT"** button overlapped the front edge of the cutting board plate.

```
       BEFORE (Problem)                          AFTER (Fixed)
  +--------------------------+             +--------------------------+
  |  [Badge]          [Tips] |             |  [Badge]          [Tips] |
  |                          |             |                          |
  |           🔪             |             |            🔪            |
  |         (Mango)          |             |        (Mango sits       |
  |        [FLOATING]        |             |         on board)        |
  |                          |             |     /--------------\     |
  |    /----------------\    |             |    |  Cutting Board |    |
  |   |  Bottom Clipped  |   |             |     \--------------/     |
  |   +--[DRAG TO CUT]---+   |             |                          |
  |       (Colliding)        |             |     [DRAG TO CUT]        |
  +--------------------------+             +--------------------------+
```

---

### Root Causes & How They Were Fixed

#### A. Stale Geometry Bounding Boxes (`src/game/food3d/halfSolid.ts`)
* **What happened**: When creating fruit shapes (mango, apple, etc.), a 3D sphere was reshaped to stretch longer (`y *= 1.45`). However, Three.js still kept the original sphere's smaller bounding box.
* **Why it caused floating**: The game measured the old sphere height instead of the stretched fruit, miscalculating where the bottom of the fruit was.
* **The Fix**: Added `skinGeo.computeBoundingBox()` and `geo.computeBoundingBox()` immediately after modifying vertices so the true dimensions are always known.

#### B. Flawed Measurement Loop (`src/game/food3d/FitScale.tsx`)
* **What happened**: `FitScale` measured the outer group that already had previous scales applied to it. This caused calculations to drift and compound across renders.
* **The Fix**: Attached a ref (`contentRef`) directly to the inner raw food model and computed bounds using the inverse world matrix. This cancels out any parent scales and guarantees that the food floor is seated flush at `BOARD_TOP_Y = -1.17`.

#### C. Accidental Bottom Shrink in KeepInView (`src/game/food3d/KeepInView.tsx`)
* **What happened**: `KeepInView` had a rule `LIMIT_BOTTOM = 0.82` that was intended to protect action buttons. It detected the bottom of the mango touching the cutting board and actively shrank the food upwards toward `(0, 0, 0)`, pulling it into the sky!
* **The Fix**: Removed the bottom limit penalty. `KeepInView` now only constrains lateral spread (X-axis) when the food halves slide apart during cutting.

#### D. Camera Framing & Margin Overflow (`src/game/food3d/FoodCanvas.tsx` & `src/screens/GameScreen.tsx`)
* **What happened**: 
  - The 3D camera was looking up at `y = 0.35`, which shoved the cutting board at `y = -1.25` down to the bottom edge.
  - The stage container had negative margins (`marginBottom: -32`) inside `overflow: hidden`, slicing off the plate rim and pulling the button on top of the plate.
* **The Fix**: 
  - Re-aimed camera target to `[0, -0.05, 0]` and camera position to `[0, 1.1, 5.2]` when `showPedestal` is active.
  - Removed negative margins, allowed the stage to flex comfortably, and placed the action button cleanly below the plate.

---

## 2. 3D Model Performance & Startup Optimization

### The Problem on Deployment
* On `localhost`, files load from your SSD in **0 milliseconds**.
* On deployed servers (Vercel, Netlify, Cloudflare), every single file has to travel over the internet.
* The code was preloading **all 35+ `.glb` files (~90 MB total)** on initial app startup via `useGLTF.preload()`.
* Browsers limit downloads to **6 concurrent connections**. Firing 35+ requests at once choked the network, froze the homepage, and delayed the food the user actually wanted to see.

---

### The Restaurant Analogy

> **Before**: When a customer walks through the restaurant front door, the kitchen tries to cook and deliver **all 40 menu items** to their table at the same second. The kitchen catches fire and the customer waits forever for a glass of water.
>
> **After**: When the customer walks in, they get water immediately (instant home screen). When they sit down and say **"Let's Eat"**, we bring 4 quick appetizers in under a second with a friendly greeting (Kitchen Preloader). While they enjoy those, the kitchen prepares the rest of the meal quietly in the background.

---

### How It Works Now (Step-by-Step)

```
[User Lands on Site]
        │
        ├── 0 MB downloaded: Home Screen opens INSTANTLY!
        │
[User Clicks "Let's Play!"]
        │
        ▼
[Kitchen Preloader Opens (< 1 second)]
        ├── Downloads only 4 priority models in parallel (e.g. Chocolate, Pineapple, Sweet Potato, Burger)
        ├── Note: Donut, Mango, Apple, Egg, Carrot use procedural code (0 KB download!)
        ├── Displays floating fruits, playful cooking phrases, and a glowing progress bar
        └── Safety Timeout: Automatically enters game in 1.4s max even on slow mobile networks
        │
        ▼
[User Enters Food Grid]
        ├── Cards on Page 1 are already cached & ready!
        └── Quiet background queue streams remaining 35+ models one-by-one without lag
```

### Key Components Added/Modified:

1. **`src/services/modelPreloader.ts`**:
   - Manages the priority queue (4 key models downloaded with high concurrency).
   - Enforces a **1.4-second safety timeout** so no user is ever trapped waiting.
   - Manages a background queue (`requestIdleCallback`) that gently trickles remaining models at low priority.

2. **`src/components/FoodPreloaderOverlay.tsx`**:
   - Playful fullscreen modal with floating animated fruits (🍎, 🥭, 🍔, 🥛, 🥞, 🥦).
   - Cycles whimsical cooking phrases (e.g., *"🥞 Flipping warm fluffy pancakes..."*, *"🍔 Grilling 3D burger patties..."*).
   - Shimmering progress bar with live percentage and a **"Skip to Play ➜"** option.

3. **`src/game/food3d/ScannedFoodModel.tsx`**:
   - Removed eager module-level `useGLTF.preload()` calls so homepage bandwidth is never blocked.

---

## 3. Quick Verification Checklist

| Test Item | Expected Result | Status |
| :--- | :--- | :--- |
| **Home Page Load** | Loads instantly without downloading 90MB of 3D assets | ✅ Verified |
| **"Let's Play" Button** | Opens the animated Kitchen Preloader | ✅ Verified |
| **Preloader Speed** | Fills to 100% in under 1.2 seconds | ✅ Verified |
| **Food Select Grid** | Food cards display immediately without blank boxes | ✅ Verified |
| **Cutting Screen Mango** | Sits directly flush on the round cutting board plate | ✅ Verified |
| **Pedestal & Button** | Full round plate and shadow visible; button does not overlap | ✅ Verified |
