import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, Leaf, Candy, Search } from 'lucide-react';
import { FOODS } from '../data/nutritionData';
import { nextRequiredCategory, useGameStore } from '../store/gameStore';
import BackButton from '../components/BackButton';
import FoodThumbnail3D from '../game/food3d/FoodThumbnail3D';

export default function FoodSelect() {
  const navigate = useNavigate();
  const score = useGameStore((s) => s.score);
  const lastCategoryPlayed = useGameStore((s) => s.lastCategoryPlayed);
  const selectFood = useGameStore((s) => s.selectFood);
  const [query, setQuery] = useState('');

  const required = nextRequiredCategory(lastCategoryPlayed);
  const visibleFoods = FOODS.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase()));

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
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          marginTop: 22,
        }}
      >
        <Search
          size={17}
          color="var(--ink-soft)"
          style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods…"
          aria-label="Search foods"
          data-tour="food-search"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '11px 16px 11px 42px',
            borderRadius: 999,
            border: '1.5px solid rgba(0,0,0,0.08)',
            background: '#ffffff',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--ink)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
            outline: 'none',
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${visibleFoods.length || 1}, minmax(0, 1fr))`,
          gap: 16,
          maxWidth: 960,
          width: '100%',
          marginTop: 20,
        }}
        className="food-grid"
      >
        {visibleFoods.length === 0 && (
          <p style={{ gridColumn: '1 / -1', color: 'var(--ink-soft)', fontWeight: 600 }}>
            No foods match "{query}".
          </p>
        )}
        {visibleFoods.map((food, i) => {
          const locked = required !== null && food.category !== required;
          return (
            <motion.button
              key={food.id}
              className="card"
              data-tour={i === 0 ? 'food-card-0' : undefined}
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
              <FoodThumbnail3D foodId={food.id} size={88} />
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
