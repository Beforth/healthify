import { Candy, Citrus, Flame, Leaf } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { PineappleHalfGeometry } from './PineappleModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

const FACTS: CrossSectionFact[] = [
  {
    id: 'sugar',
    icon: <Candy size={20} color="#ff6b9d" />,
    name: 'Natural Sugar',
    tag: '≈16 g',
    color: '#ff6b9d',
    fact: 'Sweet, but it arrives with ≈2.3 g of fibre, so your body takes the sugar in slowly.',
  },
  {
    id: 'vitamin-c',
    icon: <Citrus size={20} color="#8bd450" />,
    name: 'Vitamin C',
    tag: '≈79 mg',
    color: '#06d6a0',
    fact: 'A big pile of Vitamin C for one serving, plus ≈180 mg of potassium for your muscles.',
  },
  {
    id: 'fibre',
    icon: <Leaf size={20} color="#2c7a3a" />,
    name: 'The Tough Core',
    tag: '≈2.3 g fibre',
    color: '#d9b45c',
    fact: 'The pale column up the middle is the chewiest part, and it is where a lot of the ≈2.3 g of fibre is hiding.',
  },
  {
    id: 'water',
    icon: <Flame size={20} color="#ff8c42" />,
    name: 'Mostly Water',
    tag: '≈83 kcal',
    color: '#ff8c42',
    fact: 'Out of a 165 g serving, about 143 g is plain water — that is why it is only ≈83 kcal.',
  },
];

/** Marker spots on the cut face. The scan is small in its own units: the fruit
 *  runs from the base at y = -0.5 up to about y = 0.02 where the crown takes
 *  over, and x is a hair positive so each dot floats just proud of the face.
 *
 *  The core is painted into the flesh rather than being a separate layer, so
 *  these land on colour that is actually there — `fibre` has to sit on the pale
 *  column, and the pale column is much narrower than the core's outline is. */
const SPOTS: Record<string, [number, number, number]> = {
  fibre: [0.03, -0.24, 0], // the pale core, up the middle of the fruit
  sugar: [0.03, -0.27, 0.12], // flesh, front side
  'vitamin-c': [0.03, -0.3, -0.12], // flesh, back side
  water: [0.03, -0.45, 0], // down near the base, where the juice collects
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
    // it round to the camera; the extra offset leaves a strip of the real skin
    // visible beside it, which is what makes it read as a pineapple.
    <group rotation={[0.1, -Math.PI / 2 + 0.25, 0]} scale={2.8}>
      <PineappleHalfGeometry isLeft={false} />
      {FACTS.map((f) => (
        <Hotspot
          key={f.id}
          id={f.id}
          position={SPOTS[f.id]}
          color={f.color}
          active={active}
          onSelect={select}
          scale={0.3}
        />
      ))}
    </group>
  );
}

export default function PineappleCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO.pineapple}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}
