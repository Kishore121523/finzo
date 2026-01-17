'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Mode = 'finance' | 'tasks';

interface ModeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('finance');

  useEffect(() => {
    // Load mode from localStorage on mount
    const savedMode = localStorage.getItem('finzo-mode') as Mode;
    if (savedMode === 'finance' || savedMode === 'tasks') {
      setModeState(savedMode);
    }
  }, []);

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
    localStorage.setItem('finzo-mode', newMode);
  };

  const toggleMode = () => {
    const newMode = mode === 'finance' ? 'tasks' : 'finance';
    setMode(newMode);
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}
