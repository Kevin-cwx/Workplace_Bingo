import React from 'react';
import { Settings, Trophy, Users, Moon, Sun, X } from 'lucide-react';

export default function SettingsModal({ 
  show, 
  onClose, 
  stats, 
  setStats, 
  theme, 
  setTheme, 
  pastPlayers 
}) {
  if (!show) return null;

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const toggleAutoSend = () => {
    setStats({ ...stats, autoSend: !stats.autoSend });
  };

  return (
    <div className="dialog-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <div className="dialog-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'left', maxWidth: 800, position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'currentcolor' }}> Settings & Stats</h2>
        
        <div style={{ background: 'var(--alert-bg)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '0.5rem', color: 'currentcolor' }}><Trophy size={16}/> Career Leaderboard</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Games Played: <strong style={{color: 'var(--text-main)'}}>{stats.played}</strong></span>
            <span>Games Won: <strong style={{color: 'var(--text-main)'}}>{stats.won}</strong></span>
          </div>
        </div>

        <div style={{ background: 'var(--alert-bg)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'currentcolor' }}>Dark Mode</span>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.3rem 0.8rem' }}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'currentcolor' }}>Auto-send invites to past players</span>
            <button 
              className={`btn ${stats.autoSend ? '' : 'btn-secondary'}`} 
              style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
              onClick={toggleAutoSend}
            >
              {stats.autoSend ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div style={{ background: 'var(--alert-bg)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '12px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '0.5rem', color: 'currentcolor' }}><Users size={16}/> Past Players ({pastPlayers.length})</h3>
          <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
            {pastPlayers.length === 0 ? <p style={{color:'var(--text-muted)', fontSize: '0.85rem'}}>No past players yet.</p> : 
              pastPlayers.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '0.9rem', color: 'currentcolor' }}>
                  <span>{p.emoji}</span> <span>{p.name}</span>
                </div>
              ))
            }
          </div>
        </div>

        <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
