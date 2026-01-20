'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Mode = 'finance' | 'tasks' | 'insights';

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
    if (savedMode === 'finance' || savedMode === 'tasks' || savedMode === 'insights') {
      setModeState(savedMode);
    }
  }, []);

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
    localStorage.setItem('finzo-mode', newMode);
  };

  const toggleMode = () => {
    // Cycle through modes: finance -> tasks -> insights -> finance
    const modes: Mode[] = ['finance', 'tasks', 'insights'];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
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
