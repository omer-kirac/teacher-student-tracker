'use client';

import { useEffect, useState } from 'react';

interface ScreenSize {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

export function useResponsive(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    setScreenSize({
      isMobile: width < 768, // Mobile breakpoint
      isTablet: width >= 768 && width < 1024, // Tablet breakpoint
      isDesktop: width >= 1024, // Desktop breakpoint
      width,
      height,
    });
  }

  return screenSize;
}

// Utility for dynamic spacing based on screen size
export function responsiveSpacing(mobile: number, tablet: number, desktop: number, screenSize: ScreenSize) {
  if (screenSize.isMobile) return mobile;
  if (screenSize.isTablet) return tablet;
  return desktop;
}

// Determine if device is touch-enabled
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const touchDevice = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      navigator.msMaxTouchPoints > 0;
    
    setIsTouch(touchDevice);
  }, []);

  return isTouch;
} 