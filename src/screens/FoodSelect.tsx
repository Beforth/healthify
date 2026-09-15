import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, Leaf, Candy } from 'lucide-react';
import { FOODS } from '../data/nutritionData';
import { nextRequiredCategory, useGameStore } from '../store/gameStore';
import FoodIcon from '../components/FoodIcon';
import BackButton from '../components/BackButton';

export default function FoodSelect() {
  const navigate = useNavigate();
  const score = useGameStore((s) => s.score);
  const lastCategoryPlayed = useGameStore((s) => s.lastCategoryPlayed);
  const selectFood = useGameStore((s) => s.selectFood);

  const required = nextRequiredCategory(lastCategoryPlayed);

  return (
    <div className="screen" style={{ background: 'linear-gradient(160deg, #eafff2 0%, #ffffff 100%)' }}>
      <BackButton fallback="/tutorial" />
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 24,
          fontWeight: 800,
          color: 'var(--green-dark)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Star size={18} fill="#ffd166" color="#ffd166" /> {score} pts
      </div>

      <h1 style={{ color: 'var(--green-dark)', fontSize: '2rem', fontWeight: 900, margin: 0 }}>
        Pick a Food
      </h1>
      <p
        style={{
          color: 'var(--ink-soft)',
          marginTop: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {required === null ? (
          'Any food — healthy or junk!'
        ) : required === 'healthy' ? (
          <>
            <Leaf size={16} color="var(--green-dark)" /> Time to pick something healthy!
          </>
        ) : (
          <>
            <Candy size={16} color="#d9534f" /> Now try a junk food!
          </>
        )}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 16,
          maxWidth: 620,
          width: '100%',
          marginTop: 28,
        }}
      >
        {FOODS.map((food, i) => {
          const locked = required !== null && food.category !== required;
          return (
            <motion.button
              key={food.id}
              className="card"
              disabled={locked}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.06 }}
              whileTap={locked ? undefined : { scale: 0.95 }}
              whileHover={locked ? undefined : { y: -4, rotate: [0, -2, 2, 0] }}
              onClick={() => {
                if (locked) return;
                selectFood(food.id, food.category);
                navigate(`/play/${food.id}`);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                opacity: locked ? 0.35 : 1,
                cursor: locked ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              <FoodIcon id={food.id} size={52} />
              <div style={{ fontWeight: 700 }}>{food.name}</div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: food.category === 'healthy' ? 'var(--green-dark)' : '#d9534f',
                }}
              >
                {food.category === 'healthy' ? 'Healthy' : 'Junk'}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
