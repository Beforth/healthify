interface IconProps {
  size?: number;
}

export function DonutIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="42" fill="#e8a24d" />
      <circle cx="50" cy="50" r="42" fill="#ff8fb3" opacity="0.001" />
      <path
        d="M50 8a42 42 0 1 1 0 84 42 42 0 0 1 0-84Z"
        fill="#ff8fb3"
      />
      <circle cx="50" cy="50" r="16" fill="#eafff2" />
      {[
        ['#ff5a7a', 20, 30],
        ['#ffd166', 70, 28],
        ['#4dd6ff', 78, 55],
        ['#8bd450', 25, 65],
        ['#ffffff', 55, 20],
        ['#c084fc', 65, 72],
      ].map(([color, x, y], i) => (
        <rect
          key={i}
          x={Number(x)}
          y={Number(y)}
          width="7"
          height="3"
          rx="1.5"
          fill={color as string}
          transform={`rotate(${i * 37} ${x} ${y})`}
        />
      ))}
    </svg>
  );
}

export function ChocolateBarIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect x="14" y="20" width="72" height="60" rx="8" fill="#6b3f2a" />
      <rect x="14" y="20" width="72" height="60" rx="8" fill="#7a4630" opacity="0.001" />
      {[0, 1].map((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={20 + col * 22}
            y={26 + row * 28}
            width="18"
            height="24"
            rx="3"
            fill="#54301f"
          />
        )),
      )}
    </svg>
  );
}

export function MangoIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        {/* Authentic Alphonso mango skin gradient (matches 3D model texture) */}
        <linearGradient id="mango-skin" x1="42" y1="8" x2="58" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3a7d44" />
          <stop offset="0.18" stopColor="#80b918" />
          <stop offset="0.4" stopColor="#e63946" />
          <stop offset="0.68" stopColor="#f77f00" />
          <stop offset="0.92" stopColor="#ffb703" />
          <stop offset="1" stopColor="#fcbf49" />
        </linearGradient>
        <radialGradient id="mango-blush" cx="0.38" cy="0.32" r="0.5">
          <stop offset="0" stopColor="#d90429" stopOpacity="0.45" />
          <stop offset="0.6" stopColor="#e8552b" stopOpacity="0.22" />
          <stop offset="1" stopColor="#e8552b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Kidney silhouette with iconic curved beak (from 3D perimeter spline) */}
      <path
        d="M48.11 8.71L47.18 8.81L45.94 8.82L44.47 8.80L42.83 8.83L41.09 8.97L39.32 9.28L37.59 9.84L35.96 10.69L34.49 11.92L33.02 13.53L31.49 15.48L29.96 17.70L28.48 20.12L27.07 22.68L25.81 25.31L24.72 27.96L23.85 30.56L23.24 33.08L22.83 35.69L22.61 38.38L22.55 41.12L22.64 43.88L22.86 46.64L23.18 49.36L23.59 52.01L24.08 54.56L24.65 57.04L25.36 59.49L26.19 61.92L27.13 64.31L28.15 66.64L29.25 68.89L30.39 71.05L31.58 73.10L32.79 75.03L34.05 76.87L35.40 78.65L36.82 80.35L38.29 81.96L39.80 83.46L41.32 84.84L42.83 86.08L44.34 87.17L45.81 88.10L47.31 88.95L48.85 89.71L50.40 90.35L51.95 90.85L53.47 91.17L54.96 91.29L56.38 91.18L57.72 90.81L58.97 90.16L60.12 89.24L61.19 88.06L62.20 86.67L63.18 85.08L64.15 83.32L65.13 81.41L66.15 79.38L67.22 77.26L68.43 74.98L69.79 72.45L71.25 69.73L72.72 66.86L74.13 63.91L75.41 60.93L76.50 57.96L77.31 55.08L77.78 52.32L77.92 49.57L77.79 46.78L77.44 43.99L76.91 41.22L76.23 38.51L75.46 35.88L74.62 33.38L73.77 31.02L72.92 28.84L71.95 26.77L70.87 24.80L69.70 22.95L68.47 21.19L67.21 19.56L65.95 18.03L64.72 16.62L63.54 15.34L62.39 14.18L61.17 13.17L59.91 12.29L58.66 11.52L57.44 10.86L56.30 10.30L55.29 9.81L54.43 9.39L53.78 9.02Z"
        fill="url(#mango-skin)"
      />
      <path
        d="M48.11 8.71L47.18 8.81L45.94 8.82L44.47 8.80L42.83 8.83L41.09 8.97L39.32 9.28L37.59 9.84L35.96 10.69L34.49 11.92L33.02 13.53L31.49 15.48L29.96 17.70L28.48 20.12L27.07 22.68L25.81 25.31L24.72 27.96L23.85 30.56L23.24 33.08L22.83 35.69L22.61 38.38L22.55 41.12L22.64 43.88L22.86 46.64L23.18 49.36L23.59 52.01L24.08 54.56L24.65 57.04L25.36 59.49L26.19 61.92L27.13 64.31L28.15 66.64L29.25 68.89L30.39 71.05L31.58 73.10L32.79 75.03L34.05 76.87L35.40 78.65L36.82 80.35L38.29 81.96L39.80 83.46L41.32 84.84L42.83 86.08L44.34 87.17L45.81 88.10L47.31 88.95L48.85 89.71L50.40 90.35L51.95 90.85L53.47 91.17L54.96 91.29L56.38 91.18L57.72 90.81L58.97 90.16L60.12 89.24L61.19 88.06L62.20 86.67L63.18 85.08L64.15 83.32L65.13 81.41L66.15 79.38L67.22 77.26L68.43 74.98L69.79 72.45L71.25 69.73L72.72 66.86L74.13 63.91L75.41 60.93L76.50 57.96L77.31 55.08L77.78 52.32L77.92 49.57L77.79 46.78L77.44 43.99L76.91 41.22L76.23 38.51L75.46 35.88L74.62 33.38L73.77 31.02L72.92 28.84L71.95 26.77L70.87 24.80L69.70 22.95L68.47 21.19L67.21 19.56L65.95 18.03L64.72 16.62L63.54 15.34L62.39 14.18L61.17 13.17L59.91 12.29L58.66 11.52L57.44 10.86L56.30 10.30L55.29 9.81L54.43 9.39L53.78 9.02Z"
        fill="url(#mango-blush)"
      />

      {/* Stem stub at the top */}
      <path
        d="M48.74 9.65C48.2 7 48 4.6 48.9 2.6"
        stroke="#40301a"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Soft waxy sheen down the dorsal back */}
      <path
        d="M31.5 34C27.6 43 27.8 53 31.6 62"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.28"
      />
    </svg>
  );
}

export function AppleIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        {/* Honeycrisp / Gala skin gradient (matches 3D model texture) */}
        <linearGradient id="apple-skin" x1="50" y1="10" x2="50" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e9d854" />
          <stop offset="0.14" stopColor="#e63946" />
          <stop offset="0.5" stopColor="#ba181b" />
          <stop offset="0.84" stopColor="#d90429" />
          <stop offset="1" stopColor="#aacc00" />
        </linearGradient>
      </defs>

      {/* Apple silhouette with dimpled top shoulders and bottom calyx (from 3D profile spline) */}
      <path
        d="M52.19 22.68L53.21 21.99L54.55 21.02L56.15 19.87L57.94 18.64L59.87 17.41L61.87 16.30L63.87 15.38L65.99 14.49L68.33 13.48L70.79 12.49L73.28 11.67L75.69 11.18L77.94 11.15L79.93 11.73L81.73 13.08L83.46 15.10L85.07 17.61L86.51 20.40L87.75 23.29L88.73 26.06L89.42 28.52L89.76 30.68L89.76 32.70L89.51 34.66L89.06 36.62L88.49 38.64L87.86 40.79L87.23 43.12L86.57 45.71L85.79 48.53L84.93 51.48L84.00 54.47L83.02 57.42L82.02 60.24L81.03 62.83L80.04 65.28L79.04 67.69L78.01 70.02L76.95 72.21L75.83 74.21L74.64 75.96L73.36 77.43L71.96 78.61L70.45 79.55L68.86 80.26L67.22 80.75L65.58 81.05L63.96 81.15L62.41 81.08L60.82 80.69L59.14 79.93L57.44 78.93L55.82 77.83L54.34 76.76L53.11 75.85L52.19 75.24L46.89 75.85L45.66 76.76L44.18 77.83L42.56 78.93L40.86 79.93L39.18 80.69L37.59 81.08L36.04 81.15L34.42 81.05L32.78 80.75L31.14 80.26L29.55 79.55L28.04 78.61L26.64 77.43L25.36 75.96L24.17 74.21L23.05 72.21L21.99 70.02L20.96 67.69L19.96 65.28L18.98 62.83L17.98 60.24L16.98 57.42L16.00 54.47L15.07 51.48L14.21 48.53L13.43 45.71L12.77 43.12L12.14 40.79L11.51 38.64L10.94 36.62L10.49 34.66L10.24 32.70L10.24 30.68L10.58 28.52L11.27 26.06L12.25 23.29L13.49 20.40L14.93 17.61L16.54 15.10L18.27 13.08L20.07 11.73L22.06 11.15L24.31 11.18L26.72 11.67L29.21 12.49L31.67 13.48L34.01 14.49L36.13 15.38L38.13 16.30L40.13 17.41L42.06 18.64L43.85 19.87L45.45 21.02L46.79 21.99L47.81 22.68Z"
        fill="url(#apple-skin)"
      />

      {/* Stem rising out of the top dimple */}
      <path
        d="M50 22C50.4 16 52 11 55.5 6.5"
        stroke="#4a250d"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="49.8" cy="21.6" r="2.4" fill="#351a08" />

      {/* Fresh green leaf with central vein */}
      <path d="M54.5 15C60 6.5 71 6 76 10.5C73.5 18 63.5 21.5 54.5 15Z" fill="#2d9344" />
      <path
        d="M55.5 14.6C62 12.2 69 10.4 74.5 10"
        stroke="#48c765"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Glossy highlight */}
      <path
        d="M33 30C28.5 39 28.5 50 33.5 60"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

export const FOOD_ICONS: Record<string, (props: IconProps) => React.JSX.Element> = {
  donut: DonutIcon,
  'chocolate-bar': ChocolateBarIcon,
  mango: MangoIcon,
  apple: AppleIcon,
};

export default function FoodIcon({ id, size = 48 }: { id: string; size?: number }) {
  const Icon = FOOD_ICONS[id];
  if (!Icon) return null;
  return <Icon size={size} />;
}
