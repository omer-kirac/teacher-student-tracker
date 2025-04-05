'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Heading, Text, Flex, useColorModeValue } from '@chakra-ui/react';
import { supabase } from '@/lib/supabase';
import CustomLoader from '@/components/CustomLoader';
import { useResponsive } from '@/lib/useResponsive';
import { useTheme } from '@/lib/theme';
import { motion } from 'framer-motion';
import BlurText from '@/components/BlurText';

// Gerekli motion bileşeni
const MotionBox = motion(Box);

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { isMobile } = useResponsive();
  const { theme } = useTheme();
  
  // Tema değişkenleri
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const primaryColor = useColorModeValue('blue.500', 'blue.300');
  const headingColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  // Colors based on theme
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, white)',
    'linear(to-b, gray.900, gray.800)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const pageBg = useColorModeValue('gray.50', 'gray.900');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Animasyonun görünür olması için gecikmeyi 3 saniyeye ayarlıyorum
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (session) {
          // Kullanıcının öğretmen mi öğrenci mi olduğunu kontrol et
          const { data: teacherData } = await supabase
            .from('teachers')
            .select('id')
            .eq('id', session.user.id)
            .single();
          
          const { data: studentData } = await supabase
            .from('students')
            .select('id')
            .eq('id', session.user.id)
            .single();

          if (teacherData) {
            // Öğretmen ise öğretmen dashboard'una yönlendir
            router.push('/dashboard');
          } else if (studentData) {
            // Öğrenci ise öğrenci dashboard'una yönlendir
            router.push('/students/dashboard');
          } else {
            // Tip belirsiz ise genel dashboard'a yönlendir
            router.push('/dashboard');
          }
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

  if (loading) {
    return (
      <Flex 
        justifyContent="center" 
        alignItems="center" 
        height="100vh" 
        direction="column"
        bg={pageBg}
        className={theme === 'dark' ? 'dark-mode' : ''}
        data-theme={theme}
      >
        <BlurText 
          text="Öğretmen-Öğrenci Sistemine Hoşgeldiniz" 
          tag="h1"
          delay={0.2}
          className="heading-gradient"
          staggerChildren={0.04}
          blur="0.3em"
          duration={0.6}
        />
        
        <Box mt={12}>
          <CustomLoader />
        </Box>
      </Flex>
    );
  }

  // Yükleme durumu geçince doğrudan yönlendirme yapılacak
  return null;
}
