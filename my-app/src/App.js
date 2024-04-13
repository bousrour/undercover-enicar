
import './App.css';
import LandingPage from './entre';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Jeu from './Jeu';
import 'bootstrap/dist/css/bootstrap.min.css';
function App() {
  return (
    
    <Router>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/jeu" element={<Jeu />} />
    </Routes>
  </Router>
  );
}

export default App;
