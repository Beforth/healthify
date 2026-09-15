import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import Splash from './screens/Splash';
import CoreIdea from './screens/CoreIdea';
import Tutorial from './screens/Tutorial';
import FoodSelect from './screens/FoodSelect';
import GameScreen from './screens/GameScreen';

// Keyed on foodId so navigating directly between two /play/:foodId routes (e.g. via
// browser back/forward) fully remounts GameScreen instead of reusing stale local state.
function GameRoute() {
  const { foodId } = useParams<{ foodId: string }>();
  return <GameScreen key={foodId} />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/learn" element={<CoreIdea />} />
      <Route path="/tutorial" element={<Tutorial />} />
      <Route path="/foods" element={<FoodSelect />} />
      <Route path="/play/:foodId" element={<GameRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
