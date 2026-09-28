import { Candy, Droplet, Flame, Zap } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { LollipopHalfGeometry } from './LollipopModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

const FACTS: CrossSectionFact[] = [
  {
    id: 'sugar',
    icon: <Candy size={20} color="#ff6b9d" />,
    name: 'Almost All Sugar',
    tag: '≈11–13 g',
    color: '#ff6b9d',
    fact: 'The whole lollipop weighs ≈15 g, and ≈11–13 g of that is sugar. There is barely anything else in it.',
  },
  {
    id: 'swirl',
    icon: <Droplet size={20} color="#4dd6ff" />,
    name: 'The Swirl',
    tag: '≈13–14 g carbs',
    color: '#4dd6ff',
    fact: 'Those rings are boiled sugar, poured hot and wound round. Cooled fast, it sets like glass instead of going grainy.',
  },
  {
    id: 'calories',
    icon: <Flame size={20} color="#ff8c42" />,
    name: 'The Energy',
    tag: '≈50–60 kcal',
    color: '#ff8c42',
    fact: '≈50–60 kcal, and every single one of them comes from sugar.',
  },
  {
    id: 'nothing',
    icon: <Zap size={20} color="#9aa5ad" />,
    name: 'Nothing Else',
    tag: '0 g protein',
    color: '#9aa5ad',
    fact: 'No protein, no fat, no fibre — and only ≈1 g of water. Nothing here for your body to build with.',
  },
];

/** Marker spots on the cut face. x is a hair positive so each dot floats just
 *  proud of the flat face instead of sinking into it. */
const SPOTS: Record<string, [number, number, number]> = {
  sugar: [0.06, 0.34, 0.3],
  swirl: [0.06, -0.12, -0.46],
  calories: [0.06, -0.44, 0.24],
  nothing: [0.06, 0.02, 0.06],
};

function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    <group position={[0, 0.28, 0]} rotation={[0.2, -Math.PI / 2 + 0.34, 0]} scale={1.45}>
      <LollipopHalfGeometry isLeft={false} />
      {FACTS.map((f) => (
        <Hotspot
          key={f.id}
          id={f.id}
          position={SPOTS[f.id]}
          color={f.color}
          active={active}
          onSelect={select}
          scale={0.78}
        />
      ))}
    </group>
  );
}

export default function LollipopCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO['lollipop']}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}
