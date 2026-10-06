import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Info, FileText, Mail, Compass, Trophy } from 'lucide-react';
import { useTourStore } from '../store/tourStore';
import { usePlayerStore } from '../store/playerStore';
import UsernameModal from './UsernameModal';

const LINKS = [
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/about', label: 'About Us', icon: Info },
  { to: '/terms', label: 'Terms & Conditions', icon: FileText },
  { to: '/contact', label: 'Contact Us', icon: Mail },
];

export default function SideDrawer() {
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const username = usePlayerStore((s) => s.player.username);
  const usernameConfirmed = usePlayerStore((s) => s.usernameConfirmed);
  const navigate = useNavigate();
  const startTour = useTourStore((s) => s.start);

  return (
    <>
      {editingName && <UsernameModal editing onClose={() => setEditingName(false)} />}
      <motion.button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        data-tour="menu-button"
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 20,
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(255,255,255,0.22)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Menu size={22} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 30 }}
            />
            <motion.div
              key="panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                width: 260,
                maxWidth: '80vw',
                background: '#ffffff',
                zIndex: 31,
                boxShadow: '8px 0 30px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 18px',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 24,
                }}
              >
                <span style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--green-dark)' }}>
                  Healthify
                </span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-soft)' }}
                >
                  <X size={22} />
                </button>
              </div>

              <div className="drawer-profile">
                <span className="drawer-profile-label">Your explorer name</span>
                <strong className="drawer-username">{username}</strong>
                {usernameConfirmed && (
                  <button type="button" className="drawer-username-edit" onClick={() => {
                    setOpen(false);
                    setEditingName(true);
                  }}>Change username</button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {LINKS.map((l) => (
                  <button
                    key={l.to}
                    onClick={() => {
                      setOpen(false);
                      navigate(l.to);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.98rem',
                      fontWeight: 700,
                      color: 'var(--ink)',
                    }}
                  >
                    <l.icon size={19} color="var(--green-dark)" />
                    {l.label}
                  </button>
                ))}

                <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 4px' }} />

                <button
                  onClick={() => {
                    setOpen(false);
                    startTour();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    color: 'var(--ink)',
                  }}
                >
                  <Compass size={19} color="var(--green-dark)" />
                  Take the Tour
                </button>

                <a
                  href="mailto:thehealthify1423@gmail.com"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    margin: '10px 14px 0',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--ink-soft)',
                    textDecoration: 'none',
                    overflowWrap: 'anywhere',
                  }}
                >
                  <Mail size={14} color="var(--green-dark)" />
                  thehealthify1423@gmail.com
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
