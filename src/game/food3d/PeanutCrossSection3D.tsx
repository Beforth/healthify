import { Droplet, Flame, Wheat, Zap } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { PeanutHalfGeometry } from './PeanutModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

const FACTS: CrossSectionFact[] = [
  {
    id: 'halves',
    icon: <Wheat size={20} color="#ceb189" />,
    name: 'Two Little Halves',
    tag: 'Two cotyledons',
    color: '#ceb189',
    fact: 'A peanut splits into the same two halves you see here — little food stores packed for the baby plant.',
  },
  {
    id: 'protein',
    icon: <Zap size={20} color="#2c7a3a" />,
    name: 'Power Protein',
    tag: '≈7.5 g',
    color: '#2c7a3a',
    fact: 'A 30 g handful carries ≈7.5 g of protein — more than most snacks, and the reason peanuts keep you full.',
  },
  {
    id: 'fat',
    icon: <Droplet size={20} color="#4dd6ff" />,
    name: 'Mostly Good Fat',
    tag: '≈14 g',
    color: '#4dd6ff',
    fact: 'Almost half the handful is fat, but the good kind. It is the most energy-packed food there is.',
  },
  {
    id: 'energy',
    icon: <Flame size={20} color="#ff8c42" />,
    name: 'Energy Store',
    tag: '≈170 kcal',
    color: '#ff8c42',
    fact: 'Only ≈1 g of sugar in the whole handful — the ≈170 kcal come from the fat and protein instead.',
  },
];

/** Marker spots on the cut face, in the scan's own space: about 0.45 across
 *  both ways, and x is a hair positive so each dot floats just proud of the
 *  flat face. */
const SPOTS: Record<string, [number, number, number]> = {
  halves: [0.015, 0, 0.02], // the seam, dead centre
  protein: [0.015, -0.1, -0.08], // one kernel half
  fat: [0.015, 0.12, -0.06], // the other kernel half
  energy: [0.015, -0.04, 0.15], // a kernel edge
};

function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    <group rotation={[0.2, -Math.PI / 2 + 0.4, 0]} scale={3}>
      <PeanutHalfGeometry isLeft={false} />
      {FACTS.map((f) => (
        <Hotspot
          key={f.id}
          id={f.id}
          position={SPOTS[f.id]}
          color={f.color}
          active={active}
          onSelect={select}
          scale={0.6}
        />
      ))}
    </group>
  );
}

export default function PeanutCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO.peanuts}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}