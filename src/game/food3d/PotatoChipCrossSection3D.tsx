import { Droplet, Sparkles, Wheat, Zap } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { PotatoChipHalfGeometry } from './PotatoChipModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

const FACTS: CrossSectionFact[] = [
  {
    id: 'cut',
    icon: <Zap size={20} color="#d9a94f" />,
    name: 'Crisp to the Edge',
    tag: 'Thin and wavy',
    color: '#d9a94f',
    fact: 'A crisp is a single paper-thin slice of potato, baked crisp in oil. The wave gives it more golden edge.',
  },
  {
    id: 'fat',
    icon: <Droplet size={20} color="#4dd6ff" />,
    name: 'Fried in Fat',
    tag: '≈16–18 g',
    color: '#4dd6ff',
    fact: 'A 50 g packet is nearly a third fat, soaked in while frying. That is where most of the energy comes from.',
  },
  {
    id: 'salt',
    icon: <Sparkles size={20} color="#aeb9b6" />,
    name: 'Salty Crunch',
    tag: '≈0.5–1.2 g salt',
    color: '#aeb9b6',
    fact: 'Salt is sprinkled on after frying. One packet can carry up to ≈1.2 g of it.',
  },
  {
    id: 'carb',
    icon: <Wheat size={20} color="#a89f91" />,
    name: 'Potato Inside',
    tag: '≈26–28 g carbs',
    color: '#a89f91',
    fact: 'Under the fat and salt it is still a potato — ≈26–28 g of starchy carbohydrate.',
  },
];

/** Marker spots on the cut face, in the scan's own space: the crisp's cut edge
 *  is a thin band about 0.23 tall and 1.0 wide, and x is a hair positive so
 *  each dot floats just proud of the flat break. */
const SPOTS: Record<string, [number, number, number]> = {
  cut: [0.02, 0, -0.3],
  fat: [0.02, -0.05, 0.15],
  salt: [0.02, 0.05, -0.02],
  carb: [0.02, 0, 0.4],
};

function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    <group rotation={[0.4, -Math.PI / 2 + 0.4, 0]} scale={3}>
      <PotatoChipHalfGeometry isLeft={false} />
      {FACTS.map((f) => (
        <Hotspot
          key={f.id}
          id={f.id}
          position={SPOTS[f.id]}
          color={f.color}
          active={active}
          onSelect={select}
          scale={0.4}
        />
      ))}
    </group>
  );
}

export default function PotatoChipCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO['potato-chips']}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}