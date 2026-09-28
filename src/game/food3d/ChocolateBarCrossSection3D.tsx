import { Candy, Droplet, Flame, Wheat } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { ChocolateBarHalfGeometry } from './ChocolateBarModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

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
    icon: <Droplet size={20} color="#4dd6ff" />,
    name: 'Melty Fat',
    tag: '18 g cocoa butter',
    color: '#4dd6ff',
    fact: 'Cocoa butter melts at exactly the temperature of your body — that is the secret of why chocolate melts in your mouth.',
  },
  {
    id: 'energy',
    icon: <Flame size={20} color="#ff8c42" />,
    name: 'The Energy',
    tag: '≈535 kcal',
    color: '#ff8c42',
    fact: '≈535 kcal packed into one 100 g bar, mostly from the sugar and the fat together. That is a lot of energy for something you finish in a few minutes.',
  },
];

/** Marker spots in the half-bar's own space. The scan is small in its own units:
 *  the slab runs from x = -0.5 back to the snapped face at x = 0, is about 0.53
 *  across in z, and its moulded top sits near y = 0.07. */
const SPOTS: Record<string, [number, number, number]> = {
  sugar: [0.015, -0.012, 0], // dead centre of the snapped face
  cocoa: [-0.26, 0.085, -0.14], // a moulded square on top
  fat: [-0.13, 0.085, 0.14], // another square, nearer the front
  energy: [-0.42, 0.085, -0.02], // the far end of the bar
};

function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    // The snapped face's normal runs along +x, and a quarter turn back about y
    // brings it round to face the camera. The extra offset keeps the bar's length
    // receding into the picture rather than showing it edge-on, which for
    // something this thin would read as a sliver.
    <group rotation={[0.4, -Math.PI / 2 + 0.5, 0]} scale={3.0}>
      <ChocolateBarHalfGeometry isLeft={false} />
      {FACTS.map((f) => (
        <Hotspot
          key={f.id}
          id={f.id}
          position={SPOTS[f.id]}
          color={f.color}
          active={active}
          onSelect={select}
          scale={0.5}
        />
      ))}
    </group>
  );
}

export default function ChocolateBarCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO['chocolate-bar']}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}
