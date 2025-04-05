'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useColorMode } from '@chakra-ui/react';

interface BlurTextProps {
  text: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  duration?: number;
  delay?: number;
  blur?: string;
  blurStart?: number;
  blurEnd?: number;
  staggerChildren?: number;
  once?: boolean;
}

// Kelime render fonksiyonu
function renderWords(words: string[], childVariants: any) {
  return words.map((word: string, wordIndex: number) => (
    <React.Fragment key={`word-${wordIndex}`}>
      {wordIndex > 0 && <span className="inline-block">&nbsp;</span>}
      <span className="inline-block">
        {Array.from(word).map((char: string, charIndex: number) => (
          <motion.span
            key={`char-${charIndex}`}
            variants={childVariants}
            className="inline-block"
          >
            {char}
          </motion.span>
        ))}
      </span>
    </React.Fragment>
  ));
}

// Ana BlurText bileşeni
export default function BlurText({
  text,
  className = '',
  tag = 'h1',
  duration = 0.5,
  delay = 0,
  blur = '0.25em',
  blurStart = 12,
  blurEnd = 0,
  staggerChildren = 0.03,
  once = true,
}: BlurTextProps) {
  // State ve hook tanımlamaları
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { colorMode } = useColorMode();

  // Split text into words and characters
  const words = text.split(' ');
  
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { 
        staggerChildren: staggerChildren, 
        delayChildren: delay * i 
      },
    }),
  };
  
  const child = {
    hidden: {
      opacity: 0,
      filter: `blur(${blur})`,
      scale: 0.9,
      color: colorMode === 'light' ? '#000000' : 'inherit',
      textShadow: colorMode === 'light' ? '0 0 2px rgba(0, 0, 0, 0.2)' : '0 0 1px rgba(255, 255, 255, 0.2)',
    },
    visible: {
      opacity: 1,
      filter: 'blur(0em)',
      scale: 1,
      color: colorMode === 'light' ? '#000000' : 'inherit',
      textShadow: colorMode === 'light' ? '0 0 1px rgba(0, 0, 0, 0.1)' : '0 0 1px rgba(255, 255, 255, 0.1)',
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
        duration: duration,
      },
    },
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setIsInView(false);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [once]);

  const content = renderWords(words, child);
  
  // Bileşenin tag prop'una göre doğru HTML elementini render et
  const renderElement = () => {
    const props = {
      ref,
      className,
      initial: "hidden",
      animate: isInView ? "visible" : "hidden",
      variants: container
    };

    switch (tag) {
      case 'h1':
        return <motion.h1 {...props}>{content}</motion.h1>;
      case 'h2':
        return <motion.h2 {...props}>{content}</motion.h2>;
      case 'h3':
        return <motion.h3 {...props}>{content}</motion.h3>;
      case 'h4':
        return <motion.h4 {...props}>{content}</motion.h4>;
      case 'h5':
        return <motion.h5 {...props}>{content}</motion.h5>;
      case 'h6':
        return <motion.h6 {...props}>{content}</motion.h6>;
      case 'p':
        return <motion.p {...props}>{content}</motion.p>;
      default:
        return <motion.span {...props}>{content}</motion.span>;
    }
  };

  return renderElement();
} 