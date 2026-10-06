import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface CrumbItem {
  label: string;
  to?: string;
  icon?: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

export interface BreadcrumbsProps {
  /** Where to navigate if back button is clicked and there's no browser history (or when forceBack is true) */
  backFallback?: string;
  /** Whether to show the back button. Defaults to true. */
  showBack?: boolean;
  /** Force back button to navigate directly to backFallback */
  forceBack?: boolean;
  /** Whether to include the Home crumb option. Defaults to true. */
  showHome?: boolean;
  /** Custom label for Home. Defaults to 'Home'. */
  homeLabel?: string;
  /** List of crumbs following Home (e.g. [{ label: 'Foods', to: '/foods' }, { label: 'Donut' }]) */
  items?: CrumbItem[];
  /** Dark mode variant (e.g. for dark backdrops) */
  dark?: boolean;
  /** Additional inline styles for the breadcrumb container */
  style?: React.CSSProperties;
}

export default function Breadcrumbs({
  backFallback = '/',
  showBack = true,
  forceBack = false,
  showHome = true,
  homeLabel = 'Home',
  items = [],
  dark = false,
  style,
}: BreadcrumbsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = !forceBack && location.key !== 'default';

  const handleBack = () => {
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate(backFallback);
    }
  };

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px 5px 8px',
        borderRadius: 999,
        background: dark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: dark ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(31, 122, 77, 0.12)',
        boxShadow: dark ? '0 4px 14px rgba(0, 0, 0, 0.15)' : '0 4px 16px rgba(31, 122, 77, 0.07)',
        fontSize: '0.88rem',
        fontWeight: 700,
        color: dark ? '#ffffff' : 'var(--ink)',
        zIndex: 10,
        maxWidth: '100%',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        ...style,
      }}
    >
      {/* Back Button */}
      {showBack && (
        <motion.button
          onClick={handleBack}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.06 }}
          aria-label="Go back"
          title="Go back"
          style={{
            border: 'none',
            background: dark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(31, 122, 77, 0.08)',
            color: dark ? '#ffffff' : 'var(--green-dark)',
            borderRadius: 999,
            width: 30,
            height: 30,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
            transition: 'background-color 0.15s ease',
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.6} />
        </motion.button>
      )}

      {/* Divider between Back and Home */}
      {showBack && showHome && (
        <span
          className="crumb-sep"
          style={{
            width: 1,
            height: 16,
            background: dark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(31, 122, 77, 0.15)',
            margin: '0 2px',
            flexShrink: 0,
          }}
        />
      )}

      {/* Home Crumb */}
      {showHome && (
        <motion.button
          className="crumb-home"
          onClick={() => navigate('/')}
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.04 }}
          aria-label="Go to Home"
          title="Home"
          style={{
            border: 'none',
            background: 'transparent',
            color: items.length === 0 ? (dark ? '#ffffff' : 'var(--green-dark)') : dark ? 'rgba(255,255,255,0.85)' : 'var(--ink-soft)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 6px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: items.length === 0 ? 800 : 700,
            flexShrink: 0,
          }}
        >
          <Home size={15} strokeWidth={2.4} color={dark ? '#ffffff' : 'var(--green-dark)'} />
          <span className="crumb-home-label">{homeLabel}</span>
        </motion.button>
      )}

      {/* Subsequent Crumb Items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            <ChevronRight
              className="crumb-chev"
              size={13}
              strokeWidth={2.5}
              style={{
                opacity: dark ? 0.6 : 0.45,
                color: dark ? '#ffffff' : 'var(--ink-soft)',
                flexShrink: 0,
              }}
            />

            {item.to && !isLast ? (
              <motion.button
                className="crumb-mid"
                onClick={() => navigate(item.to!)}
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.04 }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: dark ? 'rgba(255,255,255,0.85)' : 'var(--ink-soft)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 6px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {Icon && <Icon size={14} />}
                <span>{item.label}</span>
              </motion.button>
            ) : (
              <span
                style={{
                  color: isLast ? (dark ? '#ffffff' : 'var(--green-dark)') : dark ? 'rgba(255,255,255,0.85)' : 'var(--ink)',
                  fontWeight: isLast ? 800 : 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 6px',
                  flexShrink: 0,
                }}
              >
                {Icon && <Icon size={14} />}
                <span>{item.label}</span>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
