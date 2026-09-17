import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Droplet, Candy, Flame, Citrus, PartyPopper, RotateCw, Microscope, Hand, Sparkles, X, SkipForward } from 'lucide-react';
import { getFoodById, randomFoodOfCategory, type QuizTopic } from '../data/nutritionData';
import { useGameStore } from '../store/gameStore';
import { useReviewStore } from '../store/reviewStore';
import FoodIcon from '../components/FoodIcon';
import BackButton from '../components/BackButton';
import Celebration from '../components/Celebration';
import BodyEffect from '../components/BodyEffect';
import FoodCanvas from '../game/food3d/FoodCanvas';
import Knife3D from '../game/food3d/Knife3D';
import SliceImpact from '../game/food3d/SliceImpact';
import FoodThumbnail3D from '../game/food3d/FoodThumbnail3D';
import DragRotate from '../game/food3d/DragRotate';
import { FOOD_MODELS, FOOD_CROSS_SECTIONS } from '../game/food3d/foodRegistry';

const topicMeta: Record<QuizTopic, { label: string; icon: typeof Droplet; color: string }> = {
  fat: { label: 'Fat', icon: Droplet, color: '#4dd6ff' },
  sugar: { label: 'Sugar', icon: Candy, color: '#ff6b9d' },
  calories: { label: 'Calories', icon: Flame, color: '#ff8c42' },
  vitamins: { label: 'Vitamins & Minerals', icon: Citrus, color: '#8bd450' },
};

export default function GameScreen() {
  const { foodId } = useParams<{ foodId: string }>();
  const navigate = useNavigate();
  const {
    score,
    gameStep,
    selectedTopic,
    lastAnswerCorrect,
    selectFood,
    selectTopic,
    advanceStep,
    answerQuiz,
    addPoints,
    resetForNextFood,
  } = useGameStore((s) => s);
  const recordAnswer = useReviewStore((s) => s.recordAnswer);

  const [cut, setCut] = useState(false);
  const [zooming, setZooming] = useState(false);
  const [chosenOption, setChosenOption] = useState<number | null>(null);
  /** The option they already got wrong, kept across a retry so it stays flagged. */
  const [wrongChoice, setWrongChoice] = useState<number | null>(null);
  /** Only the first attempt at a question costs points; retries after that don't dip the score again. */
  const [firstAttemptDone, setFirstAttemptDone] = useState(false);
  const [justPenalized, setJustPenalized] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const cutProgressRef = useRef(0);
  const isCuttingAuto = useRef(false);

  const food = foodId ? getFoodById(foodId) : undefined;

  useEffect(() => {
    if (!food) navigate('/foods', { replace: true });
  }, [food, navigate]);

  useEffect(() => {
    if (!food) return;
    // Opening /play/<food> directly — a shared link, a refresh, the back button
    // — never goes through the food picker, so the store never learned which
    // category was played and the healthy/junk alternation quietly stopped
    // applying. Recording it here means every route into a food counts.
    selectFood(food.id, food.category);
    setCut(false);
    setZooming(false);
    setChosenOption(null);
    setWrongChoice(null);
    setFirstAttemptDone(false);
    setJustPenalized(false);
    cutProgressRef.current = 0;
    isCuttingAuto.current = false;
  }, [food, selectFood]);

  if (!food) return null;

  const availableTopics = Array.from(new Set(food.quiz.map((q) => q.topic)));
  const quizQuestion = food.quiz.find((q) => q.topic === selectedTopic);
  const FoodModel = FOOD_MODELS[food.id];
  const CrossSection = FOOD_CROSS_SECTIONS[food.id];

  const handleAutoCut = () => {
    if (cut || isCuttingAuto.current) return;
    isCuttingAuto.current = true;
    let start: number | null = null;
    const duration = 650;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-in-out curve
      const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      cutProgressRef.current = eased;
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        cutProgressRef.current = 1;
        setCut(true);
        setFlashKey((k) => k + 1);
        isCuttingAuto.current = false;
      }
    };
    requestAnimationFrame(animate);
  };

  return (
    <div
      className="screen"
      style={{
        background: 'linear-gradient(165deg, #f0fdf4 0%, #ffffff 50%, #f4fbf7 100%)',
        minHeight: '100vh',
        padding: '16px 20px 32px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header Bar matching reference mockup */}
      <header
        className="game-header"
        style={{
          width: '100%',
          maxWidth: 960,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          rowGap: 10,
          padding: '8px 4px 18px',
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {/* Left: Back Button Capsule + Skip (only while cutting / inspecting) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <BackButton fallback="/foods" force />
          {(gameStep === 'cut' || gameStep === 'microscope') && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.04 }}
              onClick={() => advanceStep('quiz')}
              aria-label="Skip to the quiz"
              style={{
                borderRadius: 999,
                border: '1px solid rgba(0,0,0,0.06)',
                padding: '9px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                background: '#ffffff',
                color: 'var(--ink-soft)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              Skip <SkipForward size={15} strokeWidth={2.5} />
            </motion.button>
          )}
        </div>

        {/* Center: Healthify Brand Header — wraps to its own full-width row on
            narrow screens instead of squeezing / overflowing the other two. */}
        <div
          className="game-header-brand"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
                fill="#38b000"
                fillOpacity="0.28"
              />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
            <span
              style={{
                fontSize: '1.7rem',
                fontWeight: 900,
                color: '#134e2c',
                letterSpacing: '-0.5px',
                fontFamily: 'inherit',
              }}
            >
              Healthify
            </span>
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#387853', marginTop: -2 }}>
            Discover what&apos;s inside your food
          </span>
        </div>

        {/* Right: Score Pill Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 999,
            padding: '6px 18px 6px 14px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>⭐</span>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.05 }}>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                color: '#6e7f75',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Score
            </span>
            <span style={{ fontSize: '1.18rem', fontWeight: 900, color: '#134e2c' }}>{score}</span>
          </div>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <AnimatePresence mode="wait">
          {gameStep === 'choose-topic' && (
            <motion.div
              key="choose-topic"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              style={{ width: '100%', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}
              >
                <FoodThumbnail3D foodId={food.id} size={160} />
              </motion.div>
              <h2 style={{ color: '#134e2c', fontSize: '1.8rem', fontWeight: 900, marginBottom: 8 }}>
                What do you want to explore?
              </h2>
              <p style={{ color: '#4a755d', fontSize: '0.95rem', margin: '0 auto 24px', maxWidth: 420 }}>
                Choose a nutrient to investigate inside this {food.name.toLowerCase()}!
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
                {availableTopics.map((topic) => {
                  const meta = topicMeta[topic];
                  return (
                    <motion.button
                      key={topic}
                      className="btn secondary"
                      whileHover={{ scale: 1.06, y: -2 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => selectTopic(topic)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        borderRadius: 999,
                        background: '#ffffff',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
                        border: '1.5px solid rgba(46, 204, 113, 0.25)',
                      }}
                    >
                      <meta.icon size={20} color={meta.color} /> {meta.label}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {gameStep === 'cut' && (
            <motion.div
              key="cut"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={zooming ? { scale: 1.35, opacity: 0, filter: 'blur(4px)' } : { opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.55 }}
              onAnimationComplete={() => {
                if (zooming) advanceStep('microscope');
              }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 1180,
                minHeight: 'clamp(460px, 78vh, 760px)',
                margin: '0 auto',
                borderRadius: 36,
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(18, 64, 38, 0.08), 0 4px 16px rgba(0,0,0,0.04)',
                border: '1.5px solid rgba(46, 204, 113, 0.22)',
                background: 'linear-gradient(180deg, #edf8f1 0%, #e2f4e8 70%, #faeedd 70%, #f4e3ca 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* Soft decorative background illustration (tabletop edge & ambient soft shapes) */}
              <svg
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                }}
                viewBox="0 0 960 640"
                preserveAspectRatio="none"
              >
                {/* Upper mint curved contour */}
                <path
                  d="M 0 120 Q 240 85, 480 120 T 960 100 L 960 448 L 0 448 Z"
                  fill="none"
                  stroke="#cde8d7"
                  strokeWidth="1.6"
                  opacity="0.55"
                />
                {/* Tabletop highlight line at 70% (y = 448) */}
                <line x1="0" y1="448" x2="960" y2="448" stroke="#ffffff" strokeWidth="2.5" opacity="0.65" />
                <line x1="0" y1="450" x2="960" y2="450" stroke="#e8d0b2" strokeWidth="1.5" opacity="0.85" />

                {/* Soft plant silhouette on left table */}
                <g transform="translate(36, 260) scale(0.68)" opacity="0.32">
                  <rect x="30" y="190" width="76" height="85" rx="8" fill="#ffffff" stroke="#9ecfb0" strokeWidth="3" />
                  <path d="M 68 190 Q 40 120, 15 110 Q 45 150, 68 190" fill="#38a169" />
                  <path d="M 68 190 Q 95 105, 125 95 Q 92 145, 68 190" fill="#2f855a" />
                  <path d="M 68 170 Q 68 85, 78 65 Q 82 120, 68 170" fill="#48bb78" />
                </g>

                {/* Soft microscope silhouette on right table */}
                <g transform="translate(820, 270) scale(0.65)" opacity="0.28">
                  <rect x="35" y="200" width="90" height="18" rx="8" fill="#88c5a1" />
                  <path d="M 80 200 L 80 110 Q 80 80, 105 70 L 115 70" stroke="#71b88e" strokeWidth="8" fill="none" strokeLinecap="round" />
                  <rect x="100" y="55" width="26" height="60" rx="6" fill="#5aa57b" transform="rotate(22 113 85)" />
                  <circle cx="80" cy="135" r="12" fill="#71b88e" />
                </g>
              </svg>

              {/* Top Row: Floating Food Info Card (Left) & Tips Card (Right) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '24px 28px 0',
                  position: 'relative',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                {/* Top-Left: Food Badge */}
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 22,
                    padding: '10px 20px 10px 14px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    pointerEvents: 'auto',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: food.category === 'healthy' ? '#eefaf2' : '#fff4e6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    }}
                  >
                    <FoodIcon id={food.id} size={32} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#134e2c', lineHeight: 1.15 }}>
                      {food.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#387853', marginTop: 2 }}>
                      {food.category === 'healthy' ? 'A healthy choice!' : 'A delicious treat!'}
                    </div>
                  </div>
                </motion.div>

                {/* Top-Right: Tips Card */}
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 20,
                    padding: '14px 18px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    pointerEvents: 'auto',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 700, color: '#1c6b48' }}>
                    <Hand size={16} color="#1c6b48" /> Drag down to cut
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600, color: '#387853' }}>
                    <span style={{ fontSize: '1rem', lineHeight: 1 }}>🔪</span> Move slowly for best results
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600, color: '#387853' }}>
                    <Sparkles size={16} color="#10b981" /> Watch for the cool effects!
                  </div>
                </motion.div>
              </div>

              {/* Center 3D Stage with Big Canvas & Sage Cutting Pedestal */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 'clamp(340px, 56vh, 660px)',
                  marginTop: -42,
                  marginBottom: -32,
                }}
              >
                <FoodCanvas
                  height="clamp(340px, 56vh, 660px)"
                  width="100%"
                  showPedestal
                  autoRotate={false}
                  controlsEnabled={false}
                >
                  {/* Only the food spins in place when dragged — the knife and pedestal
                      never move, since the camera itself stays fixed the whole time. */}
                  <DragRotate>
                    <FoodModel cutProgressRef={cutProgressRef} />
                  </DragRotate>
                  <Knife3D
                    progressRef={cutProgressRef}
                    disabled={cut}
                    onComplete={() => {
                      setCut(true);
                      setFlashKey((k) => k + 1);
                    }}
                  />
                  {flashKey > 0 && <SliceImpact key={flashKey} />}
                </FoodCanvas>
              </div>

              {/* Bottom Action: DRAG TO CUT pill button or Inspect under Microscope */}
              <div
                style={{
                  padding: '0 20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 10,
                }}
              >
                {!cut ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Left side action dashes */}
                    <div style={{ display: 'flex', gap: 4, opacity: 0.75 }}>
                      <span style={{ width: 8, height: 3.5, background: '#1c6b48', borderRadius: 2 }} />
                      <span style={{ width: 16, height: 3.5, background: '#1c6b48', borderRadius: 2 }} />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={handleAutoCut}
                      style={{
                        background: '#1c6b48',
                        color: '#ffffff',
                        borderRadius: 999,
                        padding: '14px 38px',
                        fontSize: '1.02rem',
                        fontWeight: 800,
                        letterSpacing: 0.8,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        boxShadow: '0 8px 24px rgba(28, 107, 72, 0.38)',
                      }}
                    >
                      <Hand size={20} /> DRAG TO CUT
                    </motion.button>

                    {/* Right side action dashes */}
                    <div style={{ display: 'flex', gap: 4, opacity: 0.75 }}>
                      <span style={{ width: 16, height: 3.5, background: '#1c6b48', borderRadius: 2 }} />
                      <span style={{ width: 8, height: 3.5, background: '#1c6b48', borderRadius: 2 }} />
                    </div>
                  </div>
                ) : (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setZooming(true)}
                    style={{
                      background: 'linear-gradient(135deg, #1c6b48 0%, #114c31 100%)',
                      color: '#ffffff',
                      borderRadius: 999,
                      padding: '15px 40px',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      letterSpacing: 0.4,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      boxShadow: '0 10px 28px rgba(28, 107, 72, 0.42)',
                    }}
                  >
                    <Microscope size={22} /> Inspect under Microscope
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {gameStep === 'microscope' && (
            <motion.div
              key="microscope"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', maxWidth: 780, margin: '0 auto', textAlign: 'center' }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#ffffff',
                  padding: '6px 20px',
                  borderRadius: 999,
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  color: '#1c6b48',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                  marginBottom: 16,
                  border: '1px solid rgba(46, 204, 113, 0.2)',
                }}
              >
                <Microscope size={19} /> Microscopic 3D Cut View: {food.name}
              </div>

              <div style={{ marginBottom: 20 }}>
                <CrossSection />
              </div>

              <div
                className="card"
                style={{
                  maxWidth: 500,
                  margin: '0 auto',
                  textAlign: 'left',
                  borderRadius: 22,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  background: '#ffffff',
                  padding: '18px 24px',
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 10, color: 'var(--green-dark)', fontSize: '1rem' }}>
                  Nutritional Breakdown ({food.name}):
                </div>
                {food.nutrition.map((n) => (
                  <div
                    key={n.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '7px 0',
                      borderBottom: '1px dashed #e2f4e8',
                      fontSize: '0.9rem',
                    }}
                  >
                    <span style={{ color: 'var(--ink-soft)' }}>{n.label}</span>
                    <span style={{ fontWeight: 700, color: '#134e2c' }}>{n.value}</span>
                  </div>
                ))}
                {food.isPlaceholder && (
                  <div style={{ fontSize: '0.75rem', color: '#b98900', marginTop: 8 }}>
                    * approximate values
                  </div>
                )}
              </div>

              <motion.button
                className="btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  marginTop: 22,
                  background: '#1c6b48',
                  color: '#ffffff',
                  borderRadius: 999,
                  padding: '13px 36px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  boxShadow: '0 8px 22px rgba(28, 107, 72, 0.35)',
                }}
                onClick={() => advanceStep('quiz')}
              >
                Answer a Question ➜
              </motion.button>
            </motion.div>
          )}

          {gameStep === 'quiz' && quizQuestion && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              style={{ width: '100%', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#ffffff',
                  padding: '4px 14px',
                  borderRadius: 999,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#387853',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  marginBottom: 14,
                }}
              >
                <FoodIcon id={food.id} size={18} /> Quick Quiz Challenge
              </div>
              <h2 style={{ color: '#134e2c', fontSize: '1.4rem', fontWeight: 800, margin: '0 auto 20px' }}>
                {quizQuestion.question}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '0 auto', maxWidth: 360 }}>
                {quizQuestion.options.map((opt, i) => {
                  const isWrongPick = wrongChoice === i;
                  const isPicked = chosenOption === i;
                  return (
                    <motion.button
                      key={opt}
                      className="btn secondary"
                      whileTap={{ scale: 0.96 }}
                      animate={isWrongPick ? { x: [0, -6, 5, 0] } : { x: 0 }}
                      transition={{ duration: 0.4 }}
                      style={{
                        background: isWrongPick ? '#fee2e2' : isPicked ? '#dff5e6' : '#ffffff',
                        border: isWrongPick
                          ? '2px solid #ef4444'
                          : isPicked
                            ? '2px solid #2ecc71'
                            : '1.5px solid rgba(0,0,0,0.08)',
                        borderRadius: 16,
                        padding: '12px 20px',
                        fontSize: '0.96rem',
                        fontWeight: 700,
                        color: isWrongPick ? '#b91c1c' : '#134e2c',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                      onClick={() => setChosenOption(i)}
                    >
                      {opt}
                      {isWrongPick && <X size={17} strokeWidth={3} />}
                    </motion.button>
                  );
                })}
              </div>
              <motion.button
                className="btn"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                style={{
                  marginTop: 22,
                  background: '#1c6b48',
                  color: '#ffffff',
                  borderRadius: 999,
                  padding: '12px 36px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  boxShadow: '0 6px 18px rgba(28, 107, 72, 0.3)',
                }}
                disabled={chosenOption === null}
                onClick={() => {
                  const correct = chosenOption === quizQuestion.correctIndex;
                  if (!firstAttemptDone) recordAnswer();
                  if (correct) {
                    addPoints(10);
                    setJustPenalized(false);
                  } else {
                    setWrongChoice(chosenOption);
                    const penalize = !firstAttemptDone;
                    if (penalize) addPoints(-5);
                    setJustPenalized(penalize);
                    setFirstAttemptDone(true);
                  }
                  answerQuiz(correct);
                }}
              >
                Submit Answer
              </motion.button>
            </motion.div>
          )}

          {gameStep === 'result' && quizQuestion && (
            <motion.div
              key="result"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={
                lastAnswerCorrect
                  ? { scale: 1, opacity: 1, x: 0 }
                  : // a quick shake so a wrong answer is felt, not just read
                    { scale: 1, opacity: 1, x: [0, -14, 12, -8, 6, 0] }
              }
              transition={lastAnswerCorrect ? { duration: 0.35 } : { duration: 0.5 }}
              exit={{ opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: 480,
                margin: '0 auto',
                textAlign: 'center',
                borderRadius: 24,
                padding: lastAnswerCorrect ? 0 : '18px 14px',
                background: lastAnswerCorrect ? 'transparent' : 'rgba(254, 226, 226, 0.75)',
                border: lastAnswerCorrect ? 'none' : '2.5px solid #f87171',
                boxShadow: lastAnswerCorrect ? 'none' : '0 8px 26px rgba(220, 38, 38, 0.16)',
              }}
            >
              {lastAnswerCorrect ? (
                <>
                  <Celebration />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.25, 1], rotate: [0, -12, 12, 0] }}
                    transition={{ duration: 0.6 }}
                    style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}
                  >
                    <PartyPopper size={68} color="#f59e0b" />
                  </motion.div>
                  <motion.h2
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 14 }}
                    style={{ color: '#134e2c', fontSize: '1.7rem', fontWeight: 900, marginBottom: 8 }}
                  >
                    Woohoo! +10 points
                  </motion.h2>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ rotate: [0, -15, 15, -10, 0], scale: [1, 1.12, 1] }}
                    transition={{ duration: 0.55 }}
                    style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}
                  >
                    <RotateCw size={58} color="#dc2626" />
                  </motion.div>
                  <h2 style={{ color: '#b91c1c', fontSize: '1.5rem', fontWeight: 900, marginBottom: 4 }}>
                    Oops — that's not it!
                  </h2>
                  <motion.p
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                    style={{ color: '#dc2626', fontWeight: 800, fontSize: '1rem', margin: '0 0 6px' }}
                  >
                    Have another go — you've got this!
                  </motion.p>
                  {justPenalized && (
                    <p style={{ color: '#b91c1c', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 6px' }}>
                      −5 points
                    </p>
                  )}
                </>
              )}
              {/* explanation names the correct answer, so it only shows once they've actually got it right —
                  otherwise a wrong guess turns retrying into "read the answer, then click it" */}
              {lastAnswerCorrect && (
                <p
                  style={{
                    maxWidth: 420,
                    margin: '0 auto 20px',
                    color: '#476854',
                    fontSize: '0.94rem',
                    lineHeight: 1.5,
                  }}
                >
                  {quizQuestion.explanation}
                </p>
              )}
              {/* the brief's missing beat: having answered, show what the food
                  actually DOES to you. Only after a correct answer — a wrong one
                  should keep all the attention on trying again. */}
              {lastAnswerCorrect && (
                <BodyEffect category={food.category} foodName={food.name.toLowerCase()} />
              )}

              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 18 }}>
                {!lastAnswerCorrect && (
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    className="btn secondary"
                    style={{
                      borderRadius: 999,
                      padding: '11px 24px',
                      fontWeight: 700,
                    }}
                    onClick={() => {
                      setChosenOption(null);
                      advanceStep('quiz');
                    }}
                  >
                    Try Again
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  className="btn"
                  style={{
                    background: '#1c6b48',
                    color: '#ffffff',
                    borderRadius: 999,
                    padding: '11px 28px',
                    fontWeight: 800,
                    boxShadow: '0 6px 18px rgba(28, 107, 72, 0.3)',
                  }}
                  onClick={() => {
                    setCut(false);
                    setZooming(false);
                    cutProgressRef.current = 0;
                    setChosenOption(null);
                    setWrongChoice(null);
                    resetForNextFood();
                    // Go straight into a random food of the opposite category — the
                    // alternation is automatic either direction, so there's no reason
                    // to send them back to the picker just to tap the one unlocked kind.
                    const nextCategory = food.category === 'junk' ? 'healthy' : 'junk';
                    const next = randomFoodOfCategory(nextCategory, food.id);
                    navigate(`/play/${next.id}`);
                  }}
                >
                  Explore Next Food ➜
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
