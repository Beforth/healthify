# Tech Stack

Healthify is a React + TypeScript single-page app built with Vite, using Three.js for 3D visuals and Zustand for state.

## Core

| Tool | Version | Purpose |
|---|---|---|
| [React](https://react.dev) | 19.2 | UI library |
| [TypeScript](https://www.typescriptlang.org) | 6.0 | Static typing |
| [Vite](https://vite.dev) | 8.3 | Dev server & build tool |
| [React Router](https://reactrouter.com) | 7.18 | Client-side routing |
| [Zustand](https://zustand-demo.pmnd.rs) | 5.0 | State management |

## 3D & Graphics

| Tool | Version | Purpose |
|---|---|---|
| [Three.js](https://threejs.org) | 0.186 | 3D rendering engine |
| [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) | 9.7 | React renderer for Three.js |
| [@react-three/drei](https://github.com/pmndrs/drei) | 10.7 | Helper components for react-three-fiber |

## UI & Animation

| Tool | Version | Purpose |
|---|---|---|
| [Framer Motion](https://www.framer.com/motion) | 13.3 | Animations & transitions |
| [Recharts](https://recharts.org) | 3.10 | Charts |
| [Lucide React](https://lucide.dev) | 1.46 | Icon set |

## Tooling

| Tool | Version | Purpose |
|---|---|---|
| [Oxlint](https://oxc.rs) | 1.81 | Linting |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | 6.1 | Vite React plugin (Oxc-based Fast Refresh) |

Plain CSS is used for styling (no CSS framework such as Tailwind).

## Project Structure

```
src/
├── assets/      # Static assets
├── components/  # Shared React components
├── data/        # Static/reference data
├── game/        # Core gameplay logic (includes game/micro, game/food3d)
├── lib/         # Utilities/helpers
├── screens/     # Top-level screen/page components
├── store/       # Zustand stores
└── tour/        # Guided tour feature
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) then build for production |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Preview the production build locally |
