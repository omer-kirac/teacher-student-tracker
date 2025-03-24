'use client';

import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  BoxProps,
  FlexProps,
  Heading,
  Stack,
  Icon,
  StackProps,
  Center,
} from '@chakra-ui/react';
import { ReactNode } from 'react';
import { IconType } from 'react-icons';

interface CardProps extends BoxProps {
  variant?: 'default' | 'gradient' | 'elevated';
  children: ReactNode;
}

export function Card({ variant = 'default', children, ...rest }: CardProps) {
  // Color values
  const bgDefault = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const gradientBg = useColorModeValue(
    'linear-gradient(to right, #3182CE, #2C5282)',
    'linear-gradient(to right, #2D3748, #1A365D)'
  );
  
  // Styles based on variant
  const getStyles = () => {
    switch (variant) {
      case 'gradient':
        return {
          bg: gradientBg,
          color: 'white',
          boxShadow: 'lg',
          border: 'none',
        };
      case 'elevated':
        return {
          bg: bgDefault,
          boxShadow: 'lg',
          borderWidth: '1px',
          borderColor: borderColor,
        };
      default:
        return {
          bg: bgDefault,
          borderWidth: '1px',
          borderColor: borderColor,
          boxShadow: 'sm',
        };
    }
  };

  return (
    <Box
      borderRadius="xl"
      overflow="hidden"
      transition="all 0.3s ease"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
      {...getStyles()}
      {...rest}
    >
      {children}
    </Box>
  );
}

interface CardHeaderProps extends FlexProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action, children, ...rest }: CardHeaderProps) {
  return (
    <Flex
      align="center"
      justify="space-between"
      p={6}
      borderBottomWidth={children ? '1px' : '0'}
      borderColor={useColorModeValue('gray.200', 'gray.600')}
      {...rest}
    >
      {(title || subtitle) && (
        <Stack spacing={0}>
          {title && <Heading size="md">{title}</Heading>}
          {subtitle && <Text color="gray.500" fontSize="sm">{subtitle}</Text>}
        </Stack>
      )}
      {action && <Box>{action}</Box>}
      {children}
    </Flex>
  );
}

interface CardBodyProps extends StackProps {
  children: ReactNode;
}

export function CardBody({ children, ...rest }: CardBodyProps) {
  return (
    <Stack p={6} spacing={4} {...rest}>
      {children}
    </Stack>
  );
}

interface CardFooterProps extends FlexProps {
  children: ReactNode;
}

export function CardFooter({ children, ...rest }: CardFooterProps) {
  return (
    <Flex
      p={6}
      pt={0}
      justify="flex-end"
      align="center"
      borderTopWidth={1}
      borderColor={useColorModeValue('gray.200', 'gray.600')}
      {...rest}
    >
      {children}
    </Flex>
  );
}

interface StatCardProps extends BoxProps {
  title: string;
  value: string | number;
  icon?: IconType;
  iconBg?: string;
  iconColor?: string;
  change?: number;
  changeText?: string;
  isUpward?: boolean;
}

export function StatCard({
  title,
  value,
  icon,
  iconBg = 'blue.100',
  iconColor = 'blue.500',
  change,
  changeText,
  isUpward = true,
  ...rest
}: StatCardProps) {
  return (
    <Card variant="elevated" {...rest}>
      <CardBody p={6}>
        <Flex align="center" mb={4}>
          {icon && (
            <Center
              bg={iconBg}
              w="48px"
              h="48px"
              borderRadius="12px"
              color={iconColor}
            >
              <Icon as={icon} boxSize={6} />
            </Center>
          )}
          <Box ml={icon ? 4 : 0}>
            <Text fontSize="sm" color="gray.500">{title}</Text>
            <Heading size="lg">{value}</Heading>
            {(change || changeText) && (
              <Text 
                fontSize="sm" 
                color={isUpward ? 'green.500' : 'red.500'} 
                display="flex" 
                alignItems="center"
                mt={1}
              >
                {change && (
                  <Icon 
                    as={isUpward ? UpIcon : DownIcon} 
                    boxSize={3} 
                    mr={1} 
                  />
                )}
                {change && `${change}%`} {changeText && changeText}
              </Text>
            )}
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );
}

// Simple up/down arrow icons
const UpIcon = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    width="1em" 
    height="1em" 
    {...props}
  >
    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
  </svg>
);

const DownIcon = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    width="1em" 
    height="1em" 
    {...props}
  >
    <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
  </svg>
); 