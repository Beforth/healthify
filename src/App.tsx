import { useEffect } from 'react';
import { useSharedPlayersStore } from './store/sharedPlayersStore';
import Leaderboard from './screens/Leaderboard';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import Splash from './screens/Splash';
import CoreIdea from './screens/CoreIdea';
import Tutorial from './screens/Tutorial';
import FoodSelect from './screens/FoodSelect';
import GameScreen from './screens/GameScreen';
import About from './screens/About';
import Terms from './screens/Terms';
import Contact from './screens/Contact';
import TourOverlay from './components/TourOverlay';
import ReviewModal from './components/ReviewModal';

// Keyed on foodId so navigating directly between two /play/:foodId routes (e.g. via
// browser back/forward) fully remounts GameScreen instead of reusing stale local state.
function GameRoute() {
  const { foodId } = useParams<{ foodId: string }>();
  return <GameScreen key={foodId} />;
}

function App() {
  useEffect(() => {
    const controller = new AbortController();
    const sync = () => {
      if (document.visibilityState === 'visible') {
        void useSharedPlayersStore.getState().sync(import.meta.env.BASE_URL + 'data/players.json', controller.signal);
      }
    };
    sync();
    const timer = window.setInterval(sync, 15000);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('online', sync);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('online', sync);
    };
  }, []);
  return (
    <>
      <TourOverlay />
      <ReviewModal />
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/learn" element={<CoreIdea />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/foods" element={<FoodSelect />} />
        <Route path="/play/:foodId" element={<GameRoute />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
