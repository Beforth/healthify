import { Candy, Droplet, Flame, Wind } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { IceCreamHalfGeometry } from './IceCreamModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

export const FACTS: CrossSectionFact[] = [
  {
    id: 'sugar',
    icon: <Candy size={20} color="#ff6b9d" />,
    name: 'Sugar',
    tag: '≈14–16 g',
    color: '#ff6b9d',
    fact: 'One scoop holds ≈14–16 g of sugar. Nearly all of its ≈15–18 g of carbohydrate is sugar.',
  },
  {
    id: 'air',
    icon: <Wind size={20} color="#4dd6ff" />,
    name: 'Whipped-In Air',
    color: '#4dd6ff',
    fact: 'Those little holes are air, beaten in while it churned. It is what makes ice cream soft instead of a solid block of ice.',
  },
  {
    id: 'fat',
    icon: <Droplet size={20} color="#1c6b48" />,
    name: 'Milk Fat',
    tag: '≈7–9 g',
    color: '#06d6a0',
    fact: '≈7–9 g of fat from the cream, with ≈2–3 g of protein — and ≈0 g of fibre.',
  },
  {
    id: 'calories',
    icon: <Flame size={20} color="#ff8c42" />,
    name: 'The Energy',
    tag: '≈130–160 kcal',
    color: '#ff8c42',
    fact: '≈130–160 kcal in a single scoop, from the sugar and the cream fat together.',
  },
];

/** Marker spots on the cut face. x is a hair positive so each dot floats just
 *  proud of the flat face instead of sinking into it. */
const SPOTS: Record<string, [number, number, number]> = {
  sugar: [0.06, 0.4, -0.3],
  air: [0.06, 0.12, 0.34],
  fat: [0.06, -0.2, -0.16],
  calories: [0.06, -0.95, 0.02],
};

function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    <group position={[0, 0.42, 0]} rotation={[0.2, -Math.PI / 2 + 0.34, 0]} scale={1.25}>
      <IceCreamHalfGeometry isLeft={false} />
      {FACTS.map((f) => (
        <Hotspot
          key={f.id}
          id={f.id}
          position={SPOTS[f.id]}
          color={f.color}
          active={active}
          onSelect={select}
          scale={0.85}
        />
      ))}
    </group>
  );
}

export default function IceCreamCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO['ice-cream']}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}
