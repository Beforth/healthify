import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, Leaf, Candy, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { FOODS } from '../data/nutritionData';
import { nextRequiredCategory, useGameStore } from '../store/gameStore';
import Breadcrumbs from '../components/Breadcrumbs';
import FoodThumbnail3D from '../game/food3d/FoodThumbnail3D';

const PAGE_SIZE = 8;

export default function FoodSelect() {
  const navigate = useNavigate();
  const score = useGameStore((s) => s.score);
  const lastCategoryPlayed = useGameStore((s) => s.lastCategoryPlayed);
  const selectFood = useGameStore((s) => s.selectFood);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const required = nextRequiredCategory(lastCategoryPlayed);
  const visibleFoods = FOODS.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(visibleFoods.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = visibleFoods.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="screen" style={{ justifyContent: 'flex-start', padding: '16px 20px 48px' }}>
      <header
        style={{
          width: '100%',
          maxWidth: 960,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0 auto 16px',
          padding: '4px 2px',
        }}
      >
        <Breadcrumbs
          backFallback="/"
          items={[{ label: 'Pick a Food' }]}
        />

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: 999,
            padding: '7px 16px',
            border: '1px solid rgba(31, 122, 77, 0.12)',
            boxShadow: '0 4px 14px rgba(31, 122, 77, 0.07)',
            fontWeight: 800,
            color: 'var(--green-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.92rem',
          }}
        >
          <Star size={18} fill="#ffd166" color="#ffd166" /> {score} pts
        </div>
      </header>

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
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
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
          // Capped at four across: the library is long enough now that one column
          // per food would squeeze every card down to a sliver on a laptop.
          gridTemplateColumns: `repeat(${Math.min(pageItems.length || 1, 4)}, minmax(0, 1fr))`,
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
        {pageItems.map((food, i) => {
          const locked = required !== null && food.category !== required;
          return (
            <motion.button
              key={food.id}
              className="card"
              data-tour={i === 0 ? 'food-card-0' : undefined}
              disabled={locked}
              initial={false}
              animate={{ y: 0, opacity: locked ? 0.35 : 1 }}
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
              <FoodThumbnail3D foodId={food.id} size={100} scale={0.85} />
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

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            marginTop: 26,
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(12px)',
            borderRadius: 999,
            border: '1px solid rgba(31, 122, 77, 0.1)',
            boxShadow: '0 4px 16px rgba(31, 122, 77, 0.06)',
          }}
        >
          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={safePage === 0 ? undefined : { scale: 1.08 }}
            aria-label="Previous page"
            disabled={safePage === 0}
            onClick={() => setPage(Math.max(0, safePage - 1))}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              border: 'none',
              background: safePage === 0 ? 'rgba(0,0,0,0.04)' : 'rgba(31, 122, 77, 0.08)',
              color: safePage === 0 ? '#b0c0b8' : 'var(--green-dark)',
              cursor: safePage === 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={20} strokeWidth={2.6} />
          </motion.button>

          {/* Interactive breadcrumb dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => setPage(idx)}
                aria-label={`Go to page ${idx + 1}`}
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  width: idx === safePage ? 22 : 8,
                  height: 8,
                  borderRadius: 999,
                  border: 'none',
                  background: idx === safePage ? 'var(--green-dark)' : 'rgba(31, 122, 77, 0.24)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.22s ease',
                }}
              />
            ))}
          </div>

          <span style={{ fontWeight: 800, color: 'var(--ink-soft)', fontSize: '0.88rem', minWidth: 42, textAlign: 'center' }}>
            {safePage + 1} / {totalPages}
          </span>

          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={safePage >= totalPages - 1 ? undefined : { scale: 1.08 }}
            aria-label="Next page"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              border: 'none',
              background: safePage >= totalPages - 1 ? 'rgba(0,0,0,0.04)' : 'rgba(31, 122, 77, 0.08)',
              color: safePage >= totalPages - 1 ? '#b0c0b8' : 'var(--green-dark)',
              cursor: safePage >= totalPages - 1 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronRight size={20} strokeWidth={2.6} />
          </motion.button>
        </div>
      )}
    </div>
  );
}
