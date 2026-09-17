import { Mail } from 'lucide-react';
import InfoScreen from '../components/InfoScreen';

export default function Contact() {
  return (
    <InfoScreen title="Contact Us">
      <p style={{ margin: '0 0 16px' }}>
        Got a question, found a bug, or have an idea for a food we should add? We'd love to hear
        from you.
      </p>
      <a
        href="mailto:hello@healthify.app"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 700,
          color: 'var(--green-dark)',
          textDecoration: 'none',
        }}
      >
        <Mail size={18} /> hello@healthify.app
      </a>
    </InfoScreen>
  );
}
