import { Candy, Flame, Leaf, Sparkles } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { CarrotHalfGeometry } from './CarrotModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

const FACTS: CrossSectionFact[] = [
  {
    id: 'flesh',
    icon: <Candy size={20} color="#ff6b9d" />,
    name: 'The Orange Flesh',
    tag: '≈3 g natural sugar',
    color: '#ff8c42',
    fact: 'That sweet crunch is only about 3 g of natural sugar in a whole carrot — ≈54 g of it is plain water.',
  },
  {
    id: 'core',
    icon: <Leaf size={20} color="#8bd450" />,
    name: 'The Pale Core',
    tag: '≈1.7 g fibre',
    color: '#ffc978',
    fact: 'The stripe down the middle is where water travelled up. A carrot carries ≈1.7 g of fibre to keep your tummy busy.',
  },
  {
    id: 'carotene',
    icon: <Sparkles size={20} color="#f0791a" />,
    name: 'Beta-carotene',
    tag: 'High',
    color: '#e7671f',
    fact: 'This is what makes a carrot orange, and there is lots of it. Your body uses it to help you see in dim light.',
  },
  {
    id: 'energy',
    icon: <Flame size={20} color="#ff8c42" />,
    name: 'Barely Any Calories',
    tag: '≈25 kcal',
    color: '#06d6a0',
    fact: 'A whole carrot is only ≈25 kcal, and still hands you ≈190 mg of potassium for your muscles.',
  },
];

/** Marker spots on the cut face. x is a hair positive so each dot floats just
 *  proud of the flat face instead of sinking into it. */
const SPOTS: Record<string, [number, number, number]> = {
  flesh: [0.06, 0.74, 0.16],
  core: [0.06, 0.28, 0],
  carotene: [0.06, -0.12, -0.12],
  energy: [0.06, -0.58, 0.06],
};

function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    // A root is long and narrow, so it sits a touch smaller than the round foods
    // and wears smaller markers — full-size dots would swallow the carrot whole.
    <group position={[0, -0.12, 0]} rotation={[0.18, -Math.PI / 2 + 0.34, 0]} scale={1.2}>
      <CarrotHalfGeometry isLeft={false} showTops />
      {FACTS.map((f) => (
        <Hotspot
          key={f.id}
          id={f.id}
          position={SPOTS[f.id]}
          color={f.color}
          active={active}
          onSelect={select}
          scale={0.8}
        />
      ))}
    </group>
  );
}

export default function CarrotCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO['carrot']}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}
