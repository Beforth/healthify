import { Candy, Citrus, Flame, Leaf } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { BroccoliHalfGeometry } from './BroccoliModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

const FACTS: CrossSectionFact[] = [
  {
    id: 'vitamin-c',
    icon: <Citrus size={20} color="#06d6a0" />,
    name: 'Vitamin C',
    tag: '≈80 mg',
    color: '#06d6a0',
    fact: '≈80 mg of Vitamin C in a 90 g serving — more than most fruit. That is a big shield for your body.',
  },
  {
    id: 'sugar',
    icon: <Candy size={20} color="#ff5a7a" />,
    name: 'Hardly Sweet',
    tag: '≈1.5 g sugar',
    color: '#ff5a7a',
    fact: 'Out of 90 g, only ≈1.5 g is sugar. The rest is mostly water, fibre and crunch.',
  },
  {
    id: 'fibre',
    icon: <Leaf size={20} color="#8bd450" />,
    name: 'Tummy Work',
    tag: '≈2.3 g fibre',
    color: '#8bd450',
    fact: '≈2.3 g of fibre plus ≈55 µg of folate keep your tummy busy without any junk coming along.',
  },
  {
    id: 'energy',
    icon: <Flame size={20} color="#ff8c42" />,
    name: 'Tiny Energy',
    tag: '≈30 kcal',
    color: '#ff8c42',
    fact: 'A whole 90 g serving costs only ≈30 kcal, and still hands you ≈330 mg of potassium.',
  },
];

/** Marker spots on the cut face, in the scan's own space: the head spans about
 *  y = ±0.5 with the stalk down low, and x is a hair positive so each dot floats
 *  just proud of the flat face. */
const SPOTS: Record<string, [number, number, number]> = {
  'vitamin-c': [0.03, 0.3, 0.17], // a floret, top right
  sugar: [0.03, -0.1, 0.05], // the pale stalk, dead centre
  fibre: [0.03, 0.12, -0.2], // a floret, top left
  energy: [0.03, -0.38, -0.1], // down near the cut end of the stalk
};

function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    // The cut face's normal runs along +x, so a quarter turn back about y brings
    // it round to the camera. Drawn big so the stalk and florets read; the
    // shell's KeepInView trims it on a canvas that cannot hold it.
    <group rotation={[0.15, -Math.PI / 2 + 0.35, 0]} scale={2.8}>
      <BroccoliHalfGeometry isLeft={false} />
      {FACTS.map((f) => (
        <Hotspot
          key={f.id}
          id={f.id}
          position={SPOTS[f.id]}
          color={f.color}
          active={active}
          onSelect={select}
          scale={0.36}
        />
      ))}
    </group>
  );
}

export default function BroccoliCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO.broccoli}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}