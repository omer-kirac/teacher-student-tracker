'use client';

import { Box, Flex, VStack, HStack, SimpleGrid, Container, type BoxProps } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

// Create motion components for Chakra UI
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionVStack = motion(VStack);
const MotionHStack = motion(HStack);
const MotionSimpleGrid = motion(SimpleGrid);
const MotionContainer = motion(Container);

// Box props extended with animation properties
interface AnimatedBoxProps extends BoxProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  animate?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scale' | 'bounce';
  exit?: 'fadeOut' | 'slideDown' | 'slideRight' | 'slideLeft' | 'scale';
  isVisible?: boolean;
  layoutId?: string;
  whileHover?: 'lift' | 'scale' | 'highlight' | 'border' | 'none';
  whileTap?: 'scale' | 'none';
  as?: 'box' | 'flex' | 'vstack' | 'hstack' | 'grid' | 'container';
}

export default function AnimatedBox({
  children,
  delay = 0,
  duration = 0.5,
  animate = 'fadeIn',
  exit = 'fadeOut',
  isVisible = true,
  layoutId,
  whileHover = 'none',
  whileTap = 'none',
  as = 'box',
  ...props
}: AnimatedBoxProps) {
  // Define animation variants
  const animationVariants = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration, delay, ease: 'easeOut' }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration, delay, ease: 'easeOut' }
    },
    slideLeft: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration, delay, ease: 'easeOut' }
    },
    slideRight: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration, delay, ease: 'easeOut' }
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration, delay, ease: 'easeOut' }
    },
    bounce: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      transition: { 
        duration, 
        delay, 
        type: 'spring', 
        stiffness: 300, 
        damping: 15 
      }
    },
  };

  const exitVariants = {
    fadeOut: {
      opacity: 0,
      transition: { duration: duration / 2 }
    },
    slideDown: {
      opacity: 0, y: 20,
      transition: { duration: duration / 2 }
    },
    slideRight: {
      opacity: 0, x: 20,
      transition: { duration: duration / 2 }
    },
    slideLeft: {
      opacity: 0, x: -20,
      transition: { duration: duration / 2 }
    },
    scale: {
      opacity: 0, scale: 0.9,
      transition: { duration: duration / 2 }
    }
  };

  const hoverVariants = {
    lift: { y: -5, boxShadow: '0 5px 10px rgba(0,0,0,0.1)' },
    scale: { scale: 1.05 },
    highlight: { backgroundColor: 'rgba(66, 153, 225, 0.08)' },
    border: { borderColor: 'blue.500' },
    none: {}
  };
  
  const tapVariants = {
    scale: { scale: 0.95 },
    none: {}
  };

  const selectedVariant = animationVariants[animate];
  const selectedExitVariant = exitVariants[exit];
  const selectedHoverVariant = hoverVariants[whileHover];
  const selectedTapVariant = tapVariants[whileTap];

  // Choose the correct motion component based on the 'as' prop
  const Component = 
    as === 'flex' ? MotionFlex :
    as === 'vstack' ? MotionVStack :
    as === 'hstack' ? MotionHStack :
    as === 'grid' ? MotionSimpleGrid :
    as === 'container' ? MotionContainer :
    MotionBox;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <Component
          {...props}
          initial={selectedVariant.initial}
          animate={selectedVariant.animate}
          exit={selectedExitVariant}
          transition={selectedVariant.transition}
          layoutId={layoutId}
          whileHover={selectedHoverVariant}
          whileTap={selectedTapVariant}
        >
          {children}
        </Component>
      )}
    </AnimatePresence>
  );
} 