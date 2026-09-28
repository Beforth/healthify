import { Flame, Leaf, Wheat, Zap } from 'lucide-react';
import CrossSectionShell, { type CrossSectionFact } from './CrossSectionShell';
import { SweetCornHalfGeometry } from './SweetCornModel';
import Hotspot from './Hotspot';
import { MICRO } from '../micro/microStructures';

const FACTS: CrossSectionFact[] = [
  {
    id: 'kernels',
    icon: <Wheat size={20} color="#e8b32f" />,
    name: 'Sweet Kernels',
    tag: '≈6–7 g sugar',
    color: '#e8b32f',
    fact: 'The yellow rows are the kernels. Their ≈6–7 g of natural sugar arrive wrapped with ≈2.7 g of fibre.',
  },
  {
    id: 'fibre',
    icon: <Leaf size={20} color="#8bd450" />,
    name: 'Kernel Skin',
    tag: '≈2.7 g fibre',
    color: '#8bd450',
    fact: 'The outer coat of each kernel is fibre. That is why corn digests slowly and keeps you full.',
  },
  {
    id: 'protein',
    icon: <Zap size={20} color="#2c7a3a" />,
    name: 'Hidden Protein',
    tag: '≈3.4 g',
    color: '#2c7a3a',
    fact: 'For a vegetable, corn is surprisingly packed: ≈3.4 g of protein in every 100 g.',
  },
  {
    id: 'energy',
    icon: <Flame size={20} color="#ff8c42" />,
    name: 'Slow Energy',
    tag: '≈95 kcal',
    color: '#ff8c42',
    fact: '≈95 kcal of starchy energy, coming out of ≈19 g of carbohydrates. A good steady fuel.',
  },
];

/** Marker spots on the cut face, in the scan's own space: the cob is about 0.46
 *  across, and x is a hair positive so each dot floats just proud of the flat
 *  kernel face. */
const SPOTS: Record<string, [number, number, number]> = {
  kernels: [0.02, 0.05, 0.15], // a ring of kernels
  fibre: [0.02, -0.1, 0.1], // kernel edge
  protein: [0.02, 0.1, -0.12], // kernels out front
  energy: [0.02, 0, 0.03], // the pale core
};

function Scene({
  active,
  select,
}: {
  active: string | null;
  select: (id: string | null) => void;
}) {
  return (
    <group rotation={[0.2, -Math.PI / 2 + 0.4, 0]} scale={3.3}>
      <SweetCornHalfGeometry isLeft={false} />
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

export default function SweetCornCrossSection3D() {
  return (
    <CrossSectionShell
      facts={FACTS}
      micro={MICRO.corn}
      scene={(active, select) => <Scene active={active} select={select} />}
    />
  );
}