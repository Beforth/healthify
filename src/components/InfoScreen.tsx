import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Breadcrumbs from './Breadcrumbs';

export default function InfoScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="screen"
      style={{
        alignItems: 'flex-start',
        textAlign: 'left',
        padding: '20px 20px 40px',
        boxSizing: 'border-box',
      }}
    >
      <Breadcrumbs backFallback="/" items={[{ label: title }]} />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 640, margin: '56px auto 0' }}
      >
        <h1 style={{ color: 'var(--green-dark)', fontSize: '1.8rem', fontWeight: 900, marginBottom: 18 }}>
          {title}
        </h1>
        <div
          className="card"
          style={{
            textAlign: 'left',
            borderRadius: 22,
            padding: '22px 26px',
            color: 'var(--ink-soft)',
            fontSize: '0.96rem',
            lineHeight: 1.7,
          }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
