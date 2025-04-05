'use client';

import React from 'react';
import { Box } from '@chakra-ui/react';

// SVG animasyonu için stil tanımları
const loaderStyles = {
  pl: {
    width: '6em',
    height: '6em',
  },
  '@keyframes ringA': {
    '0%, 4%': {
      strokeDasharray: '0 660',
      strokeWidth: '20',
      strokeDashoffset: '-330',
    },
    '12%': {
      strokeDasharray: '60 600',
      strokeWidth: '30',
      strokeDashoffset: '-335',
    },
    '32%': {
      strokeDasharray: '60 600',
      strokeWidth: '30',
      strokeDashoffset: '-595',
    },
    '40%, 54%': {
      strokeDasharray: '0 660',
      strokeWidth: '20',
      strokeDashoffset: '-660',
    },
    '62%': {
      strokeDasharray: '60 600',
      strokeWidth: '30',
      strokeDashoffset: '-665',
    },
    '82%': {
      strokeDasharray: '60 600',
      strokeWidth: '30',
      strokeDashoffset: '-925',
    },
    '90%, 100%': {
      strokeDasharray: '0 660',
      strokeWidth: '20',
      strokeDashoffset: '-990',
    },
  },
  '@keyframes ringB': {
    '0%, 12%': {
      strokeDasharray: '0 220',
      strokeWidth: '20',
      strokeDashoffset: '-110',
    },
    '20%': {
      strokeDasharray: '20 200',
      strokeWidth: '30',
      strokeDashoffset: '-115',
    },
    '40%': {
      strokeDasharray: '20 200',
      strokeWidth: '30',
      strokeDashoffset: '-195',
    },
    '48%, 62%': {
      strokeDasharray: '0 220',
      strokeWidth: '20',
      strokeDashoffset: '-220',
    },
    '70%': {
      strokeDasharray: '20 200',
      strokeWidth: '30',
      strokeDashoffset: '-225',
    },
    '90%': {
      strokeDasharray: '20 200',
      strokeWidth: '30',
      strokeDashoffset: '-305',
    },
    '98%, 100%': {
      strokeDasharray: '0 220',
      strokeWidth: '20',
      strokeDashoffset: '-330',
    },
  },
  '@keyframes ringC': {
    '0%': {
      strokeDasharray: '0 440',
      strokeWidth: '20',
      strokeDashoffset: '0',
    },
    '8%': {
      strokeDasharray: '40 400',
      strokeWidth: '30',
      strokeDashoffset: '-5',
    },
    '28%': {
      strokeDasharray: '40 400',
      strokeWidth: '30',
      strokeDashoffset: '-175',
    },
    '36%, 58%': {
      strokeDasharray: '0 440',
      strokeWidth: '20',
      strokeDashoffset: '-220',
    },
    '66%': {
      strokeDasharray: '40 400',
      strokeWidth: '30',
      strokeDashoffset: '-225',
    },
    '86%': {
      strokeDasharray: '40 400',
      strokeWidth: '30',
      strokeDashoffset: '-395',
    },
    '94%, 100%': {
      strokeDasharray: '0 440',
      strokeWidth: '20',
      strokeDashoffset: '-440',
    },
  },
  '@keyframes ringD': {
    '0%, 8%': {
      strokeDasharray: '0 440',
      strokeWidth: '20',
      strokeDashoffset: '0',
    },
    '16%': {
      strokeDasharray: '40 400',
      strokeWidth: '30',
      strokeDashoffset: '-5',
    },
    '36%': {
      strokeDasharray: '40 400',
      strokeWidth: '30',
      strokeDashoffset: '-175',
    },
    '44%, 50%': {
      strokeDasharray: '0 440',
      strokeWidth: '20',
      strokeDashoffset: '-220',
    },
    '58%': {
      strokeDasharray: '40 400',
      strokeWidth: '30',
      strokeDashoffset: '-225',
    },
    '78%': {
      strokeDasharray: '40 400',
      strokeWidth: '30',
      strokeDashoffset: '-395',
    },
    '86%, 100%': {
      strokeDasharray: '0 440',
      strokeWidth: '20',
      strokeDashoffset: '-440',
    },
  },
};

const CustomLoader = () => {
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      width="100%" 
      height="100%"
      className="custom-loader-container"
      sx={{
        '.custom-loader': {
          width: '6em',
          height: '6em',
        },
        '.ring': {
          animation: 'ringA 2s linear infinite',
        },
        '.ring-a': {
          stroke: '#f42f25',
        },
        '.ring-b': {
          animation: 'ringB 2s linear infinite',
          stroke: '#f49725',
        },
        '.ring-c': {
          animation: 'ringC 2s linear infinite',
          stroke: '#255ff4',
        },
        '.ring-d': {
          animation: 'ringD 2s linear infinite',
          stroke: '#f42582',
        },
        '@keyframes ringA': loaderStyles['@keyframes ringA'],
        '@keyframes ringB': loaderStyles['@keyframes ringB'],
        '@keyframes ringC': loaderStyles['@keyframes ringC'],
        '@keyframes ringD': loaderStyles['@keyframes ringD'],
      }}
    >
      <svg className="custom-loader" width="240" height="240" viewBox="0 0 240 240">
        <circle className="ring ring-a" cx="120" cy="120" r="105" fill="none" stroke="#f42f25" strokeWidth="20" strokeDasharray="0 660" strokeDashoffset="-330" strokeLinecap="round"></circle>
        <circle className="ring ring-b" cx="120" cy="120" r="35" fill="none" stroke="#f49725" strokeWidth="20" strokeDasharray="0 220" strokeDashoffset="-110" strokeLinecap="round"></circle>
        <circle className="ring ring-c" cx="85" cy="120" r="70" fill="none" stroke="#255ff4" strokeWidth="20" strokeDasharray="0 440" strokeLinecap="round"></circle>
        <circle className="ring ring-d" cx="155" cy="120" r="70" fill="none" stroke="#f42582" strokeWidth="20" strokeDasharray="0 440" strokeLinecap="round"></circle>
      </svg>
    </Box>
  );
};

export default CustomLoader; 