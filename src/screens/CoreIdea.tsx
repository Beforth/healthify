import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Box, Target, Star, Heart, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { DonutIcon } from '../components/FoodIcon';
import BackButton from '../components/BackButton';

const features = [
  { icon: Box, color: '#4dd6ff', title: 'Explore food in 3D', text: 'Spin, cut, and look inside real food shapes.' },
  { icon: Target, color: '#ff6b9d', title: 'Learn through play', text: 'Quizzes and challenges, not boring lessons.' },
  { icon: Star, color: '#ffd166', title: 'Quizzes & points', text: 'Answer right, earn points, level up.' },
  { icon: Heart, color: '#2ecc71', title: 'Real benefits', text: 'See how healthy and junk food affect your body.' },
];

export default function CoreIdea() {
  const navigate = useNavigate();

  return (
    <div
      className="screen"
      style={{ background: 'linear-gradient(160deg, #fff6e0 0%, #ffe9b8 100%)' }}
    >
      <BackButton fallback="/" />
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ fontSize: '2.4rem', color: 'var(--green-dark)', margin: 0, fontWeight: 900 }}>
          Explore Food in 3D
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--ink-soft)', marginTop: 8 }}>
          Learn nutrition through play!
        </p>
      </motion.div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 16,
          maxWidth: 640,
          marginTop: 32,
          width: '100%',
        }}
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="card"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ y: -4, boxShadow: '0 14px 30px rgba(0,0,0,0.16)' }}
            transition={{ delay: 0.15 * i, duration: 0.4 }}
            style={{ textAlign: 'left' }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: `${f.color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <f.icon size={22} color={f.color} strokeWidth={2.5} />
            </div>
            <div style={{ fontWeight: 800, marginTop: 8 }}>{f.title}</div>
            <div style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', marginTop: 4 }}>{f.text}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <UtensilsCrossed size={36} color="var(--green-dark)" />
        <DonutIcon size={40} />
      </motion.div>

      <button
        className="btn"
        style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 8 }}
        onClick={() => navigate('/tutorial')}
      >
        Show me how <ArrowRight size={18} />
      </button>
    </div>
  );
}
