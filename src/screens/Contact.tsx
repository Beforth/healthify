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
        href="mailto:thehealthify1423@gmail.com"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 700,
          color: 'var(--green-dark)',
          textDecoration: 'none',
        }}
      >
        <Mail size={18} /> thehealthify1423@gmail.com
      </a>
    </InfoScreen>
  );
}
