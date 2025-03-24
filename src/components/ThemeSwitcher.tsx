'use client';

import { Box, IconButton, useColorMode } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import { useEffect } from 'react';

const MotionBox = motion(Box);

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const { colorMode } = useColorMode();

  // HTML data-theme özelliğini tema değişiklikleriyle senkronize et
  useEffect(() => {
    if (typeof document !== 'undefined') {
      try {
        // Document data-theme özelliği
        document.documentElement.setAttribute('data-theme', theme);
        
        // Main element'i bul ve data-theme özelliğini güncelle
        const mainElement = document.querySelector('main');
        if (mainElement) {
          mainElement.setAttribute('data-theme', theme);
          
          // Dark mode sınıfını ekle/çıkar
          if (theme === 'dark') {
            mainElement.classList.add('dark-mode');
            document.body.classList.add('dark-mode');
            document.documentElement.classList.add('dark');
          } else {
            mainElement.classList.remove('dark-mode');
            document.body.classList.remove('dark-mode');
            document.documentElement.classList.remove('dark');
          }
        }
        
        // Body arka plan rengini doğrudan ayarla (zorla)
        document.body.style.backgroundColor = theme === 'dark' ? '#111827' : '#ffffff';
        
        // Chakra UI için özel div'lerin renklerini güncelle
        const chakraElems = document.querySelectorAll('.chakra-container, .chakra-card, .chakra-stack');
        chakraElems.forEach(elem => {
          if (theme === 'dark') {
            elem.classList.add('dark-mode');
          } else {
            elem.classList.remove('dark-mode');
          }
        });
      } catch (error) {
        console.error('Theme switch error:', error);
      }
    }
  }, [theme]);

  const handleToggleTheme = () => {
    toggleTheme();
  };

  return (
    <IconButton
      aria-label={`Geçerli tema: ${theme === 'light' ? 'Açık' : 'Koyu'}, tıklayarak değiştir`}
      icon={
        <MotionBox
          animate={{ rotate: theme === 'light' ? 0 : 180 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          width="100%"
          height="100%"
        >
          {theme === 'light' ? (
            <SunIcon color="orange.400" />
          ) : (
            <MoonIcon color="blue.300" />
          )}
        </MotionBox>
      }
      onClick={handleToggleTheme}
      variant="ghost"
      rounded="full"
      size="md"
      color={colorMode === 'light' ? 'gray.700' : 'gray.200'}
      _hover={{
        bg: colorMode === 'light' ? 'gray.100' : 'gray.700',
        transform: 'scale(1.1)',
      }}
      transition="all 0.3s ease"
    />
  );
} 