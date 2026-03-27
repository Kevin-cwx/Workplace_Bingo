import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import Create from './pages/Create';
import './App.css';
import { Settings } from 'lucide-react';
import SettingsModal from './components/SettingsModal';
import { UserContext } from './UserContext';
import { useContext, useState } from 'react';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const { stats, setStats, theme, setTheme, pastPlayers } = useContext(UserContext);

  return (
    <Router>
      <div className="app-container">
        <div style={{ position: 'relative', width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <h1 className="text-logo">Workplace Bingo</h1>
          <button
            onClick={() => setShowSettings(true)}
            style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 1000 }}
          >
            <Settings size={22} className="settings-gear" />
          </button>
        </div>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/game/:gameId" element={<Game />} />
        </Routes>

        <SettingsModal
          show={showSettings}
          onClose={() => setShowSettings(false)}
          stats={stats}
          setStats={setStats}
          theme={theme}
          setTheme={setTheme}
          pastPlayers={pastPlayers}
        />
      </div>
    </Router>
  );
}

export default App;
