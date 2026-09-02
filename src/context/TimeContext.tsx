"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const TimeContext = createContext<number | null>(null);

export function TimeProvider({ children }: { children: React.ReactNode }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TimeContext.Provider value={now}>
      {children}
    </TimeContext.Provider>
  );
}

export function useNow() {
  return useContext(TimeContext);
}
