'use client';

import { Box, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import CustomButton from './CustomButton';

// Create motion components for Chakra UI
const MotionBox = motion(Box);

interface EmptyStateIllustrationProps {
  title: string;
  message: string;
  icon: ReactNode;
  buttonText?: string;
  onButtonClick?: () => void;
  type?: 'default' | 'class' | 'student' | 'solution';
}

export default function EmptyStateIllustration({
  title,
  message,
  icon,
  buttonText,
  onButtonClick,
  type = 'default'
}: EmptyStateIllustrationProps) {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const iconBgColor = useColorModeValue(
    type === 'class' ? 'blue.50' : 
    type === 'student' ? 'purple.50' : 
    type === 'solution' ? 'green.50' : 
    'gray.100',
    type === 'class' ? 'blue.900' : 
    type === 'student' ? 'purple.900' : 
    type === 'solution' ? 'green.900' : 
    'gray.800'
  );
  
  const iconColor = useColorModeValue(
    type === 'class' ? 'blue.500' : 
    type === 'student' ? 'purple.500' : 
    type === 'solution' ? 'green.500' : 
    'gray.500',
    type === 'class' ? 'blue.200' : 
    type === 'student' ? 'purple.200' : 
    type === 'solution' ? 'green.200' : 
    'gray.200'
  );
  
  return (
    <MotionBox
      p={8}
      textAlign="center"
      borderWidth={1}
      borderRadius="lg"
      borderColor={borderColor}
      bg={bgColor}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <VStack spacing={4}>
        <MotionBox
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="full"
          bg={iconBgColor}
          color={iconColor}
          w="70px"
          h="70px"
          fontSize="xl"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ 
            duration: 0.5,
            delay: 0.2,
            type: "spring",
            stiffness: 200
          }}
        >
          {icon}
        </MotionBox>
        
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Text fontWeight="bold" fontSize="xl" mb={1}>
            {title}
          </Text>
          <Text color="gray.500" mb={4}>
            {message}
          </Text>
        </MotionBox>
        
        {buttonText && onButtonClick && (
          <MotionBox
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CustomButton
              buttonColor="#e50041"
              onClick={onButtonClick}
              size="md"
              px={6}
            >
              {buttonText}
            </CustomButton>
          </MotionBox>
        )}
      </VStack>
    </MotionBox>
  );
} 