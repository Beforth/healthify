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

export function PineappleIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="pineapple-skin" x1="50" y1="34" x2="50" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffd166" />
          <stop offset="0.55" stopColor="#f4a72c" />
          <stop offset="1" stopColor="#d98014" />
        </linearGradient>
      </defs>

      {/* Spiky crown */}
      <path d="M50 36C46 26 40 18 32 12c5 9 6 18 5 25Z" fill="#2f8f3f" />
      <path d="M50 36c4-10 10-18 18-24-5 9-6 18-5 25Z" fill="#3aa64d" />
      <path d="M50 37c-3-12-2-23 1-33 4 10 5 21 3 33Z" fill="#46b85a" />

      {/* Body */}
      <path
        d="M50 34c12 0 22 10 22 26s-10 34-22 34-22-18-22-34 10-26 22-26Z"
        fill="url(#pineapple-skin)"
      />
      {/* Diamond scale hatching */}
      <g stroke="#a8620c" strokeWidth="1.7" opacity="0.5" strokeLinecap="round">
        {[0, 1, 2, 3].map((i) => (
          <path key={`a${i}`} d={`M31 ${46 + i * 12}L69 ${38 + i * 12}`} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <path key={`b${i}`} d={`M31 ${38 + i * 12}L69 ${46 + i * 12}`} />
        ))}
      </g>
      {/* Sheen */}
      <path d="M38 48c-4 10-4 22 0 32" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" opacity="0.32" />
    </svg>
  );
}

export function CornIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="corn-cob" x1="50" y1="12" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffe066" />
          <stop offset="0.6" stopColor="#f7c52d" />
          <stop offset="1" stopColor="#dda31a" />
        </linearGradient>
      </defs>

      {/* Husk leaves peeling down either side */}
      <path d="M44 42C33 48 27 64 30 88c9-8 14-22 15-36Z" fill="#3f9b46" />
      <path d="M56 42c11 6 17 22 14 46-9-8-14-22-15-36Z" fill="#4fb058" />

      {/* Cob */}
      <path d="M50 10c11 0 18 12 18 34S61 92 50 92 32 66 32 44 39 10 50 10Z" fill="url(#corn-cob)" />

      {/* Kernels */}
      <g fill="#c98d10" opacity="0.45">
        {[0, 1, 2, 3, 4, 5].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <circle key={`${row}-${col}`} cx={39 + col * 7.4 + (row % 2) * 3.7} cy={24 + row * 11} r="2.6" />
          )),
        )}
      </g>
      <path d="M41 26c-3 12-3 30 0 44" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

export function SweetPotatoIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="sweet-potato-skin" x1="24" y1="30" x2="76" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e28a4a" />
          <stop offset="0.5" stopColor="#c86a2e" />
          <stop offset="1" stopColor="#a04f20" />
        </linearGradient>
      </defs>

      {/* Tapered tuber lying on the diagonal */}
      <path
        d="M20 62c-4-12 4-24 18-30 12-5 26-8 36-2 10 6 10 20 2 28-8 8-22 14-34 14-12 0-19-4-22-10Z"
        fill="url(#sweet-potato-skin)"
      />
      {/* Tapered ends */}
      <path d="M20 62c-5-2-9-6-9-9 3-2 7-1 10 1Z" fill="#8f4419" />
      <path d="M78 58c5 2 9 5 9 9-4 2-8 1-11-1Z" fill="#8f4419" />

      {/* Skin freckles */}
      <g fill="#7d3a15" opacity="0.5">
        <circle cx="38" cy="46" r="2" />
        <circle cx="52" cy="40" r="1.6" />
        <circle cx="60" cy="54" r="2.2" />
        <circle cx="44" cy="60" r="1.8" />
        <circle cx="68" cy="46" r="1.6" />
      </g>
      <path d="M32 40c10-5 22-8 32-6" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.28" />
    </svg>
  );
}

export function BurgerIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="burger-bun" x1="50" y1="14" x2="50" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f2b661" />
          <stop offset="1" stopColor="#d9913a" />
        </linearGradient>
      </defs>

      {/* Top bun */}
      <path d="M14 48C14 30 30 16 50 16s36 14 36 32Z" fill="url(#burger-bun)" />
      {/* Sesame seeds */}
      <g fill="#fff3d8">
        <ellipse cx="36" cy="30" rx="3.4" ry="2.2" transform="rotate(-20 36 30)" />
        <ellipse cx="52" cy="24" rx="3.4" ry="2.2" transform="rotate(8 52 24)" />
        <ellipse cx="66" cy="32" rx="3.4" ry="2.2" transform="rotate(24 66 32)" />
        <ellipse cx="26" cy="41" rx="3" ry="2" transform="rotate(-8 26 41)" />
      </g>

      {/* Lettuce */}
      <path
        d="M12 48h76c0 5-4 7-8 6s-7 3-11 2-6-3-10-2-6 3-10 2-6-3-10-2-7 2-11 1-6-3-6-7Z"
        fill="#5cb85c"
      />
      {/* Cheese */}
      <path d="M17 57h66l-6 8H23Z" fill="#ffc93c" />
      {/* Patty */}
      <rect x="15" y="62" width="70" height="13" rx="6.5" fill="#7b4526" />
      {/* Bottom bun */}
      <path d="M17 76h66c0 6-6 10-14 10H31c-8 0-14-4-14-10Z" fill="#d9913a" />
    </svg>
  );
}

export function EggIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="egg-shell" x1="38" y1="14" x2="62" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#fdf3e0" />
          <stop offset="1" stopColor="#ecd8b6" />
        </linearGradient>
        <radialGradient id="egg-yolk" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffd24a" />
          <stop offset="1" stopColor="#f09a13" />
        </radialGradient>
      </defs>

      {/* Shell: narrow at the top, broad at the base */}
      <path
        d="M50 10c14 0 24 22 24 42 0 21-11 36-24 36s-24-15-24-36c0-20 10-42 24-42Z"
        fill="url(#egg-shell)"
        stroke="#e0c69c"
        strokeWidth="2"
      />
      {/* Yolk showing through, so the icon still reads as an egg and not a stone */}
      <circle cx="50" cy="56" r="13" fill="url(#egg-yolk)" opacity="0.92" />
      <circle cx="45.5" cy="51.5" r="4" fill="#ffe89a" opacity="0.75" />
      <path d="M36 32c-5 9-7 20-6 30" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

export function CarrotIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="carrot-root" x1="34" y1="30" x2="62" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff9f43" />
          <stop offset="0.6" stopColor="#f07818" />
          <stop offset="1" stopColor="#d35c0c" />
        </linearGradient>
      </defs>

      {/* Leafy tops */}
      <path d="M48 32C42 22 34 16 24 14c6 8 10 16 12 22Z" fill="#2f8f3f" />
      <path d="M52 32c6-10 14-16 24-18-6 8-10 16-12 22Z" fill="#3aa64d" />
      <path d="M50 31c-1-11 1-20 5-29 3 10 3 20 1 29Z" fill="#46b85a" />

      {/* Tapering root */}
      <path d="M50 30c9 0 15 5 15 10 0 12-9 38-15 48-6-10-15-36-15-48 0-5 6-10 15-10Z" fill="url(#carrot-root)" />
      {/* Growth rings */}
      <g stroke="#b64c08" strokeWidth="1.8" opacity="0.45" strokeLinecap="round">
        <path d="M38 44h24" />
        <path d="M40 56h20" />
        <path d="M43 68h14" />
      </g>
      <path d="M42 38c-2 12 1 26 5 38" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

export function MilkIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="milk-body" x1="50" y1="34" x2="50" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eaf2f8" />
        </linearGradient>
      </defs>

      {/* Tumbler */}
      <path d="M28 18h44l-5 68a6 6 0 0 1-6 5H39a6 6 0 0 1-6-5Z" fill="#dff0fa" opacity="0.75" stroke="#bcd8e8" strokeWidth="2" />
      {/* Milk fill */}
      <path d="M31.3 34h37.4l-3.8 52a5 5 0 0 1-5 4H40a5 5 0 0 1-5-4Z" fill="url(#milk-body)" />
      {/* Surface of the milk */}
      <ellipse cx="50" cy="34" rx="18.7" ry="4.4" fill="#ffffff" />
      <ellipse cx="50" cy="34" rx="18.7" ry="4.4" fill="#cfe4f0" opacity="0.5" />
      {/* Glass highlight */}
      <path d="M39 42c-2 14-2 30 0 44" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

export function BroccoliIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <radialGradient id="broccoli-head" cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#57bd5f" />
          <stop offset="1" stopColor="#2c7a3a" />
        </radialGradient>
      </defs>

      {/* Stalk */}
      <path d="M43 52h14v28c0 5-3 8-7 8s-7-3-7-8Z" fill="#b6d98e" />
      <path d="M50 58v26" stroke="#9cc472" strokeWidth="2.4" strokeLinecap="round" />

      {/* Florets */}
      <g fill="url(#broccoli-head)">
        <circle cx="31" cy="44" r="14" />
        <circle cx="50" cy="32" r="17" />
        <circle cx="69" cy="44" r="14" />
        <circle cx="41" cy="52" r="12" />
        <circle cx="60" cy="52" r="12" />
      </g>
      {/* Bumpy texture */}
      <g fill="#7fd08a" opacity="0.5">
        <circle cx="42" cy="28" r="3.4" />
        <circle cx="56" cy="24" r="3" />
        <circle cx="30" cy="40" r="3" />
        <circle cx="70" cy="40" r="3.2" />
        <circle cx="50" cy="44" r="3" />
        <circle cx="62" cy="52" r="2.6" />
      </g>
    </svg>
  );
}

export function PeanutsIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="peanut-shell" x1="30" y1="20" x2="70" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e8c489" />
          <stop offset="0.6" stopColor="#d3a45f" />
          <stop offset="1" stopColor="#b2823f" />
        </linearGradient>
      </defs>

      {/* Two-lobed shell, waisted in the middle */}
      <path
        d="M50 12c12 0 20 9 20 19 0 6-3 10-3 15s3 9 3 15c0 11-8 21-20 21s-20-10-20-21c0-6 3-10 3-15s-3-9-3-15c0-10 8-19 20-19Z"
        fill="url(#peanut-shell)"
      />
      {/* Shell ribbing */}
      <g stroke="#9a6b2c" strokeWidth="1.6" opacity="0.45" strokeLinecap="round">
        <path d="M36 26c9-4 19-4 28 0" />
        <path d="M34 38c11-3 21-3 32 0" />
        <path d="M34 62c11-3 21-3 32 0" />
        <path d="M36 74c9 4 19 4 28 0" />
        <path d="M33 50h34" />
      </g>
      <path d="M40 24c-4 8-4 18 0 26" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.32" />
    </svg>
  );
}

export function SoftDrinkIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="can-body" x1="30" y1="20" x2="70" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c62828" />
          <stop offset="0.45" stopColor="#ef4444" />
          <stop offset="1" stopColor="#991b1b" />
        </linearGradient>
      </defs>

      {/* Can body with tapered top and bottom rims */}
      <path d="M31 24c0-3 8-5 19-5s19 2 19 5v52c0 3-8 5-19 5s-19-2-19-5Z" fill="url(#can-body)" />
      {/* Top lid */}
      <ellipse cx="50" cy="24" rx="19" ry="6" fill="#cfd8dc" />
      <ellipse cx="50" cy="23" rx="15" ry="4.4" fill="#b0bec5" />
      {/* Pull tab */}
      <ellipse cx="50" cy="23" rx="5" ry="2.4" fill="#eceff1" />
      {/* Bottom rim */}
      <ellipse cx="50" cy="76" rx="19" ry="5.5" fill="#7f1d1d" />
      {/* Label band + bubbles */}
      <path d="M31 44h38v14H31Z" fill="#ffffff" opacity="0.92" />
      <g fill="#ef4444" opacity="0.85">
        <circle cx="41" cy="51" r="3" />
        <circle cx="50" cy="51" r="3.6" />
        <circle cx="59" cy="51" r="3" />
      </g>
      <path d="M38 30c-2 12-2 26 0 40" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" opacity="0.32" />
    </svg>
  );
}

export function PotatoChipsIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="chip-packet" x1="28" y1="22" x2="72" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffd166" />
          <stop offset="0.55" stopColor="#f0a020" />
          <stop offset="1" stopColor="#d07d0c" />
        </linearGradient>
      </defs>

      {/* Crimped packet */}
      <path d="M30 26h40v58H30Z" fill="url(#chip-packet)" />
      <path d="M26 18h48l-4 8H30Z" fill="#c26f08" />
      <path d="M26 92h48l-4-8H30Z" fill="#c26f08" />
      {/* Crimp teeth */}
      <g fill="#a85c05">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={29 + i * 7.4} y="18" width="3.4" height="8" />
        ))}
      </g>

      {/* Chips spilling out on the label window */}
      <path d="M34 40h32v28H34Z" fill="#fff6e0" opacity="0.9" />
      <g fill="#e8a33d" stroke="#c07c14" strokeWidth="1.4">
        <path d="M39 54c-1-5 3-9 8-8 5 1 7 6 4 9-3 4-11 4-12-1Z" />
        <path d="M52 62c-2-5 2-9 7-8 5 1 7 5 4 8-3 4-10 4-11 0Z" />
        <path d="M50 46c-1-4 2-7 6-6 4 1 6 4 3 7-2 3-8 2-9-1Z" />
      </g>
    </svg>
  );
}

export function CreamBiscuitsIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="biscuit-crumb" x1="50" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c78a4e" />
          <stop offset="1" stopColor="#9c6530" />
        </linearGradient>
      </defs>

      {/* Back biscuit peeking out, so it reads as a pack of a few */}
      <circle cx="66" cy="42" r="24" fill="#a97042" opacity="0.55" />

      {/* Front sandwich biscuit: top wafer, cream, bottom wafer */}
      <path d="M12 44a26 26 0 0 1 52 0Z" fill="url(#biscuit-crumb)" />
      <rect x="12" y="44" width="52" height="10" fill="#fdf0d5" />
      <path d="M12 54a26 26 0 0 0 52 0Z" fill="#8d5a2a" />

      {/* Docking holes on the top wafer */}
      <g fill="#7d4c22" opacity="0.6">
        <circle cx="28" cy="34" r="2.4" />
        <circle cx="38" cy="28" r="2.4" />
        <circle cx="48" cy="34" r="2.4" />
        <circle cx="38" cy="40" r="2.4" />
      </g>
      <path d="M20 40a26 26 0 0 1 10-12" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" opacity="0.28" />
    </svg>
  );
}

export function PastaIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="pasta-bowl" x1="50" y1="56" x2="50" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f3f7f9" />
          <stop offset="1" stopColor="#c8d6dd" />
        </linearGradient>
      </defs>

      {/* Mound of spaghetti sitting above the rim */}
      <path d="M18 60c0-18 14-30 32-30s32 12 32 30Z" fill="#f0c14b" />
      <g stroke="#d99f2b" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M26 58c2-12 9-19 18-21" />
        <path d="M38 58c1-14 8-22 18-22" />
        <path d="M50 58c0-13 6-21 15-20" />
        <path d="M62 58c1-11 5-17 11-16" />
      </g>
      {/* A little sauce and herbs, so it is plainly pasta and not noodles */}
      <ellipse cx="44" cy="44" rx="11" ry="7" fill="#d94f3d" />
      <ellipse cx="62" cy="50" rx="7" ry="4.5" fill="#c74232" />
      <g fill="#3f8f4a">
        <circle cx="40" cy="41" r="2.2" />
        <circle cx="52" cy="47" r="2" />
        <circle cx="64" cy="47" r="1.8" />
      </g>

      {/* Bowl */}
      <path d="M14 58h72c0 16-16 28-36 28S14 74 14 58Z" fill="url(#pasta-bowl)" />
      <path d="M14 58h72v5H14Z" fill="#aebfc8" />
      <path d="M24 70c3 6 9 10 16 12" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" opacity="0.6" fill="none" />
    </svg>
  );
}

export function BreadIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="bread-crumb" x1="50" y1="26" x2="50" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f8e3bd" />
          <stop offset="1" stopColor="#e9c88d" />
        </linearGradient>
      </defs>

      {/* Back slice, so it reads as the two slices on the sheet */}
      <path d="M32 30c0-8 7-12 16-12s16 4 16 12v40a4 4 0 0 1-4 4H36a4 4 0 0 1-4-4Z" fill="#cfa15f" />

      {/* Front slice with its domed crust top */}
      <path d="M20 36c0-9 8-14 18-14s18 5 18 14v40a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4Z" fill="url(#bread-crumb)" />
      <path d="M20 36c0-9 8-14 18-14s18 5 18 14c0 4-4 6-18 6s-18-2-18-6Z" fill="#d9a55f" />

      {/* Crumb holes */}
      <g fill="#dfbd88" opacity="0.8">
        <circle cx="30" cy="52" r="3" />
        <circle cx="43" cy="59" r="2.4" />
        <circle cx="33" cy="67" r="2.6" />
        <circle cx="46" cy="47" r="2" />
      </g>
      <path d="M26 30c3-3 7-4 11-4" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function TacoIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="taco-shell" x1="50" y1="40" x2="50" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f7cc62" />
          <stop offset="1" stopColor="#dda42c" />
        </linearGradient>
      </defs>

      {/* Filling spilling over the top edge of the shell */}
      <path d="M22 54c6-10 16-15 28-15s22 5 28 15Z" fill="#8d4a2a" />
      <g fill="#4caf50">
        <path d="M26 52c6-4 12-6 18-6s14 2 20 6c-6 3-12 4-19 4s-13-1-19-4Z" />
      </g>
      <g fill="#e94b3c">
        <circle cx="38" cy="47" r="3.4" />
        <circle cx="58" cy="48" r="3" />
      </g>
      <g fill="#fdf1c7">
        <circle cx="48" cy="45" r="2.6" />
        <circle cx="66" cy="52" r="2.2" />
      </g>

      {/* Folded shell */}
      <path d="M16 56h68c0 14-15 24-34 24S16 70 16 56Z" fill="url(#taco-shell)" />
      <path d="M16 56h68v4H16Z" fill="#c9911f" />
      <g fill="#c9911f" opacity="0.55">
        <circle cx="34" cy="68" r="2.4" />
        <circle cx="50" cy="72" r="2.4" />
        <circle cx="66" cy="68" r="2.4" />
      </g>
    </svg>
  );
}

export function HotDogIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="dog-bun" x1="50" y1="34" x2="50" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f2cd8b" />
          <stop offset="1" stopColor="#d9a752" />
        </linearGradient>
      </defs>

      {/* Bun, sausage, mustard — stacked so the sausage sits in the split */}
      <rect x="10" y="40" width="80" height="26" rx="13" fill="url(#dog-bun)" />
      <rect x="14" y="42" width="72" height="18" rx="9" fill="#e8455c" />
      <rect x="14" y="42" width="72" height="7" rx="3.5" fill="#f26a7c" opacity="0.7" />
      <path
        d="M20 50c6-6 10 6 16 0s10 6 16 0 10 6 16 0 8 4 12 1"
        stroke="#ffd43b"
        strokeWidth="4.2"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="10" y="54" width="80" height="12" rx="6" fill="#dcab5e" />
      <path d="M18 62c8 3 18 4 28 4" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

export function CheeseFriesIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="fries-carton" x1="50" y1="56" x2="50" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
      </defs>

      {/* Fries fanning out of the carton */}
      <g fill="#f5c542" stroke="#d9a41f" strokeWidth="1.6">
        <rect x="32" y="22" width="9" height="42" rx="3" transform="rotate(-11 36 43)" />
        <rect x="45" y="17" width="9" height="46" rx="3" />
        <rect x="58" y="22" width="9" height="42" rx="3" transform="rotate(11 62 43)" />
        <rect x="38" y="28" width="9" height="36" rx="3" transform="rotate(4 42 46)" />
        <rect x="53" y="28" width="9" height="36" rx="3" transform="rotate(-4 57 46)" />
      </g>

      {/* Melted cheese poured over the top */}
      <path
        d="M28 52c6-5 12 2 18-2s12 4 18 0 8 3 10 1c1 7-3 12-9 12H35c-6 0-8-5-7-11Z"
        fill="#f9a826"
      />
      <path d="M36 64c1 5 3 7 3 9M52 64c0 5 2 8 2 10M66 63c0 5-1 7-2 9" stroke="#f9a826" strokeWidth="4" strokeLinecap="round" />

      {/* Carton */}
      <path d="M26 58h48l-6 30H32Z" fill="url(#fries-carton)" />
      <path d="M26 58h48l-1.6 8H27.6Z" fill="#dc2626" />
      <path d="M44 70h12v14H44Z" fill="#ffffff" opacity="0.35" />
    </svg>
  );
}

export function WaffleIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="waffle-bake" x1="50" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f0c069" />
          <stop offset="1" stopColor="#cf8f2c" />
        </linearGradient>
        <clipPath id="waffle-round">
          <circle cx="50" cy="50" r="31" />
        </clipPath>
      </defs>

      <circle cx="50" cy="50" r="32" fill="url(#waffle-bake)" />
      <circle cx="50" cy="50" r="32" fill="none" stroke="#b97c1e" strokeWidth="3" />

      {/* The grid, clipped to the round waffle */}
      <g clipPath="url(#waffle-round)">
        <g stroke="#b97c1e" strokeWidth="4.5">
          {[26, 38, 50, 62, 74].map((v) => (
            <line key={`h${v}`} x1="18" y1={v} x2="82" y2={v} />
          ))}
          {[26, 38, 50, 62, 74].map((v) => (
            <line key={`v${v}`} x1={v} y1="18" x2={v} y2="82" />
          ))}
        </g>
      </g>

      {/* Pat of butter melting in one of the squares */}
      <rect x="44" y="32" width="12" height="9" rx="2" fill="#ffe082" />
      <path d="M30 34a32 32 0 0 1 12-11" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.3" fill="none" />
    </svg>
  );
}

export function CakeIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="cake-sponge" x1="50" y1="34" x2="50" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f6ddb4" />
          <stop offset="1" stopColor="#e3bc85" />
        </linearGradient>
      </defs>

      {/* A wedge, cut face towards us, so the layers are the whole point */}
      <path d="M22 80V38l56-14v56Z" fill="url(#cake-sponge)" />
      {/* Cream layers */}
      <path d="M22 54v-8l56-14v8Z" fill="#fff3e0" />
      <path d="M22 68v-7l56-14v7Z" fill="#f7d9c4" />
      {/* Frosting cap with a drip */}
      <path d="M22 38 78 24v9L22 47Z" fill="#e8607d" />
      <path d="M26 46c3 6 6 3 8 8s6 2 8 7" stroke="#e8607d" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Cherry on top */}
      <circle cx="66" cy="27" r="5" fill="#d63d52" />
      <path d="M66 22c1-4 4-5 6-4" stroke="#3f8f4a" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M78 33v47" stroke="#cda878" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

export function PancakesIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="pancake-top" x1="50" y1="30" x2="50" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f0c069" />
          <stop offset="1" stopColor="#d79a34" />
        </linearGradient>
      </defs>

      {/* Three stacked, bottom first */}
      <ellipse cx="50" cy="70" rx="33" ry="11" fill="#d79a34" />
      <ellipse cx="50" cy="66" rx="33" ry="11" fill="#e9b04f" />
      <ellipse cx="50" cy="56" rx="32" ry="11" fill="#d79a34" />
      <ellipse cx="50" cy="52" rx="32" ry="11" fill="#eab455" />
      <ellipse cx="50" cy="42" rx="31" ry="11" fill="#d79a34" />
      <ellipse cx="50" cy="38" rx="31" ry="11" fill="url(#pancake-top)" />

      {/* Syrup running over the edges */}
      <path
        d="M22 38c4 6 10 9 28 9s24-3 28-9c2 8-1 14-4 15-2 6-6 4-8 9-3-3-6-1-8-5-3 5-7 3-9 7-3-5-7-2-9-7-3 4-6 1-8 5-2-5-6-3-8-9-3-1-6-7-2-15Z"
        fill="#b5651d"
        opacity="0.92"
      />
      <rect x="44" y="26" width="12" height="9" rx="2" fill="#ffe082" />
      <path d="M30 34c4-3 9-5 14-5" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" opacity="0.35" fill="none" />
    </svg>
  );
}

export function CupcakeIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="cupcake-wrap" x1="50" y1="54" x2="50" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f0a6bd" />
          <stop offset="1" stopColor="#c76a86" />
        </linearGradient>
      </defs>

      {/* Frosting swirl, three rising blobs */}
      <path d="M26 56c0-10 8-16 14-18 2-8 10-12 18-9 8-2 14 4 14 12 6 3 6 12-2 15Z" fill="#fff0f4" />
      <path d="M30 56c0-8 7-13 12-14 2-6 8-9 14-7 6-1 11 4 11 10 5 2 5 9-2 11Z" fill="#f7b8cc" />
      <path d="M36 56c0-6 5-9 9-10 1-4 6-6 10-5 4 0 8 3 8 8 3 1 3 6-2 7Z" fill="#ef8fb0" />
      <circle cx="52" cy="26" r="4.5" fill="#d63d52" />

      {/* Fluted paper cup */}
      <path d="M26 56h48l-6 30H32Z" fill="url(#cupcake-wrap)" />
      <g stroke="#b85f7a" strokeWidth="2.2" opacity="0.7">
        <path d="M38 58l-2 26M50 58v26M62 58l2 26" />
      </g>
      <path d="M26 56h48v5H26Z" fill="#e894ae" />
    </svg>
  );
}

export function IceCreamIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="icecream-cone" x1="50" y1="54" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e2ae63" />
          <stop offset="1" stopColor="#bd8331" />
        </linearGradient>
      </defs>

      {/* Waffle cone with its criss-cross */}
      <path d="M32 54h36L50 90Z" fill="url(#icecream-cone)" />
      <g stroke="#a06c22" strokeWidth="1.8" opacity="0.65">
        <path d="M38 54 54 84M48 54l14 22M58 54l8 12M34 62l22 26" />
      </g>

      {/* Scoop, slightly lumpy so it reads as scooped not moulded */}
      <path d="M26 54c-2-14 9-24 24-24s26 10 24 24c-6 3-12-1-16 2s-10-2-14 1-13 1-18-3Z" fill="#fde3ec" />
      <path d="M32 40c3-6 9-9 15-9" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.75" fill="none" />
      <g fill="#f3aac4">
        <circle cx="42" cy="44" r="3" />
        <circle cx="58" cy="41" r="2.4" />
        <circle cx="52" cy="50" r="2.2" />
      </g>
      <circle cx="50" cy="26" r="4.5" fill="#d63d52" />
    </svg>
  );
}

export function LollipopIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Stick first, so the disc sits on top of it */}
      <rect x="47" y="52" width="6" height="38" rx="3" fill="#f3f4f6" />
      <rect x="47" y="52" width="2.6" height="38" fill="#d7dade" />

      <circle cx="50" cy="40" r="28" fill="#fdf1f4" />
      {/* The swirl — one spiral stroke, which is what a lollipop actually is */}
      <path
        d="M50 40a4 4 0 0 1 4-4 8 8 0 0 1 8 8 12 12 0 0 1-12 12 16 16 0 0 1-16-16 20 20 0 0 1 20-20 24 24 0 0 1 24 24"
        stroke="#ef476f"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="50" cy="40" r="28" fill="none" stroke="#ef476f" strokeWidth="3.5" />
      <path d="M36 26a20 20 0 0 1 10-6" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.55" fill="none" />
    </svg>
  );
}

export function CandyIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="candy-body" x1="36" y1="34" x2="66" y2="66" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8ecaff" />
          <stop offset="1" stopColor="#3f8fdc" />
        </linearGradient>
      </defs>

      {/* Twisted wrapper ends */}
      <path d="M22 34 38 50 22 66c-4-6-4-26 0-32Z" fill="#7bb6ef" />
      <path d="M78 34 62 50l16 16c4-6 4-26 0-32Z" fill="#7bb6ef" />
      <g stroke="#4a8fd0" strokeWidth="2" opacity="0.8">
        <path d="M26 40v20M32 44v12M74 40v20M68 44v12" />
      </g>

      {/* Pillow of candy in the middle */}
      <ellipse cx="50" cy="50" rx="16" ry="14" fill="url(#candy-body)" />
      <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.65">
        <path d="M44 40c-2 7-2 13 0 20M54 40c-2 7-2 13 0 20" />
      </g>
      <ellipse cx="44" cy="44" rx="4" ry="2.6" fill="#ffffff" opacity="0.6" transform="rotate(-28 44 44)" />
    </svg>
  );
}

export function BubbleTeaIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="boba-tea" x1="50" y1="34" x2="50" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#d9ab7a" />
          <stop offset="1" stopColor="#b4794a" />
        </linearGradient>
      </defs>

      {/* Straw, behind the cup lid */}
      <rect x="54" y="10" width="9" height="40" rx="4" fill="#ef476f" transform="rotate(9 58 30)" />

      {/* Tapering cup */}
      <path d="M28 34h44l-6 52H34Z" fill="url(#boba-tea)" />
      {/* Sealed lid */}
      <rect x="25" y="28" width="50" height="8" rx="4" fill="#f3f4f6" />
      <rect x="25" y="28" width="50" height="3.5" rx="1.75" fill="#ffffff" />

      {/* Tapioca pearls settled at the bottom */}
      <g fill="#3d2418">
        <circle cx="41" cy="76" r="4.6" />
        <circle cx="52" cy="79" r="4.6" />
        <circle cx="62" cy="75" r="4.4" />
        <circle cx="46" cy="68" r="4.2" />
        <circle cx="58" cy="67" r="4" />
      </g>
      <path d="M34 42v30" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

export function SpinachIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="spinach-leaf" x1="50" y1="16" x2="50" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4caf50" />
          <stop offset="1" stopColor="#1c5e24" />
        </linearGradient>
      </defs>
      <g fill="url(#spinach-leaf)">
        <path d="M50 22C40 8 24 6 12 12c16 4 26 14 31 28 3 3 5 5 7 8Z" />
        <path d="M50 22c10-14 26-16 38-10-16 4-26 14-31 28-3 3-5 5-7 8Z" />
        <path d="M50 20c1-14 9-24 22-28-6 12-7 24-3 34-7 1-14 1-19-6Z" />
        <path d="M50 20c-1-14-9-24-22-28 6 12 7 24 3 34 7 1 14 1 19-6Z" />
      </g>
      <path d="M46 78h8c6 0 9 8 7 14-8 8-16 8-22 0-2-6 1-14 7-14Z" fill="#8fb97a" />
      <g stroke="#d5ecc0" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.7">
        <path d="M50 70c-3-13-11-23-24-31" />
        <path d="M50 70c3-13 11-23 24-31" />
        <path d="M50 68c0-10 3-20 9-28" />
        <path d="M50 68c0-10-3-20-9-28" />
      </g>
    </svg>
  );
}

export function CucumberIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="cucumber-skin" x1="14" y1="50" x2="86" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#79bd4c" />
          <stop offset="1" stopColor="#4d8f31" />
        </linearGradient>
      </defs>
      <g transform="rotate(-10 50 50)">
        <rect x="16" y="37" width="68" height="26" rx="13" fill="url(#cucumber-skin)" />
        <g stroke="#cfe8b2" strokeWidth="2.6" opacity="0.75" strokeLinecap="round">
          <path d="M28 41v18M40 39v22M52 39v22M64 39v22M76 41v18" />
        </g>
      </g>
      <path d="M36 28c8-4 18-5 26-2" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.35" fill="none" />
    </svg>
  );
}

export function CabbageIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="cabbage-head" x1="50" y1="18" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#eaf3d6" />
          <stop offset="1" stopColor="#b9d996" />
        </linearGradient>
      </defs>
      <path d="M47 84h6v8h-6Z" fill="#a3c47e" />
      <circle cx="50" cy="52" r="34" fill="url(#cabbage-head)" />
      <circle cx="50" cy="52" r="24" fill="#d2e6b0" opacity="0.65" />
      <circle cx="50" cy="52" r="14" fill="#e3f0ca" opacity="0.7" />
      <g stroke="#94c26b" strokeWidth="2.2" fill="none" opacity="0.8">
        <path d="M50 18c-4 12-4 24 0 34" />
        <path d="M26 38c8-4 17-4 24 0" />
        <path d="M74 38c-8-4-17-4-24 0" />
      </g>
      <path d="M38 36c-5 8-6 18-4 28" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.4" fill="none" />
    </svg>
  );
}

export function GreenPeasIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="peas-pod" x1="50" y1="84" x2="50" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#66bb4d" />
          <stop offset="1" stopColor="#2f8033" />
        </linearGradient>
      </defs>
      <path d="M50 84c-22 0-32-18-32-32 0-17 12-34 32-34s32 17 32 34c0 14-10 32-32 32Z" fill="url(#peas-pod)" />
      <path d="M50 70c16 0 26-9 26-21 0-15-11-29-26-29S24 34 24 49c0 12 10 21 26 21Z" fill="#eaf5d7" />
      <g stroke="#2e7d32" strokeWidth="2">
        <circle cx="36" cy="46" r="9" fill="#54af4a" />
        <circle cx="50" cy="60" r="9" fill="#54af4a" />
        <circle cx="64" cy="46" r="9" fill="#54af4a" />
      </g>
      <g fill="#c3e6a0" opacity="0.7">
        <circle cx="33" cy="43" r="3" />
        <circle cx="47" cy="57" r="3" />
        <circle cx="61" cy="43" r="3" />
      </g>
      <path d="M40 20c4-2 8-3 12-3" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.4" fill="none" />
    </svg>
  );
}

export function CapsicumIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="capsicum-skin" x1="50" y1="32" x2="50" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5cb845" />
          <stop offset="1" stopColor="#2f7d28" />
        </linearGradient>
      </defs>
      <path d="M47 18h6v12h-6Z" fill="#3a7d31" />
      <path d="M44 32h12l-1.5 7h-9Z" fill="#2c5e25" />
      <path
        d="M50 30c12 0 20 7 20 17 0 5-2 11-5 14-6 7-9 13-9 20-1 3-2 5-6 5s-5-2-6-5c0-7-3-13-9-20-3-3-5-9-5-14 0-10 8-17 20-17Z"
        fill="url(#capsicum-skin)"
      />
      <g fill="url(#capsicum-skin)">
        <circle cx="36" cy="66" r="7" />
        <circle cx="50" cy="71" r="8" />
        <circle cx="64" cy="66" r="7" />
      </g>
      <path d="M36 50c-2 8-1 16 2 22" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.35" fill="none" />
    </svg>
  );
}

export function TomatoIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <radialGradient id="tomato-skin" cx="0.4" cy="0.32" r="0.85">
          <stop offset="0" stopColor="#ff6e5a" />
          <stop offset="1" stopColor="#d2352c" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="58" r="33" fill="url(#tomato-skin)" />
      <circle cx="50" cy="58" r="33" fill="none" stroke="#b82820" strokeWidth="2" />
      <path d="M50 24 54 34l11-2-8 7 5 10-12-5-12 5 5-10-8-7 11 2Z" fill="#2f8f3f" />
      <path d="M49 14c-2-3 0-6 3-6s5 3 3 6l-3 3Z" fill="#4c9a40" transform="rotate(-8 50 16)" />
      <path d="M34 44c-4 9-4 21 1 29" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" opacity="0.4" fill="none" />
    </svg>
  );
}

export function OnionIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <radialGradient id="onion-skin" cx="0.4" cy="0.36" r="0.85">
          <stop offset="0" stopColor="#e5839e" />
          <stop offset="1" stopColor="#7d1f3e" />
        </radialGradient>
      </defs>
      <path d="M50 86c-18 0-31-12-31-28s13-28 31-28 31 12 31 28-13 28-31 28Z" fill="url(#onion-skin)" />
      <g stroke="#a23658" strokeWidth="2.2" opacity="0.6" fill="none">
        <path d="M50 30c0 10 8 16 16 13" />
        <path d="M32 52c3 10 10 16 18 17" />
        <path d="M26 52c1 12 8 21 18 24" />
      </g>
      <path d="M50 30c-1-7 1-12 4-17 4-3 7-2 8 1-4 4-7 9-12 16Z" fill="#a9c46b" />
      <g stroke="#8a4a68" strokeWidth="2.4" strokeLinecap="round">
        <path d="M43 88c0 3-2 5-3 5M49 90c0 3-2 5-3 5M55 88c0 3-2 5-3 5" />
      </g>
      <path d="M34 48c-3 7-3 15 0 22" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.4" fill="none" />
    </svg>
  );
}

export function GarlicIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="garlic-bulb" x1="50" y1="38" x2="50" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d8c4a8" />
        </linearGradient>
      </defs>
      <path d="M50 38c9 0 15 8 15 18 0 15-7 30-15 30s-15-15-15-30c0-10 6-18 15-18Z" fill="url(#garlic-bulb)" stroke="#cdb99c" strokeWidth="2" />
      <g stroke="#c9b593" strokeWidth="2" opacity="0.7" fill="none">
        <path d="M40 50c-2 6 0 14 4 18" />
        <path d="M60 50c2 6 0 14-4 18" />
        <path d="M38 62c1 5 5 9 10 11" />
      </g>
      <path d="M52 38c3-6 9-7 12-3 3 4-1 8-5 7-3-1-4-4-3-6" stroke="#e7d8bd" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M30 62c-3 6-3 13 0 20" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.5" fill="none" />
    </svg>
  );
}

export function PumpkinIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="pumpkin-skin" x1="50" y1="42" x2="50" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff9f3e" />
          <stop offset="1" stopColor="#e8670d" />
        </linearGradient>
      </defs>
      <path d="M48 30c0-4 3-5 3-9 2-4 5-2 5 2 0 3-1 4-2 6" stroke="#7a5b34" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="46" y="19" width="8" height="12" rx="3" fill="#8b6230" />
      <path d="M46 26h8c0 4 3 5 6 4" stroke="#9d7439" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path
        d="M50 42c10 0 18 5 20 15 1 7-2 17-8 23-4 3-8 4-12 1-4 3-8 2-12-1-6-6-9-16-8-23 2-10 10-15 20-15Z"
        fill="url(#pumpkin-skin)"
      />
      <g stroke="#b24f06" strokeWidth="2.4" opacity="0.55" fill="none" strokeLinecap="round">
        <path d="M50 42c-2 11-2 33 1 47" />
        <path d="M63 44c-2 10-2 29-1 38" />
        <path d="M37 44c2 10 2 29 1 38" />
      </g>
      <path d="M36 54c-4 8-5 18-3 27" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.35" fill="none" />
    </svg>
  );
}

export function LaukiIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="lauki-skin" x1="50" y1="16" x2="50" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e6f1cf" />
          <stop offset="1" stopColor="#b4cf85" />
        </linearGradient>
      </defs>
      <path d="M47 16c-2 8-3 16-3 24h12c0-8-1-16-3-24Z" fill="url(#lauki-skin)" />
      <path d="M44 16c-3-5-9-6-13-2 4 2 6 7 6 11 4-4 8-7 7-9Z" fill="#b4cf85" />
      <ellipse cx="50" cy="66" rx="25" ry="27" fill="url(#lauki-skin)" />
      <g fill="#cfe6ad" opacity="0.7">
        <circle cx="38" cy="58" r="2.4" />
        <circle cx="60" cy="64" r="2" />
        <circle cx="44" cy="74" r="1.8" />
        <circle cx="58" cy="80" r="2.2" />
        <circle cx="42" cy="52" r="1.8" />
      </g>
      <path d="M36 58c-3 8-2 16 1 24" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" opacity="0.4" fill="none" />
    </svg>
  );
}

export function RajmaIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="rajma-bean" x1="50" y1="20" x2="50" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f0685f" />
          <stop offset="1" stopColor="#8f1a25" />
        </linearGradient>
      </defs>
      <g stroke="#f6dcc8" strokeWidth="3.4" strokeLinecap="round" fill="none" opacity="0.9">
        <g transform="rotate(16 50 52)">
          <ellipse cx="50" cy="52" rx="16" ry="21" fill="url(#rajma-bean)" stroke="none" />
          <path d="M42 38c-6 5-5 13-1 18" />
        </g>
        <g transform="translate(4 12)">
          <ellipse cx="34" cy="70" rx="12" ry="16" fill="#c2333a" stroke="none" />
          <path d="M28 60c-4 4-4 9-1 13" />
        </g>
        <g transform="rotate(-28 66 34)">
          <ellipse cx="68" cy="32" rx="12" ry="16" fill="#a8232d" stroke="none" />
          <path d="M62 22c-4 4-4 9-1 13" />
        </g>
      </g>
      <path d="M42 34c-5 8-5 17-1 25" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.35" fill="none" />
    </svg>
  );
}

export function UradDalIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="urad-dal" x1="50" y1="46" x2="50" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5f6a74" />
          <stop offset="1" stopColor="#22282e" />
        </linearGradient>
      </defs>
      <path d="M24 84c0-20 12-34 26-34s26 14 26 34Z" fill="url(#urad-dal)" />
      <g fill="#1c2126">
        <ellipse cx="38" cy="58" rx="6" ry="4" transform="rotate(-14 38 58)" />
        <ellipse cx="55" cy="54" rx="6" ry="4" transform="rotate(18 55 54)" />
        <ellipse cx="48" cy="66" rx="6" ry="4" transform="rotate(-8 48 66)" />
        <ellipse cx="62" cy="66" rx="6" ry="4" transform="rotate(24 62 66)" />
        <ellipse cx="33" cy="68" rx="6" ry="4" transform="rotate(-16 33 68)" />
      </g>
      <g fill="#7b8792">
        <ellipse cx="30" cy="52" rx="5" ry="3.2" />
        <ellipse cx="45" cy="48" rx="5" ry="3.2" transform="rotate(10 45 48)" />
        <ellipse cx="58" cy="50" rx="5" ry="3.2" />
        <ellipse cx="70" cy="62" rx="5" ry="3.2" transform="rotate(20 70 62)" />
      </g>
      <path d="M40 46c6-3 12-3 18-1" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.28" fill="none" />
    </svg>
  );
}

export function MoongDalIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="moong-dal" x1="50" y1="46" x2="50" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e6d15a" />
          <stop offset="1" stopColor="#c9a71f" />
        </linearGradient>
      </defs>
      <path d="M24 84c0-20 12-34 26-34s26 14 26 34Z" fill="url(#moong-dal)" />
      <g fill="#a88612">
        <ellipse cx="37" cy="57" rx="6" ry="3.6" transform="rotate(-14 37 57)" />
        <ellipse cx="54" cy="53" rx="6" ry="3.6" transform="rotate(18 54 53)" />
        <ellipse cx="48" cy="66" rx="6" ry="3.6" transform="rotate(-8 48 66)" />
        <ellipse cx="63" cy="66" rx="6" ry="3.6" transform="rotate(24 63 66)" />
        <ellipse cx="33" cy="67" rx="6" ry="3.6" transform="rotate(-16 33 67)" />
      </g>
      <g fill="#f3e28c">
        <ellipse cx="30" cy="51" rx="5" ry="3" />
        <ellipse cx="45" cy="48" rx="5" ry="3" transform="rotate(10 45 48)" />
        <ellipse cx="58" cy="49" rx="5" ry="3" />
        <ellipse cx="70" cy="61" rx="5" ry="3" transform="rotate(20 70 61)" />
      </g>
      <path d="M40 46c6-3 12-3 18-1" stroke="#fff6c4" strokeWidth="3" strokeLinecap="round" opacity="0.5" fill="none" />
    </svg>
  );
}

export function OatsIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="oats-bowl" x1="50" y1="56" x2="50" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d7c8b8" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="58" rx="34" ry="12" fill="#f3e3c3" />
      <path d="M20 58c0-18 13-28 30-28s30 10 30 28Z" fill="#f7e8cd" />
      <g fill="#d7a94f" stroke="#c4943b" strokeWidth="1.6">
        <ellipse cx="40" cy="40" rx="7" ry="4" transform="rotate(-15 40 40)" />
        <ellipse cx="58" cy="38" rx="7" ry="4" transform="rotate(12 58 38)" />
        <ellipse cx="50" cy="50" rx="6" ry="3.6" transform="rotate(-6 50 50)" />
      </g>
      <path d="M16 58h68c0 16-15 28-34 28S16 74 16 58Z" fill="url(#oats-bowl)" />
      <path d="M16 58h68v4H16Z" fill="#c8b8a6" />
      <path d="M24 70c3 6 9 10 16 12" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" opacity="0.6" fill="none" />
    </svg>
  );
}

export function BrownRiceIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="rice-bowl" x1="50" y1="56" x2="50" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d8cdb8" />
        </linearGradient>
      </defs>
      <path d="M20 58c0-17 13-29 30-29s30 12 30 29Z" fill="#a9743a" />
      <g fill="#c3934a" stroke="#8f5c22" strokeWidth="1.4">
        <ellipse cx="38" cy="40" rx="7" ry="3.8" transform="rotate(-12 38 40)" />
        <ellipse cx="54" cy="36" rx="7" ry="3.8" transform="rotate(14 54 36)" />
        <ellipse cx="44" cy="50" rx="7" ry="3.8" transform="rotate(-6 44 50)" />
        <ellipse cx="62" cy="45" rx="7" ry="3.8" transform="rotate(22 62 45)" />
        <ellipse cx="34" cy="52" rx="7" ry="3.8" transform="rotate(-18 34 52)" />
        <ellipse cx="53" cy="56" rx="7" ry="3.8" transform="rotate(8 53 56)" />
      </g>
      <path d="M14 58h72c0 16-16 28-36 28S14 74 14 58Z" fill="url(#rice-bowl)" />
      <path d="M14 58h72v4H14Z" fill="#b7a891" />
      <g stroke="#d8cdb8" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M44 16c-3 5 3 7 0 12" />
        <path d="M56 14c-3 5 3 7 0 12" />
      </g>
    </svg>
  );
}

export function BajraIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="bajra-spike" x1="52" y1="40" x2="52" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#e0a11e" />
        </linearGradient>
      </defs>
      <path d="M62 14c1 10 2 20 2 30" stroke="#4c9148" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M62 20c7-2 10-6 9-10M62 28c7-2 10-6 9-10M62 36c7-2 10-6 9-10" stroke="#5aa552" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="52" cy="56" rx="19" ry="16" fill="url(#bajra-spike)" />
      <g fill="#f7d56a">
        <ellipse cx="42" cy="50" rx="3.4" ry="5" transform="rotate(-8 42 50)" />
        <ellipse cx="52" cy="46" rx="3.4" ry="5" />
        <ellipse cx="62" cy="50" rx="3.4" ry="5" transform="rotate(8 62 50)" />
        <ellipse cx="38" cy="58" rx="3.4" ry="5" transform="rotate(-10 38 58)" />
        <ellipse cx="52" cy="56" rx="3.4" ry="5" />
        <ellipse cx="66" cy="58" rx="3.4" ry="5" transform="rotate(10 66 58)" />
        <ellipse cx="46" cy="63" rx="3.4" ry="5" transform="rotate(-6 46 63)" />
        <ellipse cx="60" cy="63" rx="3.4" ry="5" transform="rotate(6 60 63)" />
        <ellipse cx="52" cy="66" rx="3.4" ry="5" />
      </g>
      <path d="M50 44c-2 6-2 14 0 20" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" opacity="0.4" fill="none" />
    </svg>
  );
}

export function RagiIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="ragi-grain" x1="50" y1="46" x2="50" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#d27a44" />
          <stop offset="1" stopColor="#93402a" />
        </linearGradient>
      </defs>
      <path d="M24 84c0-20 12-34 26-34s26 14 26 34Z" fill="url(#ragi-grain)" />
      <g fill="#7c2f18">
        <ellipse cx="37" cy="57" rx="6" ry="3.8" transform="rotate(-14 37 57)" />
        <ellipse cx="54" cy="53" rx="6" ry="3.8" transform="rotate(18 54 53)" />
        <ellipse cx="48" cy="66" rx="6" ry="3.8" transform="rotate(-8 48 66)" />
        <ellipse cx="63" cy="66" rx="6" ry="3.8" transform="rotate(24 63 66)" />
        <ellipse cx="33" cy="67" rx="6" ry="3.8" transform="rotate(-16 33 67)" />
      </g>
      <g fill="#d8935a">
        <ellipse cx="30" cy="51" rx="5" ry="3.2" />
        <ellipse cx="45" cy="48" rx="5" ry="3.2" transform="rotate(10 45 48)" />
        <ellipse cx="58" cy="49" rx="5" ry="3.2" />
        <ellipse cx="70" cy="61" rx="5" ry="3.2" transform="rotate(20 70 61)" />
      </g>
      <path d="M40 46c6-3 12-3 18-1" stroke="#ffd9a8" strokeWidth="3" strokeLinecap="round" opacity="0.4" fill="none" />
    </svg>
  );
}

export function CurdIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="curd-bowl" x1="50" y1="56" x2="50" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe7ec" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="56" rx="34" ry="11" fill="#f4faf7" />
      <path d="M20 56c0-16 13-27 30-27s30 11 30 27Z" fill="#ffffff" />
      <g transform="rotate(-24 62 38)">
        <rect x="60" y="24" width="4" height="30" rx="2" fill="#b9c4cb" />
        <ellipse cx="62" cy="24" rx="8" ry="5.4" fill="#cfd8dd" />
        <path d="M59 17c-1-3 1-5 3-5s4 2 3 5" stroke="#9fb0b9" strokeWidth="2" fill="none" />
      </g>
      <path d="M30 38c-6 6-8 13-7 21M42 34c-6 6-9 13-8 21" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" opacity="0.55" fill="none" />
      <path d="M16 56h68c0 16-15 28-34 28S16 72 16 56Z" fill="url(#curd-bowl)" stroke="#c2ccd3" strokeWidth="2" />
      <path d="M16 56h68" stroke="#aab6bd" strokeWidth="3" />
    </svg>
  );
}

export function OrangeIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <radialGradient id="orange-skin" cx="0.4" cy="0.32" r="0.9">
          <stop offset="0" stopColor="#ffab40" />
          <stop offset="1" stopColor="#f2771e" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="55" r="33" fill="url(#orange-skin)" />
      <g fill="#d96a18" opacity="0.7">
        <circle cx="38" cy="44" r="2" />
        <circle cx="62" cy="40" r="2" />
        <circle cx="46" cy="66" r="2" />
        <circle cx="66" cy="60" r="2" />
        <circle cx="33" cy="58" r="2" />
        <circle cx="55" cy="34" r="2" />
        <circle cx="72" cy="48" r="1.8" />
        <circle cx="43" cy="30" r="1.8" />
      </g>
      <path d="M50 20c0-6 3-10 8-11-2 6-2 11 0 15h-8Z" fill="#3f8f3a" />
      <path d="M50 24h6c6 0 9 3 9 6 0 4-11 3-15-2Z" fill="#2f7d28" />
      <path d="M34 40c-4 9-4 20 1 28" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" opacity="0.35" fill="none" />
    </svg>
  );
}

export function KiwiIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="kiwi-flesh" x1="50" y1="22" x2="50" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8fc44f" />
          <stop offset="1" stopColor="#5a9e2f" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="36" fill="#8a5a2b" />
      <circle cx="50" cy="50" r="32" fill="url(#kiwi-flesh)" />
      <ellipse cx="50" cy="50" rx="9" ry="14" fill="#f4f5ec" />
      <g fill="#2f2620">
        <circle cx="50" cy="34" r="2.4" />
        <circle cx="66" cy="41" r="2.4" />
        <circle cx="66" cy="59" r="2.4" />
        <circle cx="50" cy="66" r="2.4" />
        <circle cx="34" cy="59" r="2.4" />
        <circle cx="34" cy="41" r="2.4" />
        <circle cx="64" cy="50" r="2.2" />
        <circle cx="36" cy="50" r="2.2" />
      </g>
      <g stroke="#c7965f" strokeWidth="2" strokeLinecap="round" opacity="0.8">
        <path d="M16 42c-1 3-1 5 0 8M18 60c-2-2-2-5-1-8M42 16c-3-1-6-1-9 0M58 16c3-1 6-1 9 0M42 84c3 1 6 1 9 0M58 84c-3 1-6 1-9 0M84 42c1 3 1 5 0 8M82 60c2-2 2-5 1-8" />
      </g>
      <path d="M34 34c4-4 10-6 16-6" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" opacity="0.5" fill="none" />
    </svg>
  );
}

export function PomegranateIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="pomegranate-rind" x1="50" y1="22" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ec5b68" />
          <stop offset="1" stopColor="#a6203a" />
        </linearGradient>
      </defs>
      <path d="M42 26 36 10l9 7 5-9 5 9 9-7-6 16Z" fill="#7a1f2b" />
      <path d="M20 30a30 30 0 0 1 60 0c0 26-13 48-30 48S20 56 20 30Z" fill="url(#pomegranate-rind)" />
      <ellipse cx="50" cy="42" rx="22" ry="20" fill="#f2a0a3" />
      <g fill="#d32f45">
        <circle cx="40" cy="30" r="3.6" />
        <circle cx="53" cy="28" r="3.6" />
        <circle cx="64" cy="32" r="3.4" />
        <circle cx="34" cy="40" r="3.6" />
        <circle cx="46" cy="38" r="3.8" />
        <circle cx="58" cy="38" r="3.8" />
        <circle cx="68" cy="42" r="3.4" />
        <circle cx="40" cy="50" r="3.6" />
        <circle cx="52" cy="50" r="3.8" />
        <circle cx="63" cy="50" r="3.4" />
        <circle cx="47" cy="60" r="3.4" />
        <circle cx="58" cy="59" r="3.2" />
      </g>
      <g fill="#ff8090" opacity="0.75">
        <circle cx="39" cy="28" r="1.4" />
        <circle cx="52" cy="26" r="1.4" />
        <circle cx="45" cy="36" r="1.5" />
        <circle cx="57" cy="36" r="1.5" />
        <circle cx="39" cy="48" r="1.4" />
        <circle cx="51" cy="48" r="1.5" />
        <circle cx="46" cy="57" r="1.3" />
        <circle cx="57" cy="57" r="1.3" />
      </g>
    </svg>
  );
}

export function WatermelonIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="watermelon-flesh" x1="50" y1="32" x2="50" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff8a80" />
          <stop offset="0.6" stopColor="#ef4444" />
          <stop offset="1" stopColor="#d92a2a" />
        </linearGradient>
      </defs>
      <path d="M14 56a36 36 0 0 1 72 0Z" fill="#3f8f3a" />
      <path d="M21 56a29 29 0 0 1 58 0Z" fill="#dff0cf" />
      <path d="M28 56a22 22 0 0 1 44 0Z" fill="url(#watermelon-flesh)" />
      <g fill="#241a12">
        <ellipse cx="50" cy="70" rx="3" ry="4.6" transform="rotate(-12 50 70)" />
        <ellipse cx="62" cy="65" rx="3" ry="4.6" transform="rotate(-30 62 65)" />
        <ellipse cx="38" cy="65" rx="3" ry="4.6" transform="rotate(30 38 65)" />
        <ellipse cx="56" cy="78" rx="2.6" ry="4" transform="rotate(-20 56 78)" />
        <ellipse cx="44" cy="78" rx="2.6" ry="4" transform="rotate(20 44 78)" />
      </g>
      <path d="M44 40c-4 4-5 8-4 13" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.35" fill="none" />
    </svg>
  );
}

export function PapayaIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="papaya-flesh" x1="50" y1="26" x2="50" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffab40" />
          <stop offset="1" stopColor="#ef7a24" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="56" r="34" fill="#e2c84f" />
      <circle cx="50" cy="56" r="30" fill="url(#papaya-flesh)" />
      <circle cx="50" cy="56" r="14" fill="#f7d9a8" />
      <g fill="#2c2a22">
        <circle cx="44" cy="50" r="3" />
        <circle cx="54" cy="48" r="3" />
        <circle cx="50" cy="58" r="3.2" />
        <circle cx="60" cy="56" r="3" />
        <circle cx="40" cy="58" r="2.8" />
        <circle cx="56" cy="62" r="2.8" />
        <circle cx="47" cy="62" r="2.6" />
        <circle cx="53" cy="66" r="2.4" />
      </g>
      <path d="M50 22v-4M50 18c0-3 2-4 4-3" stroke="#8f8f42" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M40 40c-6 8-7 18-4 28" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.4" fill="none" />
    </svg>
  );
}

export function GuavaIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <radialGradient id="guava-skin" cx="0.4" cy="0.32" r="0.9">
          <stop offset="0" stopColor="#cfe58a" />
          <stop offset="1" stopColor="#8fbf3f" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="55" r="33" fill="url(#guava-skin)" />
      <path d="M44 88c2 2 4 3 6 3s4-1 6-3l-3-4-3 2-3-2Z" fill="#6f9430" />
      <path d="M52 22c6-8 16-10 22-7-4 8-13 13-22 13Z" fill="#4c9148" />
      <path d="M53 21c6-3 11-6 15-8" stroke="#7bbf66" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M52 20c0-2 1-3 3-3M52 20c0-3-2-4-4-3" stroke="#6f9430" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M36 42c-4 8-4 18 0 26" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.4" fill="none" />
    </svg>
  );
}

export function SweetLimeIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <radialGradient id="sweet-lime-skin" cx="0.4" cy="0.32" r="0.9">
          <stop offset="0" stopColor="#d9e88a" />
          <stop offset="1" stopColor="#9fc04a" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="57" r="31" fill="url(#sweet-lime-skin)" />
      <path d="M50 24c0-4 2-7 5-7l1 5-3 3Z" fill="#6f9430" />
      <path d="M55 20c4-6 11-7 16-4-3 5-9 9-16 9Z" fill="#4c9148" />
      <g fill="#7fa03a" opacity="0.7">
        <circle cx="38" cy="48" r="2" />
        <circle cx="60" cy="42" r="2" />
        <circle cx="46" cy="68" r="2" />
        <circle cx="66" cy="60" r="1.8" />
        <circle cx="34" cy="60" r="1.8" />
        <circle cx="53" cy="36" r="1.8" />
      </g>
      <path d="M34 44c-4 9-4 19 1 27" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.4" fill="none" />
    </svg>
  );
}

export function AmlaIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <radialGradient id="amla-skin" cx="0.4" cy="0.34" r="0.9">
          <stop offset="0" stopColor="#d5e866" />
          <stop offset="1" stopColor="#8db528" />
        </radialGradient>
      </defs>
      <path d="M50 22c14 0 24 12 26 26 1 9-3 20-10 26-4 4-10 6-16 6s-12-2-16-6c-7-6-11-17-10-26 2-14 12-26 26-26Z" fill="url(#amla-skin)" />
      <g stroke="#7da31c" strokeWidth="2.2" opacity="0.7" fill="none">
        <path d="M50 26v50" />
        <path d="M63 28c-3 15-3 32-1 46" />
        <path d="M37 28c3 15 3 32 1 46" />
      </g>
      <g stroke="#b8d94b" strokeWidth="1.8" opacity="0.7" fill="none">
        <path d="M57 27c-1 15 0 31 1 46" />
        <path d="M43 27c1 15 0 31-1 46" />
      </g>
      <path d="M52 20c0-3-2-5-4-4l-1 4Z" fill="#6f9430" />
      <path d="M44 84c4 3 8 3 12 0l-3-3-3 2-3-2Z" fill="#7da31c" />
      <path d="M38 52c-4 8-4 18 0 24" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.4" fill="none" />
    </svg>
  );
}

export function BeetrootIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="beetroot-body" x1="50" y1="40" x2="50" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b22e46" />
          <stop offset="1" stopColor="#7c142c" />
        </linearGradient>
      </defs>
      <g>
        <path d="M42 44C34 30 30 18 36 10c6 8 12 16 14 28-3 2-6 4-8 6Z" fill="#3f8b3f" />
        <path d="M52 46C56 32 62 20 70 14c-8 8-12 16-12 28-2 2-4 3-6 4Z" fill="#4c9a4c" />
        <path d="M48 46c-1-12 2-24 8-34 4 10 4 22 0 34-3 1-5 1-8 0Z" fill="#57ad57" />
      </g>
      <path d="M41 40c0-2 2-3 3-2M49 34c0-2 3-3 5-1M58 40c2-1 3 0 3 2" stroke="#7c142c" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M50 36c13 0 22 8 22 20 0 12-9 28-22 28s-22-16-22-28c0-12 9-20 22-20Z" fill="url(#beetroot-body)" />
      <path d="M50 84v6c0 2-2 3-4 2" stroke="#7c142c" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M38 50c-4 8-4 18 0 24" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.3" fill="none" />
    </svg>
  );
}

export function CauliflowerIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <radialGradient id="cauliflower-head" cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e2e6de" />
        </radialGradient>
      </defs>
      <path d="M44 60h12v18c0 4-3 7-6 7s-6-3-6-7Z" fill="#c9e0a8" />
      <path d="M50 64v14" stroke="#9cc472" strokeWidth="2.4" strokeLinecap="round" />
      <g fill="url(#cauliflower-head)">
        <circle cx="31" cy="52" r="13" />
        <circle cx="50" cy="40" r="16" />
        <circle cx="69" cy="52" r="13" />
        <circle cx="41" cy="60" r="11" />
        <circle cx="60" cy="60" r="11" />
      </g>
      <g fill="#f2f4ee" opacity="0.8">
        <circle cx="42" cy="36" r="3.4" />
        <circle cx="56" cy="32" r="3" />
        <circle cx="30" cy="48" r="3" />
        <circle cx="70" cy="48" r="3.2" />
        <circle cx="50" cy="52" r="3" />
        <circle cx="62" cy="60" r="2.6" />
        <circle cx="40" cy="58" r="2.6" />
      </g>
    </svg>
  );
}

export function GreenBeansIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="green-bean" x1="50" y1="16" x2="50" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#63b74f" />
          <stop offset="1" stopColor="#2f8033" />
        </linearGradient>
      </defs>
      <g fill="url(#green-bean)">
        <rect x="46" y="14" width="8" height="72" rx="4" transform="rotate(12 50 52)" />
        <rect x="46" y="14" width="8" height="72" rx="4" transform="rotate(-32 50 52)" />
        <rect x="46" y="14" width="8" height="70" rx="4" transform="rotate(58 50 52)" />
        <rect x="46" y="14" width="8" height="68" rx="4" transform="rotate(92 50 52)" />
      </g>
      <rect x="34" y="44" width="32" height="16" rx="6" fill="#c9b25c" />
      <rect x="34" y="44" width="32" height="6" fill="#dcc783" opacity="0.7" />
    </svg>
  );
}

export function OkraIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="okra-pod" x1="50" y1="24" x2="50" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#74c044" />
          <stop offset="1" stopColor="#38973a" />
        </linearGradient>
      </defs>
      <path d="M50 12 55 20l9-3-4 8 3 9-11-5-11 5 3-9-4-8 9 3Z" fill="#e8f4d2" stroke="#38973a" strokeWidth="2" />
      <path d="M38 22c-2 24 0 52 8 72 3 7 6 7 8 0 8-20 10-48 8-72-6-10-16-10-24 0Z" fill="url(#okra-pod)" />
      <g stroke="#2f8033" strokeWidth="2.2" opacity="0.65" fill="none">
        <path d="M50 24v72" />
        <path d="M42 24c0 12-1 32 2 48" />
        <path d="M58 24c0 12 1 32-2 48" />
      </g>
      <path d="M33 44c-3 8-3 16 0 24" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" opacity="0.35" fill="none" />
    </svg>
  );
}

export function RadishIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="radish-body" x1="50" y1="36" x2="50" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef5a7a" />
          <stop offset="0.45" stopColor="#f28a9a" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <path d="M50 36c9 0 16 7 16 16 0 10-7 30-16 36-9-6-16-26-16-36 0-9 7-16 16-16Z" fill="url(#radish-body)" />
      <path d="M50 88c0 4-2 7-4 9M50 88c0 4 2 7 4 9" stroke="#f7c9cf" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M42 42C34 30 30 18 36 10c6 8 11 16 13 28-3 2-5 3-7 4Z" fill="#3f8b3f" />
      <path d="M52 44C58 32 64 20 72 14c-8 7-12 15-12 28-3 1-5 2-8 2Z" fill="#4c9a4c" />
      <path d="M48 46c-2-10 0-20 6-28 3 9 3 18-1 26-2 1-4 2-5 2Z" fill="#57ad57" />
      <path d="M38 54c-4 8-4 18 0 24" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.4" fill="none" />
    </svg>
  );
}

export function DrumstickIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="drumstick-pod" x1="50" y1="14" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6fbe4e" />
          <stop offset="1" stopColor="#3a8f3f" />
        </linearGradient>
      </defs>
      <g fill="url(#drumstick-pod)">
        <path d="M50 12c3 12 6 38 8 64l0 12c0 3-3 5-5 4-2-1-3-3-3-7V76c2-26 5-52 8-64-1-2 1-2-0 0Z" transform="rotate(-38 50 50)" />
        <g stroke="#2f7d32" strokeWidth="2" opacity="0.6" fill="none">
          <path d="M43 20c-3 20-4 40-3 56" transform="rotate(-38 50 50)" />
        </g>
        <path d="M50 14c3 12 6 36 8 60v16c0 3-3 5-5 3-2-1-3-3-3-6V74c2-24 5-48 8-60-1-2 1-2 0 0Z" transform="rotate(24 50 50) translate(6 8)" />
        <g stroke="#2f7d32" strokeWidth="2" opacity="0.6" fill="none">
          <path d="M43 24c-3 18-4 36-3 52" transform="rotate(24 50 50) translate(6 8)" />
        </g>
      </g>
      <path d="M30 24c-3 12-4 26-3 38" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" opacity="0.35" fill="none" />
    </svg>
  );
}

export function MasoorDalIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="masoor-dal" x1="50" y1="46" x2="50" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f4a04a" />
          <stop offset="1" stopColor="#d05f1d" />
        </linearGradient>
      </defs>
      <path d="M24 84c0-20 12-34 26-34s26 14 26 34Z" fill="url(#masoor-dal)" />
      <g fill="#b54e17">
        <circle cx="37" cy="57" r="4.4" />
        <circle cx="54" cy="52" r="4.4" />
        <circle cx="46" cy="66" r="4.4" />
        <circle cx="63" cy="65" r="4.4" />
        <circle cx="33" cy="67" r="4.2" />
        <circle cx="58" cy="60" r="4.2" />
      </g>
      <g fill="#f5b06a">
        <circle cx="30" cy="51" r="3.6" />
        <circle cx="45" cy="48" r="3.6" />
        <circle cx="70" cy="61" r="3.4" />
        <circle cx="40" cy="62" r="3.4" />
        <circle cx="54" cy="72" r="3.2" />
      </g>
      <path d="M40 46c6-3 12-3 18-1" stroke="#ffd9a8" strokeWidth="3" strokeLinecap="round" opacity="0.5" fill="none" />
    </svg>
  );
}

export function ToorDalIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="toor-dal" x1="50" y1="46" x2="50" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f5cf55" />
          <stop offset="1" stopColor="#d89d1c" />
        </linearGradient>
      </defs>
      <path d="M24 84c0-20 12-34 26-34s26 14 26 34Z" fill="url(#toor-dal)" />
      <g fill="#cf9d1e">
        <ellipse cx="38" cy="57" rx="7" ry="4.8" transform="rotate(-14 38 57)" />
        <ellipse cx="55" cy="52" rx="7" ry="4.8" transform="rotate(16 55 52)" />
        <ellipse cx="46" cy="66" rx="7" ry="4.8" transform="rotate(-8 46 66)" />
        <ellipse cx="63" cy="65" rx="7" ry="4.8" transform="rotate(22 63 65)" />
        <ellipse cx="34" cy="67" rx="7" ry="4.8" transform="rotate(-18 34 67)" />
      </g>
      <g fill="#fff0b0" stroke="#f0d48a" strokeWidth="1.4">
        <ellipse cx="31" cy="51" rx="6" ry="4" />
        <ellipse cx="46" cy="48" rx="6" ry="4" transform="rotate(10 46 48)" />
        <ellipse cx="58" cy="49" rx="6" ry="4" />
        <ellipse cx="69" cy="60" rx="6" ry="4" transform="rotate(20 69 60)" />
      </g>
      <path d="M40 46c6-3 12-3 18-1" stroke="#fff6c4" strokeWidth="3" strokeLinecap="round" opacity="0.6" fill="none" />
    </svg>
  );
}

export function ChanaDalIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="chana-dal" x1="50" y1="46" x2="50" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f0c04e" />
          <stop offset="1" stopColor="#e09a1e" />
        </linearGradient>
      </defs>
      <path d="M24 84c0-20 12-34 26-34s26 14 26 34Z" fill="url(#chana-dal)" />
      <g fill="#d98f16">
        <path d="M33 52a9 9 0 0 1 18 0v8l-9-4-9 4Z" transform="rotate(-16 42 56)" />
        <path d="M46 46a9 9 0 0 1 18 0l-9 5-9-5Z" transform="rotate(14 55 50)" />
        <path d="M50 60a9 9 0 0 1 18 0l-9 5-9-5Z" transform="rotate(8 59 64)" />
        <path d="M32 66a9 9 0 0 1 18 0l-9 5-9-5Z" transform="rotate(-24 41 70)" />
      </g>
      <g fill="#ffd97a">
        <path d="M33 52a9 9 0 0 1 18 0v4l-9-3-9 3Z" transform="rotate(-16 42 56)" opacity="0.8" />
        <path d="M46 46a9 9 0 0 1 18 0l-9 3-9-3Z" transform="rotate(14 55 50)" opacity="0.8" />
      </g>
      <path d="M40 46c6-3 12-3 18-1" stroke="#fff2c0" strokeWidth="3" strokeLinecap="round" opacity="0.6" fill="none" />
    </svg>
  );
}

export function WalnutsIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="walnut-shell" x1="32" y1="20" x2="72" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e0b877" />
          <stop offset="1" stopColor="#a86f33" />
        </linearGradient>
      </defs>
      <g fill="#8f5a26" opacity="0.55">
        <path d="M74 24c9 7 13 18 11 32-1 11-8 18-16 16-8-3-11-13-9-23 2-8 8-22 14-25Z" transform="rotate(-20 74 48)" />
      </g>
      <path d="M48 20c14-6 26 4 26 18 0 8-6 15-13 18-2-3-5-5-8-6 4-3 7-7 7-12 0-6-6-10-12-7v-7c0-3-2-4-0-4Z" fill="url(#walnut-shell)" />
      <path d="M50 16c3-4 8-5 13-3 10 2 17 9 19 18 1-9-6-18-17-22-5-2-11-2-15 2" fill="#c89a5c" />
      <path d="M52 34c-2 7-2 14 0 20M54 54c-1 7 1 13 4 18M40 40c6-2 11-2 16 0M38 56c6-2 11-2 16 0M48 78c5-2 10-2 15 0" stroke="#7a4a1c" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.8" />
      <circle cx="54" cy="34" r="2.8" fill="#7a4a1c" opacity="0.8" />
      <path d="M42 30c-3 4-4 9-3 14" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" opacity="0.32" fill="none" />
    </svg>
  );
}

export function SoybeansIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="soybean-pod" x1="50" y1="14" x2="50" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7ac14f" />
          <stop offset="1" stopColor="#3f8f3f" />
        </linearGradient>
      </defs>
      <g transform="rotate(-24 50 52)">
        <path d="M28 22c-8 16-8 42 0 60 6 13 14 13 18 0 4-18 4-44 0-60-4-13-12-13-18 0Z" fill="url(#soybean-pod)" />
        <ellipse cx="37" cy="52" rx="6" ry="26" fill="#d8ecb8" />
        <g fill="#5aa53f">
          <circle cx="36" cy="32" r="6.4" />
          <circle cx="38" cy="49" r="6.6" />
          <circle cx="36" cy="66" r="6.4" />
        </g>
        <g fill="#c6e3a0">
          <circle cx="34" cy="30" r="2.2" />
          <circle cx="36" cy="47" r="2.2" />
          <circle cx="34" cy="64" r="2.2" />
        </g>
      </g>
      <g transform="rotate(38 68 40)">
        <path d="M52 22c-8 16-8 42 0 60 6 13 14 13 18 0 4-18 4-44 0-60-4-13-12-13-18 0Z" fill="#62a742" />
        <ellipse cx="61" cy="52" rx="6" ry="26" fill="#d8ecb8" />
        <g fill="#4c8f39">
          <circle cx="60" cy="32" r="6.4" />
          <circle cx="62" cy="49" r="6.6" />
          <circle cx="60" cy="66" r="6.4" />
        </g>
      </g>
      <path d="M36 24c-4 10-4 24 0 36" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" opacity="0.35" fill="none" />
    </svg>
  );
}

export const FOOD_ICONS: Record<string, (props: IconProps) => React.JSX.Element> = {
  donut: DonutIcon,
  'chocolate-bar': ChocolateBarIcon,
  mango: MangoIcon,
  apple: AppleIcon,
  pineapple: PineappleIcon,
  corn: CornIcon,
  'sweet-potato': SweetPotatoIcon,
  burger: BurgerIcon,
  egg: EggIcon,
  carrot: CarrotIcon,
  milk: MilkIcon,
  broccoli: BroccoliIcon,
  peanuts: PeanutsIcon,
  'soft-drink': SoftDrinkIcon,
  'potato-chips': PotatoChipsIcon,
  'cream-biscuits': CreamBiscuitsIcon,
  pasta: PastaIcon,
  bread: BreadIcon,
  taco: TacoIcon,
  'hot-dog': HotDogIcon,
  'cheese-fries': CheeseFriesIcon,
  waffle: WaffleIcon,
  cake: CakeIcon,
  pancakes: PancakesIcon,
  cupcake: CupcakeIcon,
  'ice-cream': IceCreamIcon,
  lollipop: LollipopIcon,
  candy: CandyIcon,
  'bubble-tea': BubbleTeaIcon,
  spinach: SpinachIcon,
  cucumber: CucumberIcon,
  cabbage: CabbageIcon,
  'green-peas': GreenPeasIcon,
  capsicum: CapsicumIcon,
  tomato: TomatoIcon,
  onion: OnionIcon,
  garlic: GarlicIcon,
  pumpkin: PumpkinIcon,
  lauki: LaukiIcon,
  rajma: RajmaIcon,
  'urad-dal': UradDalIcon,
  'moong-dal': MoongDalIcon,
  oats: OatsIcon,
  'brown-rice': BrownRiceIcon,
  bajra: BajraIcon,
  ragi: RagiIcon,
  curd: CurdIcon,
  orange: OrangeIcon,
  kiwi: KiwiIcon,
  pomegranate: PomegranateIcon,
  watermelon: WatermelonIcon,
  papaya: PapayaIcon,
  guava: GuavaIcon,
  'sweet-lime': SweetLimeIcon,
  amla: AmlaIcon,
  beetroot: BeetrootIcon,
  cauliflower: CauliflowerIcon,
  'green-beans': GreenBeansIcon,
  okra: OkraIcon,
  radish: RadishIcon,
  drumstick: DrumstickIcon,
  'masoor-dal': MasoorDalIcon,
  'toor-dal': ToorDalIcon,
  'chana-dal': ChanaDalIcon,
  walnuts: WalnutsIcon,
  soybeans: SoybeansIcon,
};

export default function FoodIcon({ id, size = 48 }: { id: string; size?: number }) {
  const Icon = FOOD_ICONS[id];
  if (!Icon) return null;
  return <Icon size={size} />;
}
