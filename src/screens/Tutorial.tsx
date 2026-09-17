import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CircleCheckBig, UtensilsCrossed, Microscope, ArrowLeft, ArrowRight, ChefHat, SkipForward } from 'lucide-react';
import { DonutIcon } from '../components/FoodIcon';
import BackButton from '../components/BackButton';
import { markTutorialSeen } from '../lib/tutorialSeen';

const steps = [
  { icon: DonutIcon, title: 'Step 1', text: 'Choose a food' },
  { icon: CircleCheckBig, title: 'Step 2', text: 'Select the option you think is right' },
  { icon: UtensilsCrossed, title: 'Step 3', text: 'Drag the knife to cut it virtually' },
  { icon: Microscope, title: 'Step 4', text: "Use the microscope to zoom in and view what's inside" },
];

export default function Tutorial() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const isLast = step === steps.length - 1;
  const StepIcon = steps[step].icon;

  return (
    <div className="screen" style={{ background: 'linear-gradient(160deg, #eafff2 0%, #d3f9e2 100%)' }}>
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BackButton fallback="/learn" />
        <button
          onClick={() => {
            markTutorialSeen();
            navigate('/foods');
          }}
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
        </button>
      </div>
      <h1 style={{ color: 'var(--green-dark)', fontSize: '2rem', fontWeight: 900, marginTop: 20 }}>
        How to Play
      </h1>

      <div style={{ display: 'flex', gap: 8, margin: '16px 0 28px' }}>
        {steps.map((_, i) => (
          <motion.div
            key={i}
            animate={{ scale: i === step ? 1.3 : 1 }}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: i === step ? 'var(--green)' : '#c7ecd7',
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="card"
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{ minWidth: 280, maxWidth: 360 }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'var(--green-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}
          >
            {step === 0 ? <DonutIcon size={40} /> : <StepIcon size={36} color="var(--green-dark)" />}
          </motion.div>
          <div style={{ fontWeight: 800, color: 'var(--green-dark)', marginTop: 12 }}>
            {steps[step].title}
          </div>
          <div style={{ marginTop: 6, fontSize: '1.05rem' }}>{steps[step].text}</div>
        </motion.div>
      </AnimatePresence>

      <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
        {step > 0 && (
          <button
            className="btn secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => setStep((s) => s - 1)}
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}
        <button
          className="btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          onClick={() => {
            if (isLast) {
              markTutorialSeen();
              navigate('/foods');
            } else {
              setStep((s) => s + 1);
            }
          }}
        >
          {isLast ? (
            <>
              Let's pick food! <ChefHat size={18} />
            </>
          ) : (
            <>
              Next <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
