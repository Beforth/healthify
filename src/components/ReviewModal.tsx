import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X } from 'lucide-react';
import { useReviewStore } from '../store/reviewStore';

const REVIEW_DATA_KEY = 'healthify_review_data';

export default function ReviewModal() {
  const showModal = useReviewStore((s) => s.showModal);
  const dismiss = useReviewStore((s) => s.dismiss);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    try {
      localStorage.setItem(REVIEW_DATA_KEY, JSON.stringify({ rating, comment, at: Date.now() }));
    } catch {
      // storage unavailable — the rating just won't be saved
    }
    setSubmitted(true);
    setTimeout(dismiss, 900);
  };

  return (
    <AnimatePresence>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            style={{ position: 'fixed', inset: 0, background: 'rgba(10, 30, 20, 0.55)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            style={{
              position: 'relative',
              zIndex: 1,
              background: '#ffffff',
              borderRadius: 24,
              padding: '28px 26px',
              width: 320,
              maxWidth: '88vw',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            }}
          >
            <button
              onClick={dismiss}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--ink-soft)',
              }}
            >
              <X size={18} />
            </button>

            {submitted ? (
              <>
                <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>🎉</div>
                <div style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--green-dark)' }}>Thanks a ton!</div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--green-dark)', marginBottom: 4 }}>
                  Enjoying Healthify?
                </div>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: '0 0 16px' }}>
                  You've answered 3 questions already! Let us know how we're doing.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2 }}
                    >
                      <Star
                        size={28}
                        fill={n <= (hoverRating || rating) ? '#ffd166' : 'none'}
                        color={n <= (hoverRating || rating) ? '#ffd166' : '#c7d6cc'}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Anything you'd like to tell us? (optional)"
                  rows={3}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    borderRadius: 14,
                    border: '1.5px solid rgba(0,0,0,0.08)',
                    padding: '10px 12px',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                    resize: 'none',
                    marginBottom: 16,
                  }}
                />

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={dismiss} className="btn secondary" style={{ padding: '10px 18px', fontSize: '0.88rem' }}>
                    Maybe later
                  </button>
                  <button
                    onClick={submit}
                    disabled={rating === 0}
                    className="btn"
                    style={{ padding: '10px 22px', fontSize: '0.88rem' }}
                  >
                    Submit
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
