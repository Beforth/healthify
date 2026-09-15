import { Apple as AppleIconLucide, Droplet, Sparkles, Sprout } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { AppleHalfGeometry } from './AppleModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

const FACTS: CrossSectionFact[] = [
  {
    id: 'skin',
    icon: <AppleIconLucide size={20} color="#d90429" />,
    name: 'The Red Skin',
    tag: '4.5 g fibre',
    color: '#e63946',
    fact: "Don't peel it! Most of the fibre lives in the skin. Fibre is like a little broom that keeps your tummy working properly.",
  },
  {
    id: 'flesh',
    icon: <Droplet size={20} color="#f4a261" />,
    name: 'The Juicy Part',
    tag: '19 g natural sugar',
    color: '#ffb703',
    fact: 'Sweet and crunchy. This sugar is natural, and the fibre around it means your body takes it in slowly instead of all in one rush.',
  },
  {
    id: 'seeds',
    icon: <Sprout size={20} color="#5c3d2e" />,
    name: 'The Seeds',
    color: '#8d5524',
    fact: 'They sit in a little star-shaped case right in the middle. Don’t eat these — but plant one and it can grow into a whole apple tree.',
  },
  {
    id: 'vitamins',
    icon: <Sparkles size={20} color="#e76f51" />,
    name: 'Vitamin C',
    tag: '8 mg',
    color: '#06d6a0',
    fact: 'Vitamin C helps your body fight off colds. An apple also gives you potassium, which your muscles need to move.',
  },
];

/** Marker spots on the cut face. x is a hair positive so each dot floats just
 *  proud of the flat face instead of sinking into it. */
const SPOTS: Record<string, [number, number, number]> = {
  skin: [0.06, 0.4, 0.95],
  flesh: [0.06, 0.6, -0.35],
  seeds: [0.06, -0.02, 0],
  vitamins: [0.06, -0.55, -0.45],
};
function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    <group position={[0, -0.1, 0]} rotation={[0.22, -Math.PI / 2 + 0.38, 0]} scale={1.42}>
      <AppleHalfGeometry isLeft={false} showStem />
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

export default function AppleCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO['apple']}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}
