import { usePlayerStore } from '../store/playerStore';
import UsernameModal from '../components/UsernameModal';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Microscope, Gamepad2, Play } from 'lucide-react';
import { ChocolateBarIcon, DonutIcon, MangoIcon } from '../components/FoodIcon';
import SideDrawer from '../components/SideDrawer';
import { hasSeenTour, useTourStore } from '../store/tourStore';
import FoodPreloaderOverlay from '../components/FoodPreloaderOverlay';
import { modelPreloader } from '../services/modelPreloader';

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
  const username = usePlayerStore((s) => s.player.username);
  const usernameConfirmed = usePlayerStore((s) => s.usernameConfirmed);
  const tourActive = useTourStore((s) => s.active);
  const startTour = useTourStore((s) => s.start);
  const [showPreloader, setShowPreloader] = useState(false);

  useEffect(() => {
    // Only auto-start the website tour on first landing
    if (usernameConfirmed && !hasSeenTour() && !tourActive) {
      startTour();
    }
  }, [usernameConfirmed, tourActive, startTour]);

  const handlePlay = () => {
    if (modelPreloader.isReady()) {
      navigate(hasSeenTour() ? '/foods' : '/learn');
    } else {
      setShowPreloader(true);
    }
  };

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
    navigate(hasSeenTour() ? '/foods' : '/learn');
  };

  return (
    <div
      className="screen pattern-light"
      style={{
        background: 'linear-gradient(160deg, #1f7a4d 0%, #2ecc71 55%, #7de3a3 100%)',
        color: 'white',
      }}
    >
      <SideDrawer />
      {!usernameConfirmed && <UsernameModal />}
      <p style={{ overflowWrap: 'anywhere', maxWidth: '100%' }}>Hi, {username}!</p>

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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 32 }}>
          <motion.button
            className="btn"
            data-tour="play-button"
            style={{
              background: 'white',
              color: 'var(--green-dark)',
              boxShadow: '0 6px 0 #cfe9d9',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '1.1rem',
              padding: '14px 34px',
            }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={handlePlay}
          >
            Let's Play! <Play size={18} fill="var(--green-dark)" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/tutorial')}
            style={{
              background: 'rgba(255, 255, 255, 0.22)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              color: 'white',
              borderRadius: 999,
              padding: '8px 22px',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            How to Play
          </motion.button>
        </div>
      </motion.div>

      <FoodPreloaderOverlay isOpen={showPreloader} onComplete={handlePreloaderComplete} />
    </div>
  );
}
