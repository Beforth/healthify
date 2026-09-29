import { Candy, Droplet, Sparkles, Zap } from 'lucide-react';
import * as THREE from 'three';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { BurgerHalfGeometry, BURGER_LAYERS } from './BurgerModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

const FACTS: CrossSectionFact[] = [
  {
    id: 'fat',
    icon: <Droplet size={20} color="#4dd6ff" />,
    name: 'The Fat',
    tag: '≈10–15 g',
    color: '#4dd6ff',
    fact: 'One burger holds ≈10–15 g of fat, which is most of why it reaches ≈280–350 kcal.',
  },
  {
    id: 'sodium',
    icon: <Sparkles size={20} color="#e76f51" />,
    name: 'The Salt',
    tag: '≈600–900 mg',
    color: '#e76f51',
    fact: 'Sodium hides in the bun, the sauce and the patty all at once — ≈600–900 mg in one burger.',
  },
  {
    id: 'sugar',
    icon: <Candy size={20} color="#ff6b9d" />,
    name: 'Hidden Sugar',
    tag: '≈5–8 g',
    color: '#ff6b9d',
    fact: 'Nothing about a burger tastes sweet, and yet ≈5–8 g of sugar is in there.',
  },
  {
    id: 'protein',
    icon: <Zap size={20} color="#1c6b48" />,
    name: 'Protein',
    tag: '≈8–12 g',
    color: '#06d6a0',
    fact: 'There is real protein too — ≈8–12 g — along with ≈2–4 g of fibre.',
  },
];

/** Marker spots on the cut face, in the scan's own units. `BURGER_LAYERS` gives
 *  each layer as a fraction of the face's height, so a marker is dropped on the
 *  middle of the band it talks about and inherits that band's width. x is a hair
 *  positive so each dot floats just proud of the flat face. */
const bandY = (id: string) => {
  const layer = BURGER_LAYERS.find((l) => l.id === id)!;
  return THREE.MathUtils.lerp(MIN_Y, MAX_Y, (layer.v0 + layer.v1) / 2);
};

/** The scan's own height, so a fraction of the burger maps back to world units. */
const MIN_Y = -0.198;
const MAX_Y = 0.199;

const SPOTS: Record<string, [number, number, number]> = {
  fat: [0.004, bandY('cheese'), 0], // cheese + patty are where the fat hides
  sodium: [0.004, bandY('top-bun'), 0], // salt baked into the bun crumb
  sugar: [0.004, bandY('bottom-bun'), 0], // the soft bun holds the hidden sugar
  protein: [0.004, bandY('patty'), 0], // the patty is the meat
};

function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    <group rotation={[0.18, -Math.PI / 2 + 0.38, 0]} scale={5.2}>
      <BurgerHalfGeometry isLeft={false} />
      {FACTS.map((f) => (
        <Hotspot
          key={f.id}
          id={f.id}
          position={SPOTS[f.id]}
          color={f.color}
          active={active}
          onSelect={select}
          scale={0.5}
        />
      ))}
    </group>
  );
}

export default function BurgerCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO.burger}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}