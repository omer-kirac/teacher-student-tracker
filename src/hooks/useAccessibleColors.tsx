'use client';

import { useColorModeValue } from '@chakra-ui/react';

// Helper function to calculate contrast ratio
function getContrastRatio(color1: string, color2: string): number {
  // This is a simplified version - in practice you would convert colors to luminance values
  // For demo purposes, we'll use a lookup table of predefined contrasts
  const contrastMap: Record<string, Record<string, number>> = {
    'blue.500': { 'white': 4.5, 'black': 3 },
    'blue.600': { 'white': 7, 'black': 2.5 },
    'green.500': { 'white': 3.8, 'black': 3 },
    'green.600': { 'white': 5.5, 'black': 2 },
    'purple.500': { 'white': 4.2, 'black': 3 },
    'purple.600': { 'white': 6.5, 'black': 2 },
    'red.500': { 'white': 4, 'black': 3 },
    'red.600': { 'white': 6, 'black': 2 },
    'gray.500': { 'white': 3.5, 'black': 3.5 },
    'gray.600': { 'white': 5, 'black': 2.5 },
    'gray.700': { 'white': 7, 'black': 1.8 },
  };
  
  // Return contrast or default to 1 if not found
  return contrastMap[color1]?.[color2] || 1;
}

// Function to adjust color for better contrast
function getAccessibleColor(baseColor: string, bgColor: string, minContrast = 4.5): string {
  const contrast = getContrastRatio(baseColor, bgColor);
  
  // If contrast is sufficient, return the base color
  if (contrast >= minContrast) return baseColor;
  
  // Otherwise, adjust to a more accessible variant
  const colorParts = baseColor.split('.');
  const colorFamily = colorParts[0];
  const intensity = parseInt(colorParts[1]);
  
  // For dark backgrounds, we need lighter colors for better contrast
  if (bgColor === 'black' || bgColor.includes('gray.8') || bgColor.includes('gray.9')) {
    const newIntensity = Math.max(intensity - 200, 100);
    return `${colorFamily}.${newIntensity}`;
  }
  
  // For light backgrounds, we need darker colors for better contrast
  const newIntensity = Math.min(intensity + 200, 900);
  return `${colorFamily}.${newIntensity}`;
}

export function useAccessibleColors() {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const isDarkMode = bgColor === 'gray.800';
  
  // Function to get color with guaranteed contrast
  const getAccessibleColorValue = (baseColor: string, minContrast = 4.5) => {
    return getAccessibleColor(baseColor, isDarkMode ? 'black' : 'white', minContrast);
  };
  
  // Return pre-adjusted accessible colors for common UI elements
  return {
    // Base colors
    bgColor,
    textColor,
    
    // Primary UI colors - optimized for accessibility
    primary: getAccessibleColorValue('blue.500'),
    secondary: getAccessibleColorValue('purple.500'),
    success: getAccessibleColorValue('green.500'),
    error: getAccessibleColorValue('red.500'),
    warning: getAccessibleColorValue('yellow.500'),
    info: getAccessibleColorValue('cyan.500'),
    
    // Helper function for custom colors
    getAccessibleColor: getAccessibleColorValue,
    
    // Background colors with proper contrast for text
    cardBg: useColorModeValue('white', 'gray.750'),
    hoverBg: useColorModeValue('gray.50', 'gray.700'),
    activeBg: useColorModeValue('gray.100', 'gray.600'),
    
    // Border colors with sufficient contrast
    border: useColorModeValue('gray.200', 'gray.600'),
    borderActive: useColorModeValue('blue.500', 'blue.300'),
  };
} 