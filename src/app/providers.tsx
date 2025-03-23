'use client';

import { ChakraProvider, extendTheme, ColorModeProvider, useColorMode, ColorModeScript } from '@chakra-ui/react';
import { CacheProvider } from '@chakra-ui/next-js';
import { useEffect, ReactNode } from 'react';
import { ThemeContext, useThemeProvider, useTheme } from '@/lib/theme';

// Theme configuration
const theme = extendTheme({
  config: {
    initialColorMode: 'system',
    useSystemColorMode: true,
  },
  colors: {
    gray: {
      50: '#F7FAFC',
      100: '#EDF2F7',
      200: '#E2E8F0',
      300: '#CBD5E0',
      400: '#A0AEC0',
      500: '#718096',
      600: '#4A5568',
      700: '#2D3748',
      800: '#1A202C',
      900: '#171923',
    },
    blue: {
      50: '#E6F6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#3B82F6',
      500: '#2563EB',
      600: '#1D4ED8',
      700: '#1E40AF',
      800: '#1E3A8A',
      900: '#1E3A8A',
    },
  },
  styles: {
    global: (props: { colorMode: string }) => ({
      'html, body': {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
      },
      // Form elemanları ve butonlar için daha tutarlı renkler
      'input, select, textarea': {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.300',
      },
      // Butonlar için varsayılan renkler
      'button.chakra-button': {
        _hover: {
          opacity: 0.9,
        },
      },
    })
  },
  // Add responsive breakpoints for better mobile support
  breakpoints: {
    sm: '320px',
    md: '768px',
    lg: '960px',
    xl: '1200px',
  },
  // Add transition speeds for animations
  transition: {
    easing: {
      ease: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
    },
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '450ms',
    },
  },
  components: {
    Button: {
      baseStyle: (props: { colorMode: string }) => ({
        borderRadius: 'md',
        _focus: {
          boxShadow: 'outline',
        },
      }),
      variants: {
        solid: (props: { colorMode: string }) => ({
          bg: props.colorMode === 'dark' ? 'blue.500' : 'blue.400',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'blue.600' : 'blue.500',
          },
        }),
        outline: (props: { colorMode: string }) => ({
          borderColor: props.colorMode === 'dark' ? 'blue.500' : 'blue.400',
          color: props.colorMode === 'dark' ? 'blue.300' : 'blue.500',
          _hover: {
            bg: props.colorMode === 'dark' ? 'rgba(66, 153, 225, 0.12)' : 'rgba(66, 153, 225, 0.08)',
          },
        }),
        ghost: (props: { colorMode: string }) => ({
          color: props.colorMode === 'dark' ? 'gray.300' : 'gray.600',
          _hover: {
            bg: props.colorMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          },
        }),
      },
    },
    Card: {
      baseStyle: (props: { colorMode: string }) => ({
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        borderRadius: 'lg',
        boxShadow: props.colorMode === 'dark' ? 'lg' : 'base',
        borderWidth: '1px',
        borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
      }),
    },
  },
});

// Theme Synchronizer Component (Client Component)
function ThemeSynchronizer() {
  const { theme } = useTheme();
  const { colorMode, setColorMode } = useColorMode();
  const pathName = typeof window !== 'undefined' ? window.location.pathname : '';
  const isLoginPage = pathName === '/login' || pathName === '/register';

  useEffect(() => {
    // Login sayfasında tema kontrolü
    if (isLoginPage) {
      // Login sayfasında her zaman light tema kullan
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      document.body.classList.remove('dark-mode');
      document.body.style.backgroundColor = '#ffffff';
      setColorMode('light');
      return;
    }
    
    // Diğer sayfalar için normal tema mantığı
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Tema değişikliğini Chakra UI'e bildir
    setColorMode(theme);
  }, [theme, setColorMode, isLoginPage]);

  // Chakra UI tema değişikliğini custom tema state'imize bildir
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoginPage) {
      if (colorMode === 'dark' && !document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.add('dark');
      } else if (colorMode === 'light' && document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [colorMode, isLoginPage]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const themeProviderProps = useThemeProvider();

  return (
    <CacheProvider>
      <ThemeContext.Provider value={themeProviderProps}>
        {/* Tema ayarını sayfanın client tarafında başlat */}
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <ChakraProvider theme={theme} resetCSS={true}>
          <ColorModeProvider options={{ initialColorMode: themeProviderProps.theme }}>
            <ThemeSynchronizer />
            {children}
          </ColorModeProvider>
        </ChakraProvider>
      </ThemeContext.Provider>
    </CacheProvider>
  );
} 