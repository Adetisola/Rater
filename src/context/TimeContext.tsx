"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const TimeContext = createContext<number>(Date.now());

export function TimeProvider({ children }: { children: React.ReactNode }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
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
