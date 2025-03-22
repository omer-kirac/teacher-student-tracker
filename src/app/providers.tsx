'use client';

import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { CacheProvider } from '@chakra-ui/next-js';

// Theme configuration
const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'white',
      }
    }
  }
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
} 