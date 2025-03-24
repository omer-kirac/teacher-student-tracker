'use client';

import {
  Box,
  Flex,
  Heading,
  Text,
  useColorModeValue,
  IconButton,
  BoxProps,
} from '@chakra-ui/react';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { MotionWrapper, hoverElevate } from './MotionWrapper';

interface ResponsiveCardProps extends BoxProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onClick?: () => void;
  children?: ReactNode;
  isCompact?: boolean;
  animationDelay?: number;
}

export function ResponsiveCard({
  title,
  subtitle,
  icon,
  onClick,
  children,
  isCompact = false,
  animationDelay = 0,
  ...rest
}: ResponsiveCardProps) {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');
  const iconColor = useColorModeValue('blue.500', 'blue.300');
  const shadowColor = useColorModeValue(
    'rgba(0, 0, 0, 0.1)',
    'rgba(0, 0, 0, 0.4)'
  );

  return (
    <MotionWrapper
      variant="fadeIn"
      delay={animationDelay}
      whileHover={{
        y: -5,
        boxShadow: `0 10px 20px ${shadowColor}`,
      }}
      bg={bg}
      borderRadius="lg"
      p={isCompact ? 3 : { base: 4, md: 6 }}
      boxShadow={`0 4px 12px ${shadowColor}`}
      borderWidth="1px"
      borderColor={borderColor}
      width="100%"
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      position="relative"
      overflow="hidden"
      {...rest}
    >
      <Flex justifyContent="space-between" alignItems="flex-start" mb={isCompact ? 2 : 4}>
        <Flex alignItems="center">
          {icon && (
            <Box
              mr={3}
              color={iconColor}
              fontSize={isCompact ? 'xl' : '2xl'}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Heading
              as="h3"
              fontSize={isCompact ? 'md' : { base: 'lg', md: 'xl' }}
              fontWeight="700"
              color={textColor}
            >
              {title}
            </Heading>
            {subtitle && (
              <Text 
                color={subtitleColor}
                fontSize={isCompact ? 'xs' : 'sm'}
                mt={1}
              >
                {subtitle}
              </Text>
            )}
          </Box>
        </Flex>

        {onClick && (
          <IconButton
            as={motion.button}
            aria-label="Navigate"
            icon={<ChevronRightIcon />}
            size="sm"
            variant="ghost"
            ml={2}
            color={iconColor}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.9 }}
          />
        )}
      </Flex>

      {children && <Box color={textColor}>{children}</Box>}

      {/* Bottom gradient overlay for visual flair */}
      <Box
        position="absolute"
        bottom="0"
        left="0"
        right="0"
        height="4px"
        bg={useColorModeValue(
          'linear-gradient(to right, #3182ce, #805ad5)',
          'linear-gradient(to right, #4299e1, #9f7aea)'
        )}
        transform="translateY(0)"
        transition="transform 0.3s ease"
        _groupHover={{ transform: 'translateY(0)' }}
      />
    </MotionWrapper>
  );
}

// Grid system for responsive card layouts
interface ResponsiveCardGridProps {
  children: ReactNode;
  columns?: { base: number; sm?: number; md?: number; lg?: number; xl?: number };
  spacing?: string | number;
}

export function ResponsiveCardGrid({
  children,
  columns = { base: 1, md: 2, lg: 3 },
  spacing = 4,
}: ResponsiveCardGridProps) {
  // Calculate grid template columns based on the columns prop
  const templateColumns = Object.entries(columns).reduce(
    (acc, [breakpoint, cols]) => {
      acc[breakpoint] = `repeat(${cols}, 1fr)`;
      return acc;
    },
    {} as Record<string, string>
  );

  return (
    <Box
      display="grid"
      gridTemplateColumns={templateColumns}
      gap={spacing}
      width="100%"
    >
      {children}
    </Box>
  );
} 