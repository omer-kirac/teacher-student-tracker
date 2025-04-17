import React, { forwardRef } from 'react';
import { Box, Text, BoxProps, useColorMode, Spinner } from '@chakra-ui/react';

export interface CustomButtonProps {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  leftIcon?: React.ReactElement;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md';
  buttonColor?: string;
  buttonColorOutline?: string;
  _loading?: boolean;
  isDisabled?: boolean;
}

const CustomButton = forwardRef<HTMLDivElement, CustomButtonProps & Omit<BoxProps, '_loading'>>((
  { 
    children, 
    onClick, 
    leftIcon, 
    variant = 'default',
    size = 'md',
    buttonColor,
    buttonColorOutline,
    _loading = false,
    isDisabled = false,
    ...rest
  }, 
  ref
) => {
  // Hook'u her zaman aynı sırada çağırmamız gerekiyor
  const { colorMode } = useColorMode();

  // Sabit renkler tanımlayalım
  const shadowColor = "hsl(0deg 0% 0% / 0.25)";
  
  // Kırmızı tonları (default)
  const edgeColorDefault = "linear-gradient(to left, hsl(340deg 100% 16%) 0%, hsl(340deg 100% 32%) 8%, hsl(340deg 100% 32%) 92%, hsl(340deg 100% 16%) 100%)";
  // Koşullu ifadelerden kaçınıp sabit renkler kullanalım
  const frontColorDefault = buttonColor || "#e50041";
  
  // Mavi tonları (outline)
  const edgeColorOutline = "linear-gradient(to left, hsl(220deg 100% 16%) 0%, hsl(220deg 100% 32%) 8%, hsl(220deg 100% 32%) 92%, hsl(220deg 100% 16%) 100%)";
  const frontColorOutline = buttonColorOutline || "#1a52cb";
  
  const textColor = "white";
  
  const disabledStyle = isDisabled ? {
    opacity: 0.6,
    cursor: 'not-allowed',
    filter: 'grayscale(40%)'
  } : {};

  return (
    <Box 
      ref={ref}
      as="button" 
      position="relative" 
      border="none" 
      bg="transparent" 
      p="0" 
      cursor={isDisabled ? "not-allowed" : "pointer"} 
      outlineOffset="4px" 
      transition="filter 250ms" 
      userSelect="none" 
      onClick={isDisabled ? undefined : onClick}
      {...rest}
      sx={{
        ...(isDisabled ? {} : {
          '&:hover': {
            filter: 'brightness(110%)',
          },
          '&:hover .front': {
            transform: 'translateY(-6px)',
            transition: 'transform 250ms cubic-bezier(.3, .7, .4, 1.5)',
          },
          '&:active .front': {
            transform: 'translateY(-2px)',
            transition: 'transform 34ms',
          },
          '&:hover .shadow': {
            transform: 'translateY(4px)',
            transition: 'transform 250ms cubic-bezier(.3, .7, .4, 1.5)',
          },
          '&:active .shadow': {
            transform: 'translateY(1px)',
            transition: 'transform 34ms',
          },
        }),
        '&:focus:not(:focus-visible)': {
          outline: 'none',
        },
        ...(rest.sx || {}),
        ...disabledStyle
      }}
    >
      <Box 
        className="shadow" 
        position="absolute" 
        top="0" 
        left="0" 
        width="100%" 
        height="100%" 
        borderRadius="12px" 
        bg={shadowColor}
        willChange="transform" 
        transform="translateY(2px)" 
        transition="transform 600ms cubic-bezier(.3, .7, .4, 1)" 
        opacity={isDisabled ? 0.6 : 1}
      />
      <Box 
        className="edge" 
        position="absolute" 
        top="0" 
        left="0" 
        width="100%" 
        height="100%" 
        borderRadius="12px" 
        bg={variant === 'outline' ? edgeColorOutline : edgeColorDefault} 
        opacity={isDisabled ? 0.6 : 1}
      />
      <Box 
        className="front" 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        position="relative" 
        py={size === 'sm' ? "8px" : "12px"} 
        px={size === 'sm' ? "16px" : "27px"} 
        borderRadius="12px" 
        fontSize={size === 'sm' ? "0.9rem" : "1.1rem"} 
        color={textColor}
        bg={variant === 'outline' ? frontColorOutline : frontColorDefault}
        willChange="transform" 
        transform={isDisabled ? "translateY(-2px)" : "translateY(-4px)"} 
        transition="transform 600ms cubic-bezier(.3, .7, .4, 1)"
        opacity={isDisabled ? 0.8 : 1}
        _dark={{
          bg: variant === 'outline' ? frontColorOutline : frontColorDefault,
          color: textColor
        }}
        sx={{
          // Tema değişiminden etkilenmemesi için renkleri zorla
          '&, &:hover, &:active': {
            backgroundColor: `${variant === 'outline' ? frontColorOutline : frontColorDefault} !important`,
            color: `${textColor} !important`
          }
        }}
      >
        {_loading ? (
          <Spinner size="sm" color={textColor} mr={children ? 2 : 0} />
        ) : leftIcon ? (
          <Box mr="2" sx={{ 
            svg: { 
              color: `${textColor} !important`,
              fill: `${textColor} !important`
            } 
          }}>
            {leftIcon}
          </Box>
        ) : null}
        <Text className="text" sx={{ color: `${textColor} !important` }}>{children}</Text>
      </Box>
    </Box>
  );
});

CustomButton.displayName = 'CustomButton';

export default CustomButton; 