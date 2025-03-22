'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Heading, Text, Spinner, Flex } from '@chakra-ui/react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    };

    checkUser();
  }, [router]);

  return (
    <Flex direction="column" align="center" justify="center" minH="100vh" p={4}>
      <Heading mb={4}>Öğretmen-Öğrenci Takip Sistemi</Heading>
      <Text mb={4}>Yönlendiriliyorsunuz...</Text>
      <Spinner size="xl" />
    </Flex>
  );
}
