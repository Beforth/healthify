import { Link } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, Leaf, Candy, Search, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { FOODS } from '../data/nutritionData';
import { nextRequiredCategory, useGameStore } from '../store/gameStore';
import Breadcrumbs from '../components/Breadcrumbs';
import FoodThumbnail3D from '../game/food3d/FoodThumbnail3D';
import { isTouchOnly } from '../lib/touch';
import { preloadForGame } from '../game/food3d/foodRegistry';

const PAGE_SIZE = 8;

export default function FoodSelect() {
  // no pop-up / lift effects on touch screens: they cost frames and a finger never hovers
  const touch = isTouchOnly() || (typeof window !== 'undefined' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth <= 768));
  const navigate = useNavigate();
  const score = usePlayerStore((s) => s.player.score);
  const lastCategoryPlayed = useGameStore((s) => s.lastCategoryPlayed);
  const selectFood = useGameStore((s) => s.selectFood);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'healthy' | 'junk'>('all');
  const [page, setPage] = useState(0);

  const required = nextRequiredCategory(lastCategoryPlayed);
  const visibleFoods = FOODS.filter((f) => {
    const matchesQuery = f.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
    return matchesQuery && matchesCategory;
  });
  const totalPages = Math.max(1, Math.ceil(visibleFoods.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = visibleFoods.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);


  return (
    <div className="screen" style={{ justifyContent: 'flex-start', padding: '0 20px 48px' }}>
      <header
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          padding: '16px 12px 10px',
          boxSizing: 'border-box',
        }}
      >
        <Breadcrumbs
          backFallback="/"
          items={[{ label: 'Pick a Food' }]}
        />

        <div
          className="foods-score"
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: 999,
            whiteSpace: 'nowrap',
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
          <Star size={18} fill="#ffd166" color="#ffd166" /> {score} pts <Link to="/leaderboard" style={{ color: 'var(--green-dark)' }}>Leaderboard</Link>
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

      {/* Search Input */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          marginTop: 18,
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

      {/* Category Filter Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 14,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          padding: '4px 6px',
          borderRadius: 999,
          border: '1.5px solid rgba(31, 122, 77, 0.12)',
          boxShadow: '0 4px 14px rgba(31, 122, 77, 0.05)',
        }}
      >
        {[
          { id: 'all', label: 'All Foods', count: FOODS.length },
          { id: 'healthy', label: 'Healthy', icon: Leaf, color: '#16a34a', count: FOODS.filter((f) => f.category === 'healthy').length },
          { id: 'junk', label: 'Treats', icon: Candy, color: '#e11d48', count: FOODS.filter((f) => f.category === 'junk').length },
        ].map((tab) => {
          const active = categoryFilter === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setCategoryFilter(tab.id as 'all' | 'healthy' | 'junk');
                setPage(0);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 999,
                border: 'none',
                background: active ? 'var(--green-dark)' : 'transparent',
                color: active ? '#ffffff' : '#3d5a49',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              {tab.icon && <tab.icon size={15} color={active ? '#ffffff' : tab.color} />}
              {tab.label}
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 7px',
                  borderRadius: 999,
                  background: active ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.06)',
                  color: active ? '#ffffff' : '#4a6b57',
                  fontWeight: 800,
                }}
              >
                {tab.count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Food Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 16,
          maxWidth: 960,
          width: '100%',
          marginTop: 20,
          touchAction: 'pan-y',
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
              animate={{ y: 0, opacity: locked ? 0.42 : 1 }}
              whileTap={locked || touch ? undefined : { scale: 0.95 }}
              whileHover={locked || touch ? undefined : { y: -5 }}
              onClick={() => {
                if (locked) return;
                preloadForGame(food.id); // ensure drei cache is warm before navigate
                selectFood(food.id, food.category);
                navigate(`/play/${food.id}`);
              }}
              onMouseEnter={() => {
                if (!locked) preloadForGame(food.id); // desktop: preload on hover
              }}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: '20px 14px 16px',
                cursor: locked ? 'not-allowed' : 'pointer',
                border: '1.5px solid rgba(46, 204, 113, 0.16)',
                borderRadius: 22,
                background: '#ffffff',
                boxShadow: locked ? 'none' : '0 6px 18px rgba(0,0,0,0.04)',
                overflow: 'hidden',
                touchAction: 'pan-y',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {locked && (
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'rgba(30, 41, 59, 0.75)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 999,
                    zIndex: 2,
                  }}
                >
                  <Lock size={11} /> {required === 'healthy' ? 'Healthy next' : 'Treat next'}
                </div>
              )}
              <FoodThumbnail3D foodId={food.id} size={100} scale={0.85} />
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#134e2c', marginTop: 2 }}>{food.name}</div>
              <div
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: food.category === 'healthy' ? '#eefaf2' : '#fff1f2',
                  color: food.category === 'healthy' ? '#15803d' : '#e11d48',
                }}
              >
                {food.category === 'healthy' ? 'Healthy' : 'Treat'}
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
