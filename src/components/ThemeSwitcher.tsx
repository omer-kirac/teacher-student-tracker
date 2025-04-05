'use client';

import { Box, useColorMode } from '@chakra-ui/react';
import { useTheme } from '@/lib/theme';
import { useEffect } from 'react';

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
    <Box sx={{
      '.theme-switch': {
        fontSize: '14px',
        position: 'relative',
        display: 'inline-block',
        width: '3em',
        height: '1.7em',
        borderRadius: '30px',
        boxShadow: '0 0 6px rgba(0, 0, 0, 0.1)',
      },
      '.theme-switch input': {
        opacity: 0,
        width: 0,
        height: 0,
      },
      '.slider': {
        position: 'absolute',
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#2a2a2a',
        transition: '0.4s',
        borderRadius: '30px',
        overflow: 'hidden',
      },
      '.slider:before': {
        position: 'absolute',
        content: '""',
        height: '1em',
        width: '1em',
        borderRadius: '20px',
        left: '0.35em',
        bottom: '0.35em',
        transition: '0.4s',
        transitionTimingFunction: 'cubic-bezier(0.81, -0.04, 0.38, 1.5)',
        boxShadow: 'inset 6px -3px 0px 0px #fff',
      },
      '.theme-switch input:checked + .slider': {
        backgroundColor: '#00a6ff',
      },
      '.theme-switch input:checked + .slider:before': {
        transform: 'translateX(1.3em)',
        boxShadow: 'inset 12px -3px 0px 12px #ffcf48',
      },
      '.star': {
        backgroundColor: '#fff',
        borderRadius: '50%',
        position: 'absolute',
        width: '3px',
        transition: 'all 0.4s',
        height: '3px',
      },
      '.star_1': {
        left: '2em',
        top: '0.4em',
      },
      '.star_2': {
        left: '1.7em',
        top: '0.9em',
      },
      '.star_3': {
        left: '2.3em',
        top: '0.7em',
      },
      '.theme-switch input:checked ~ .slider .star': {
        opacity: 0,
      },
      '.cloud': {
        width: '2.5em',
        position: 'absolute',
        bottom: '-1em',
        left: '-0.8em',
        opacity: 0,
        transition: 'all 0.4s',
      },
      '.theme-switch input:checked ~ .slider .cloud': {
        opacity: 1,
      }
    }}>
      <label className="theme-switch">
        <input 
          checked={theme === 'light'}
          id="theme-checkbox" 
          type="checkbox" 
          onChange={handleToggleTheme}
        />
        <span className="slider">
          <div className="star star_1"></div>
          <div className="star star_2"></div>
          <div className="star star_3"></div>
          <svg viewBox="0 0 16 16" className="cloud_1 cloud">
            <path
              transform="matrix(.77976 0 0 .78395-299.99-418.63)"
              fill="#fff"
              d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"
            ></path>
          </svg>
        </span>
      </label>
    </Box>
  );
} 