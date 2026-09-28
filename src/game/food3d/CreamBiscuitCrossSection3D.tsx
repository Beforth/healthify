import { Candy, Droplet, Flame, Leaf } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { CreamBiscuitHalfGeometry } from './CreamBiscuitModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

const FACTS: CrossSectionFact[] = [
  {
    id: 'cream',
    icon: <Droplet size={20} color="#4dd6ff" />,
    name: 'The Cream Filling',
    tag: '≈5–7 g fat',
    color: '#4dd6ff',
    fact: 'The pale band in the middle is nearly all fat and sugar whipped together. It is what makes a biscuit a treat instead of a snack.',
  },
  {
    id: 'sugar',
    icon: <Candy size={20} color="#ff6b9d" />,
    name: 'Sugar',
    tag: '≈8–10 g',
    color: '#ff6b9d',
    fact: 'Just 3–4 of these hold ≈8–10 g of sugar — roughly two teaspoons, hiding in something you finish in seconds.',
  },
  {
    id: 'wafer',
    icon: <Leaf size={20} color="#2c7a3a" />,
    name: 'The Baked Wafers',
    tag: '≈0.5–1 g fibre',
    color: '#c98a4e',
    fact: 'The wafers are refined flour, so there is only ≈0.5–1 g of fibre in the whole pack — almost nothing to fill you up.',
  },
  {
    id: 'energy',
    icon: <Flame size={20} color="#ff8c42" />,
    name: 'The Energy',
    tag: '≈140–160 kcal',
    color: '#ff8c42',
    fact: '≈140–160 kcal from 30 g, plus ≈100–180 mg of sodium. There is salt in sweet biscuits too.',
  },
];

/** Marker spots on the cut face. The imported model is small in its own units,
 *  so these sit much closer to the origin than the procedural foods' markers —
 *  and x is a hair positive so each dot floats just proud of the flat face. */
const SPOTS: Record<string, [number, number, number]> = {
  cream: [0.03, 0, 0.1],
  wafer: [0.03, 0.125, -0.2],
  sugar: [0.03, -0.125, 0.3],
  energy: [0.03, 0.02, -0.36],
};

function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    // Big enough that the cream band is the first thing you see; the shell's
    // KeepInView trims it on a canvas that cannot hold it.
    <group rotation={[0.22, -Math.PI / 2 + 0.42, 0]} scale={3.2}>
      <CreamBiscuitHalfGeometry isLeft={false} />
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

export default function CreamBiscuitCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO['cream-biscuits']}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}
