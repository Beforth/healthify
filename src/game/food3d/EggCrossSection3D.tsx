import { Droplet, Flame, Sparkles, Zap } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { EggHalfGeometry } from './EggModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

const FACTS: CrossSectionFact[] = [
  {
    id: 'yolk',
    icon: <Droplet size={20} color="#f7b32b" />,
    name: 'The Yellow Yolk',
    tag: '≈5 g fat',
    color: '#f7b32b',
    fact: 'All of the fat sits in here — and so do the vitamins. B12, vitamin D, selenium and choline all live in the yolk.',
  },
  {
    id: 'white',
    icon: <Zap size={20} color="#4dd6ff" />,
    name: 'The White',
    tag: '≈6.3 g protein',
    color: '#8ecae6',
    fact: 'Mostly water and protein. Protein is the stuff your body builds muscles, skin and hair out of.',
  },
  {
    id: 'energy',
    icon: <Flame size={20} color="#ff8c42" />,
    name: 'Small but Mighty',
    tag: '≈70 kcal',
    color: '#ff8c42',
    fact: 'One egg is only about 70 kcal, and it has almost no sugar at all — just ≈0.2 g.',
  },
  {
    id: 'minerals',
    icon: <Sparkles size={20} color="#8bd450" />,
    name: 'Iron & Calcium',
    tag: '≈0.9 mg iron',
    color: '#06d6a0',
    fact: 'An egg brings ≈0.9 mg of iron for your blood, ≈25 mg of calcium for your bones and ≈65 mg of potassium.',
  },
];

/** Marker spots on the cut face. x is a hair positive so each dot floats just
 *  proud of the flat face instead of sinking into it. */
const SPOTS: Record<string, [number, number, number]> = {
  yolk: [0.06, -0.02, 0],
  white: [0.06, 0.66, -0.3],
  energy: [0.06, -0.66, 0.3],
  minerals: [0.06, 0.18, 0.52],
};

function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    <group position={[0, -0.05, 0]} rotation={[0.2, -Math.PI / 2 + 0.36, 0]} scale={1.45}>
      <EggHalfGeometry isLeft={false} />
      {FACTS.map((f) => (
        <Hotspot
          key={f.id}
          id={f.id}
          position={SPOTS[f.id]}
          color={f.color}
          active={active}
          onSelect={select}
        />
      ))}
    </group>
  );
}

export default function EggCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO['egg']}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}
