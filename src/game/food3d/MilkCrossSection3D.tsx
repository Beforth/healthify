import { Candy, Sparkles, Zap } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { MilkWholeGeometry } from './MilkModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

const FACTS: CrossSectionFact[] = [
  {
    id: 'calcium',
    icon: <Sparkles size={20} color="#8bd450" />,
    name: 'Calcium',
    tag: '≈300 mg',
    color: '#06d6a0',
    fact: '≈300 mg of calcium in one glass. Calcium is what your bones and teeth are built from.',
  },
  {
    id: 'protein',
    icon: <Zap size={20} color="#4dd6ff" />,
    name: 'Protein',
    tag: '≈8 g',
    color: '#4dd6ff',
    fact: '≈8 g of protein per glass, plus vitamins B12 and riboflavin and ≈350 mg of potassium.',
  },
  {
    id: 'lactose',
    icon: <Candy size={20} color="#ff6b9d" />,
    name: 'Milk Sugar',
    tag: '≈12 g',
    color: '#ff6b9d',
    fact: 'Milk has a natural sugar of its own called lactose — ≈12 g in a 250 ml glass.',
  },
];

/**
 * Markers down the near face of the glass, spread out rather than stacked on one
 * spot. The glass stands about a world unit tall, so these are the scan's own
 * coordinates with a little push out from the surface — the markers always draw
 * on top of the food, so sitting them on the glass keeps them tappable instead of
 * half-buried in it.
 */
const SPOTS: Record<string, [number, number, number]> = {
  calcium: [0.17, 0.26, 0.24], // up in the milk, where it is most concentrated
  protein: [0.24, 0.0, 0.22], // through the middle, the bulk of the glass
  lactose: [0.15, -0.26, 0.26], // down at the bottom of the glass
};

function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    // Turned a little off-axis so the markers have a face to sit on, and scaled up
    // off the scan's own unit size the way the other microscope views are.
    <group rotation={[0.06, -Math.PI / 2 + 0.4, 0]} scale={3.4}>
      <MilkWholeGeometry />
      {FACTS.map((f) => (
        <Hotspot
          key={f.id}
          id={f.id}
          position={SPOTS[f.id]}
          color={f.color}
          active={active}
          onSelect={select}
          scale={0.42}
        />
      ))}
    </group>
  );
}

export default function MilkCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO.milk}
      // Never cut, so the panel names the glass rather than a cut that never happened.
      panelTitle="The whole glass, in 3D"
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}
