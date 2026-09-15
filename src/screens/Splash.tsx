import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Microscope, Gamepad2, Play } from 'lucide-react';
import { ChocolateBarIcon, DonutIcon, MangoIcon } from '../components/FoodIcon';

const floaters = [
  { render: () => <Microscope size={26} color="#1f7a4d" />, top: '12%', left: '10%', delay: 0 },
  { render: () => <MangoIcon size={30} />, top: '20%', left: '78%', delay: 0.4 },
  { render: () => <ChocolateBarIcon size={30} />, top: '68%', left: '14%', delay: 0.8 },
  { render: () => <DonutIcon size={30} />, top: '75%', left: '72%', delay: 1.2 },
  { render: () => <Gamepad2 size={26} color="#1f7a4d" />, top: '45%', left: '85%', delay: 0.6 },
  { render: () => <MangoIcon size={30} />, top: '55%', left: '4%', delay: 1.0 },
];

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
      }}
    >
      {children}
    </div>
  );
}

export default function Splash() {
  const navigate = useNavigate();

  return (
    <div
      className="screen pattern-light"
      style={{
        background: 'linear-gradient(160deg, #1f7a4d 0%, #2ecc71 55%, #7de3a3 100%)',
        color: 'white',
      }}
    >
      {floaters.map((f, i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', top: f.top, left: f.left }}
          animate={{ y: [0, -18, 0], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: f.delay, ease: 'easeInOut' }}
        >
          <Badge>{f.render()}</Badge>
        </motion.div>
      ))}

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ display: 'inline-flex', marginBottom: 12 }}
        >
          <Badge>
            <Microscope size={44} color="#1f7a4d" />
          </Badge>
        </motion.div>
        <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 900, letterSpacing: 1 }}>
          Healthify
        </h1>
        <p style={{ fontSize: '1.15rem', opacity: 0.9, marginTop: 8 }}>
          Discover what's inside your food!
        </p>

        <motion.button
          className="btn"
          style={{
            marginTop: 36,
            background: 'white',
            color: 'var(--green-dark)',
            boxShadow: '0 6px 0 #cfe9d9',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/learn')}
        >
          Let's Play! <Play size={18} fill="var(--green-dark)" />
        </motion.button>
      </motion.div>
    </div>
  );
}
