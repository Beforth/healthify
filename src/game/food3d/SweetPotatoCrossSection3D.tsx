import { Flame, Leaf, Sparkles, Zap } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { SweetPotatoHalfGeometry } from './SweetPotatoModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

const FACTS: CrossSectionFact[] = [
  {
    id: 'flesh',
    icon: <Zap size={20} color="#f59a42" />,
    name: 'The Orange Flesh',
    tag: '≈26 g carbohydrates',
    color: '#f59a42',
    fact: 'This is the food the plant stored underground all season. It is where nearly all the energy is kept.',
  },
  {
    id: 'fibre',
    icon: <Leaf size={20} color="#8bd450" />,
    name: 'Lots of Fibre',
    tag: '≈4 g fibre',
    color: '#8bd450',
    fact: 'About 4 g of fibre in one medium sweet potato. That is why only ≈5–6 g of its sugar ever rushes you.',
  },
  {
    id: 'carotene',
    icon: <Sparkles size={20} color="#e7671f" />,
    name: 'Beta-carotene',
    tag: 'High',
    color: '#e7671f',
    fact: 'The deeper the orange, the more of it there is. Orange varieties are especially full of it.',
  },
  {
    id: 'potassium',
    icon: <Flame size={20} color="#06d6a0" />,
    name: 'Potassium Power',
    tag: '≈440 mg',
    color: '#06d6a0',
    fact: 'A big ≈440 mg of potassium for your muscles, plus ≈20 mg of Vitamin C and ≈2 g of protein.',
  },
];

/** Marker spots on the cut face, in the scan's own space: the root is about
 *  0.34 across, and x is a hair positive so each dot floats just proud of the
 *  flat face instead of sinking into it. */
const SPOTS: Record<string, [number, number, number]> = {
  flesh: [0.02, 0.06, 0.02],
  fibre: [0.02, -0.04, -0.1],
  carotene: [0.02, -0.12, 0.08],
  potassium: [0.02, 0.12, -0.06],
};

function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    <group rotation={[0.2, -Math.PI / 2 + 0.34, 0]} scale={3.3}>
      <SweetPotatoHalfGeometry isLeft={false} />
      {FACTS.map((f) => (
        <Hotspot
          key={f.id}
          id={f.id}
          position={SPOTS[f.id]}
          color={f.color}
          active={active}
          onSelect={select}
          scale={0.45}
        />
      ))}
    </group>
  );
}

export default function SweetPotatoCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO['sweet-potato']}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}
