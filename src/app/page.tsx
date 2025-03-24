'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Heading, Text, Spinner, Flex, useColorModeValue } from '@chakra-ui/react';
import { supabase } from '@/lib/supabase';
import { MotionWrapper } from '@/components/MotionWrapper';
import { useResponsive } from '@/lib/useResponsive';
import { useTheme } from '@/lib/theme';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { isMobile } = useResponsive();
  const { theme } = useTheme();
  
  // Colors based on theme
  const bgGradient = useColorModeValue(
    'linear(to-r, blue.400, purple.500)',
    'linear(to-r, blue.600, purple.700)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const spinnerColor = useColorModeValue('blue.500', 'blue.300');
  const pageBg = useColorModeValue('gray.50', 'gray.900');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Short delay for animation to be visible
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (session) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  return (
    <Flex 
      direction="column" 
      align="center" 
      justify="center" 
      minH="calc(100vh - 60px)" // Account for navbar height
      p={isMobile ? 4 : 8}
      bg={pageBg}
      className={theme === 'dark' ? 'dark-mode' : ''}
      data-theme={theme}
    >
      <MotionWrapper
        variant="scale"
        p={isMobile ? 6 : 10}
        bg={cardBg}
        borderRadius="xl"
        boxShadow="xl"
        maxW="600px"
        width="100%"
        textAlign="center"
        borderWidth="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <MotionWrapper variant="slideDown" delay={0.2}>
          <Heading 
            mb={4} 
            bgGradient={bgGradient}
            bgClip="text"
            fontSize={isMobile ? '2xl' : '4xl'}
          >
            Öğretmen-Öğrenci Takip Sistemi
          </Heading>
        </MotionWrapper>
        
        <MotionWrapper variant="fadeIn" delay={0.4}>
          <Text 
            mb={6} 
            color={textColor}
            fontSize={isMobile ? 'md' : 'lg'}
          >
            Öğrenci gelişimini takip etmek ve başarıyı artırmak için kapsamlı platform
          </Text>
        </MotionWrapper>
        
        {loading && (
          <MotionWrapper 
            variant="fadeIn" 
            delay={0.6}
            display="flex"
            justifyContent="center"
            alignItems="center"
            flexDirection="column"
          >
            <Text mb={4} color={textColor} fontSize={isMobile ? 'sm' : 'md'}>
              Yönlendiriliyorsunuz...
            </Text>
            <Spinner 
              size={isMobile ? 'md' : 'xl'} 
              thickness="3px"
              speed="0.8s"
              color={spinnerColor}
            />
          </MotionWrapper>
        )}
      </MotionWrapper>
    </Flex>
  );
}
