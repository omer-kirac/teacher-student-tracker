'use client';

import { Box, Center, Heading, Text, VStack, Image, Container } from '@chakra-ui/react';
import { useEffect } from 'react';

export default function AllClassesPage() {
  // Add page title
  useEffect(() => {
    document.title = 'Tüm Sınıflarım | Öğretmen-Öğrenci Takip Sistemi';
  }, []);

  return (
    <Container maxW="container.xl" py={8}>
      <Center h="70vh">
        <VStack spacing={8} textAlign="center">
          <Image 
            src="/images/DeWatermark.ai_1742816229107.png" 
            alt="Çalışma Görseli" 
            maxW={{ base: "300px", md: "400px" }}
            borderRadius="xl"
            shadow="xl"
          />
          <Box>
            <Heading size="lg" mb={4} color="blue.600">
              Biraz daha sabır!
            </Heading>
            <Text fontSize={{ base: "lg", md: "xl" }} color="gray.600" maxW="600px" lineHeight="1.6">
              Bu sayfa henüz tamamlanmadı ama üzerinde çalışıyoruz. 
              Yakında burada harika şeyler olacak!
            </Text>
          </Box>
        </VStack>
      </Center>
    </Container>
  );
} 