import { Candy, Flame, Wheat, Shield } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { ChocolateHalf } from './ChocolateBarModel';
import Hotspot from './Hotspot';

const FACTS: CrossSectionFact[] = [
  {
    id: 'sugar',
    icon: <Candy size={20} color="#ff5a7a" />,
    name: 'Loads of Sugar',
    tag: '40 g in a 100 g bar',
    color: '#ff5a7a',
    fact: 'Almost half of this bar is pure sugar. Out of every ten bites, four of them are sugar and nothing else.',
  },
  {
    id: 'cocoa',
    icon: <Wheat size={20} color="#3f2415" />,
    name: 'Real Cocoa',
    tag: '20 g',
    color: '#7b3f00',
    fact: 'This is the part that comes from a cocoa bean on a tree. It is the one bit of a chocolate bar that is actually good for you.',
  },
  {
    id: 'fat',
    icon: <Flame size={20} color="#e8552b" />,
    name: 'Melty Fat',
    tag: '18 g cocoa butter',
    color: '#ff8c42',
    fact: 'Cocoa butter melts at exactly the temperature of your body — that is the secret of why chocolate melts in your mouth.',
  },
  {
    id: 'foil',
    icon: <Shield size={20} color="#a8b0ba" />,
    name: 'Shiny Wrapper',
    color: '#8d99ae',
    fact: 'The foil keeps light and air away from the chocolate so it does not go dull and stale on the shelf.',
  },
];

/** Marker spots in the half-bar's own space: the slab runs from x = -0.7 to the
 *  cut face at x = 0, with the moulded squares on top. */
const SPOTS: Record<string, [number, number, number]> = {
  sugar: [0.06, 0, 0], // dead centre of the cut face
  cocoa: [-0.35, 0.24, -0.33], // a moulded square on top
  fat: [-0.35, 0.24, 0.3], // another square, nearer the front
  foil: [-0.36, -0.2, 0.58], // the sliver of wrapper underneath
};

function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    // Turned the other way round from before: the cut face's normal runs along
    // +x, so a positive turn about y swung it away from the camera and hid it.
    <group position={[0.15, 0, 0]} rotation={[0.42, -0.55, 0]} scale={2.15}>
      <ChocolateHalf />
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

export default function ChocolateBarCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}
