import { Candy, Flame, Sparkles, X } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { SoftDrinkHalfGeometry } from './SoftDrinkModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

const FACTS: CrossSectionFact[] = [
  {
    id: 'sugar',
    icon: <Candy size={20} color="#ff5a7a" />,
    name: 'Sugar Water',
    tag: '≈35 g',
    color: '#ff5a7a',
    fact: 'Every can is carbonated water with ≈35 g of sugar dissolved into it. That is seven heaped teaspoons.',
  },
  {
    id: 'nothing',
    icon: <X size={20} color="#8fa3a6" />,
    name: 'Nothing Else',
    tag: '0 g protein, 0 g fibre',
    color: '#8fa3a6',
    fact: 'Out comes ≈140 kcal and not a single gram of protein, fat or fibre. There is no good stuff in here.',
  },
  {
    id: 'fizz',
    icon: <Sparkles size={20} color="#4dd6ff" />,
    name: 'The Fizz',
    tag: 'Carbon dioxide',
    color: '#4dd6ff',
    fact: 'The bubbles are carbon dioxide gas squeezed into the liquid under pressure. Crack the can open and it starts fizzing out.',
  },
  {
    id: 'energy',
    icon: <Flame size={20} color="#ff8c42" />,
    name: 'Invisible Energy',
    tag: '≈140 kcal',
    color: '#ff8c42',
    fact: '≈140 kcal, and your body gets it all at once — there is nothing along to slow the sugar down.',
  },
];

/** Marker spots on the cut face, in the scan's own space: the can runs from
 *  y = -0.5 to y = 0.5, and x is a hair positive so each dot floats just proud
 *  of the flat silver interior. */
const SPOTS: Record<string, [number, number, number]> = {
  sugar: [0.03, -0.15, 0.05], // mid can, the open cola
  nothing: [0.03, 0.22, 0.05], // upper wall
  fizz: [0.03, 0.05, 0.2], // near the open rim
  energy: [0.03, -0.38, 0.05], // down in the base
};

function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    <group rotation={[0.05, -Math.PI / 2 + 0.3, 0]} scale={1.6}>
      <SoftDrinkHalfGeometry isLeft={false} />
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

export default function SoftDrinkCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO['soft-drink']}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}