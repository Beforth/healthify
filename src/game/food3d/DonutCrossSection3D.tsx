import { Candy, Wheat, Wind, Flame } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { DonutHalfGeometry } from './DonutModel';
import Hotspot from './Hotspot';

const FACTS: CrossSectionFact[] = [
  {
    id: 'sugar',
    icon: <Candy size={20} color="#ff6b9d" />,
    name: 'Sugary Glaze',
    tag: '9 g sugar',
    color: '#ff5a7a',
    fact: 'The shiny pink coat is almost all sugar. It gives you a burst of energy that runs out fast and leaves you tired.',
  },
  {
    id: 'dough',
    icon: <Wheat size={20} color="#c9974f" />,
    name: 'White Flour',
    tag: '24 g maida',
    color: '#c9974f',
    fact: 'Refined flour has had its fibre stripped out, so your body turns it straight into sugar — almost as fast as the glaze.',
  },
  {
    id: 'air',
    icon: <Wind size={20} color="#4dd6ff" />,
    name: 'Air Bubbles',
    color: '#4dd6ff',
    fact: 'Look at all the little holes! Tiny yeast blew these bubbles while the dough puffed up. That is why a donut feels so light.',
  },
  {
    id: 'fat',
    icon: <Flame size={20} color="#ff8c42" />,
    name: 'Fried in Oil',
    tag: '6 g butter fat',
    color: '#ff8c42',
    fact: 'A donut is cooked by swimming in hot oil, and it drinks the oil up like a sponge. That is where most of the fat comes from.',
  },
];

/** Marker spots, in the half-ring's own space (ring in the XY plane, glaze on +Z).
 *  The group rotation below carries the markers along with the geometry. */
const SPOTS: Record<string, [number, number, number]> = {
  air: [1.22, -0.08, 0.1], // on the flat cut end, among the air pockets
  dough: [1.11, 1.04, 0.02], // the bare golden band around the outside
  sugar: [-0.03, 1.1, 0.58], // on top of the glaze
  fat: [-0.28, 0.62, 0.05], // the inner wall, facing the hole
};
function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    // The half-ring is born as an arch with its two flat cut ends pointing DOWN,
    // and the camera looks slightly down from above — so in the old framing the
    // cut faces, the whole point of this screen, were never visible. Turning it
    // by PI about Z makes it a "U" with the cut ends up top, where they can be
    // seen, and the glaze still faces the viewer.
    <group position={[0, 0.62, 0]} rotation={[0.26, 0.12, Math.PI]} scale={1.22}>
      <DonutHalfGeometry />
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

export default function DonutCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}
