'use client';

import React from 'react';
import { SolanaWalletProvider } from './wallet-provider';
import { ThemeProvider } from './theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <SolanaWalletProvider>
        {children}
      </SolanaWalletProvider>
    </ThemeProvider>
  );
}
