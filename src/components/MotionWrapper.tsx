'use client';

import { ReactNode } from 'react';
import { motion, MotionProps, Variant, Variants } from 'framer-motion';
import { Box, BoxProps } from '@chakra-ui/react';

// Create a motion box component
export const MotionBox = motion(Box);

// Animation variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -50 },
  visible: { opacity: 1, y: 0 },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 },
};

export const scale: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

interface MotionWrapperProps extends BoxProps, MotionProps {
  children: ReactNode;
  variant?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale';
  delay?: number;
  duration?: number;
  once?: boolean;
  customVariants?: Variants;
}

export function MotionWrapper({
  children,
  variant = 'fadeIn',
  delay = 0,
  duration = 0.5,
  once = true,
  customVariants,
  ...rest
}: MotionWrapperProps) {
  // Select the animation variant
  let animationVariant: Variants;
  switch (variant) {
    case 'slideUp':
      animationVariant = slideUp;
      break;
    case 'slideDown':
      animationVariant = slideDown;
      break;
    case 'slideLeft':
      animationVariant = slideLeft;
      break;
    case 'slideRight':
      animationVariant = slideRight;
      break;
    case 'scale':
      animationVariant = scale;
      break;
    case 'fadeIn':
    default:
      animationVariant = fadeIn;
  }

  // Use custom variants if provided
  const variants = customVariants || animationVariant;

  return (
    <MotionBox
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      variants={variants}
      transition={{ duration, delay, ease: 'easeOut' }}
      {...rest}
    >
      {children}
    </MotionBox>
  );
}

// Hover animations
export const hoverScale = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
};

export const hoverElevate = {
  whileHover: { y: -5, boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)' },
  transition: { duration: 0.2 },
};

// Staggered children animation
export function createStaggeredAnimation(
  childrenVariant: Variants = fadeIn,
  staggerDuration: number = 0.1
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDuration,
      },
    },
    children: childrenVariant,
  };
} 