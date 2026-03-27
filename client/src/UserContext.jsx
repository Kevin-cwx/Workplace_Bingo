import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bingoUser');
    if (saved) return JSON.parse(saved);
    return {
      name: '',
      emoji: '👽',
      color: '#8b5cf6'
    };
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('wb_theme') || 'dark');
  const [stats, setStats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wb_stats') || '{"won":0,"played":0,"autoSend":false}');
    } catch(e) {
      return { won: 0, played: 0, autoSend: false };
    }
  });

  const [pastPlayers, setPastPlayers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wb_past_players') || '[]');
    } catch(e) {
      return [];
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wb_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('wb_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('wb_past_players', JSON.stringify(pastPlayers));
  }, [pastPlayers]);

  useEffect(() => {
    localStorage.setItem('bingoUser', JSON.stringify(user));
  }, [user]);

  return (
    <UserContext.Provider value={{ 
      user, setUser, 
      theme, setTheme, 
      stats, setStats, 
      pastPlayers, setPastPlayers 
    }}>
      {children}
    </UserContext.Provider>
  );
};
