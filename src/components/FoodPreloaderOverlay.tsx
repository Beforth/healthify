import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { modelPreloader, type PreloadProgress } from '../services/modelPreloader';

interface FoodPreloaderOverlayProps {
  isOpen: boolean;
  onComplete: () => void;
}

const FLOATING_ICONS = [
  { emoji: '🍎', x: '12%', y: '18%', size: 44, delay: 0 },
  { emoji: '🥭', x: '82%', y: '16%', size: 48, delay: 0.4 },
  { emoji: '🍔', x: '15%', y: '75%', size: 52, delay: 0.8 },
  { emoji: '🥛', x: '85%', y: '72%', size: 46, delay: 0.2 },
  { emoji: '🥕', x: '25%', y: '42%', size: 38, delay: 0.6 },
  { emoji: '🍓', x: '76%', y: '45%', size: 40, delay: 1.0 },
  { emoji: '🥞', x: '50%', y: '10%', size: 44, delay: 0.5 },
  { emoji: '🥦', x: '48%', y: '86%', size: 42, delay: 0.9 },
];

export default function FoodPreloaderOverlay({ isOpen, onComplete }: FoodPreloaderOverlayProps) {
  const [progress, setProgress] = useState<PreloadProgress>({
    loaded: 0,
    total: 4,
    percentage: 0,
    label: '🧺 Gathering fresh ingredients from the pantry...',
  });

  useEffect(() => {
    if (!isOpen) return;

    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      setTimeout(() => {
        onComplete();
      }, 180);
    };

    // Listen to progress updates
    const unsubscribe = modelPreloader.onProgress((p) => {
      setProgress(p);
      if (p.percentage >= 100) {
        finish();
      }
    });

    // Start loading the initial batch (completes in <1s or 1.4s max timeout)
    modelPreloader.loadInitialBatch().then(() => {
      finish();
    });

    return () => unsubscribe();
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #134e2c 0%, #1f7a4d 50%, #114c31 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          overflow: 'hidden',
          fontFamily: 'inherit',
        }}
      >
        {/* Soft background ambient gradient glow */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.22) 0%, transparent 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />

        {/* Playful Floating Fruits & Treats */}
        {FLOATING_ICONS.map((item, i) => (
          <motion.div
            key={i}
            initial={{ y: 0, rotate: 0 }}
            animate={{
              y: [0, -18, 0],
              rotate: [0, 8, -8, 0],
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: item.delay,
            }}
            style={{
              position: 'absolute',
              left: item.x,
              top: item.y,
              fontSize: item.size,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))',
              userSelect: 'none',
            }}
          >
            {item.emoji}
          </motion.div>
        ))}

        {/* Central Glassmorphism Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -15 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          style={{
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(20px)',
            borderRadius: 32,
            padding: '36px 32px 30px',
            maxWidth: 460,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(0, 0, 0, 0.08)',
            border: '2px solid rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          {/* Animated Chef / Cooking Badge */}
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.06, 1],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #eefaf2 0%, #d1f2dc 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(31, 122, 77, 0.18)',
                border: '3px solid #ffffff',
                color: '#1f7a4d',
              }}
            >
              <UtensilsCrossed size={36} strokeWidth={2.4} />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.3, 1], rotate: [0, 45, 0] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{
                position: 'absolute',
                top: -2,
                right: -4,
                background: '#ffd166',
                borderRadius: '50%',
                padding: 4,
                boxShadow: '0 2px 8px rgba(255, 209, 102, 0.5)',
              }}
            >
              <Sparkles size={16} color="#7a5500" />
            </motion.div>
          </div>

          <h2
            style={{
              margin: '0 0 6px',
              fontSize: '1.65rem',
              fontWeight: 900,
              color: '#134e2c',
              letterSpacing: -0.4,
            }}
          >
            Setting Up Your Kitchen!
          </h2>

          <p
            style={{
              margin: '0 0 24px',
              fontSize: '0.92rem',
              fontWeight: 600,
              color: '#4a6b57',
              lineHeight: 1.4,
            }}
          >
            Polishing 3D foods and getting everything fresh and ready for play.
          </p>

          {/* Animated Cooking / Food Step Banner */}
          <div
            style={{
              width: '100%',
              background: '#f0fdf4',
              border: '1.5px solid rgba(46, 204, 113, 0.25)',
              borderRadius: 18,
              padding: '12px 16px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 48,
              boxSizing: 'border-box',
            }}
          >
            <motion.div
              key={progress.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                fontSize: '0.92rem',
                fontWeight: 800,
                color: '#166534',
                lineHeight: 1.3,
              }}
            >
              {progress.label}
            </motion.div>
          </div>

          {/* Progress Bar Container */}
          <div style={{ width: '100%', marginBottom: 14 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
                fontSize: '0.84rem',
                fontWeight: 800,
                color: '#387853',
              }}
            >
              <span>Loading 3D Models</span>
              <span
                style={{
                  background: '#e8f7ee',
                  padding: '2px 8px',
                  borderRadius: 999,
                  color: '#134e2c',
                }}
              >
                {progress.percentage}%
              </span>
            </div>

            <div
              style={{
                width: '100%',
                height: 14,
                background: '#e2efe6',
                borderRadius: 999,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(progress.percentage, 4)}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  borderRadius: 999,
                  position: 'relative',
                }}
              >
                {/* Gentle Shimmer highlight */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: '35%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
                  }}
                />
              </motion.div>
            </div>
          </div>

          {/* Subtext info & Skip Option */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 10,
              fontSize: '0.78rem',
              color: '#6e8577',
              fontWeight: 600,
            }}
          >
            <span>
              {progress.loaded} of {progress.total} initial foods ready
            </span>

            {/* Instant Skip button for slow connections */}
            <button
              onClick={onComplete}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#1f7a4d',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 6px',
                borderRadius: 6,
              }}
            >
              Skip to Play <ArrowRight size={13} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
