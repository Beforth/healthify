import { Citrus, Droplet, Sprout, Sparkles } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { MangoHalfGeometry } from './MangoModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

const FACTS: CrossSectionFact[] = [
  {
    id: 'skin',
    icon: <Citrus size={20} color="#ff9f43" />,
    name: 'The Golden Skin',
    tag: 'vitamin C',
    color: '#e5533d',
    fact: 'The skin and the pulp just under it are full of vitamin C, which helps keep you from getting sick.',
  },
  {
    id: 'flesh',
    icon: <Droplet size={20} color="#ffaa00" />,
    name: 'The Sweet Part',
    tag: 'natural sugar',
    color: '#ffc300',
    fact: 'Soft, juicy and sweet. The sugar here comes with fibre, so it does not hit your body all at once like sweets do.',
  },
  {
    id: 'pit',
    icon: <Sprout size={20} color="#8a6d3b" />,
    name: 'The Big Seed',
    color: '#a1887f',
    fact: 'One huge flat seed sits in the middle. You cannot eat it — it is the baby mango tree, waiting to be planted.',
  },
  {
    id: 'water',
    icon: <Sparkles size={20} color="#4dd6ff" />,
    name: 'Mostly Water',
    tag: '≈83% water',
    color: '#4dd6ff',
    fact: 'More than eight out of every ten bites of a mango are just water. That is why it is so good on a hot day.',
  },
];

/** Marker spots on the cut face. x is a hair positive so each dot floats just
 *  proud of the flat face instead of sinking into it. */
const SPOTS: Record<string, [number, number, number]> = {
  skin: [0.06, 0.62, 0.42],
  flesh: [0.06, 0.15, -0.26],
  pit: [0.06, -0.04, 0],
  water: [0.06, -0.72, 0.2],
};

function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    <group position={[0, -0.1, 0]} rotation={[0.22, -Math.PI / 2 + 0.38, 0]} scale={1.38}>
      <MangoHalfGeometry isLeft={false} showStem />
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

export default function MangoCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO['mango']}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}
