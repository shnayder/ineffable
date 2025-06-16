import React from 'react';

const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Add global providers here (e.g., Zustand, Theme, etc.)
  return <>{children}</>;
};

export default Provider;
