'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  Text,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Button,
  Flex,
  Spinner,
  VStack,
  Icon,
  useColorModeValue,
  useToast,
  Badge,
} from '@chakra-ui/react';
import { FaBook, FaUserGraduate, FaClipboardCheck } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { Student, Class } from '@/types';
import CustomLoader from '@/components/CustomLoader';

export default function StudentDashboard() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const router = useRouter();
  const toast = useToast();

  // Renk ayarları
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardHoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Kullanıcının giriş yapmış olup olmadığını kontrol et
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          router.push('/login');
          return;
        }

        // Kullanıcının ID'sini al
        const userId = sessionData.session.user.id;

        // Kullanıcının öğrenci olup olmadığını kontrol et
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', userId)
          .single();

        if (studentError || !studentData) {
          // Öğrenci değilse ana sayfaya yönlendir
          router.push('/login');
          return;
        }

        setStudentData(studentData);

        // Öğrencinin kayıtlı olduğu bir sınıf var mı kontrol et
        if (studentData.class_id) {
          // Öğrencinin kayıtlı olduğu sınıfları getir
          const { data: classesData, error: classesError } = await supabase
            .from('classes')
            .select(`
              id, 
              name,
              teacher_id,
              created_at,
              teachers:teacher_id (
                id,
                full_name,
                email
              )
            `)
            .eq('id', studentData.class_id);

          if (classesError) throw classesError;
          
          // Veriyi Class[] tipine uyarla
          setClasses(classesData as unknown as Class[]);
        } else {
          // Eğer öğrencinin kayıtlı olduğu sınıf yoksa boş dizi ata
          setClasses([]);
        }
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        toast({
          title: 'Veri yükleme hatası',
          description: 'Sınıflarınız yüklenirken bir hata oluştu.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [router, toast]);

  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="80vh">
        <CustomLoader />
      </Flex>
    );
  }

  return (
    <Box px={5} py={5} maxW="1200px" mx="auto">
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        mb={8}
      >
        <Box>
          <Heading size="lg" mb={1}>
            Merhaba, {studentData?.name || 'Öğrenci'}
          </Heading>
          <Text color="gray.600">
            Öğrenci Paneline Hoş Geldiniz
          </Text>
        </Box>
        <Flex gap={2} mt={{ base: 4, md: 0 }}>
          <Button
            leftIcon={<FaClipboardCheck />}
            colorScheme="teal"
            onClick={() => router.push('/students/assignments')}
          >
            Ödevlerim
          </Button>
        </Flex>
      </Flex>

      {classes.length > 0 ? (
        <>
          <Heading size="md" mb={4} display="flex" alignItems="center">
            <Icon as={FaBook} mr={2} /> Sınıflarım
          </Heading>
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
            gap={6}
            mb={10}
          >
            {classes.map((classItem) => (
              <Card
                key={classItem.id}
                bg={cardBg}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                overflow="hidden"
                boxShadow="sm"
                transition="all 0.3s"
                _hover={{ transform: 'translateY(-5px)', boxShadow: 'md', bg: cardHoverBg }}
                cursor="pointer"
                onClick={() => router.push(`/students/class/${classItem.id}`)}
              >
                <CardHeader pb={0}>
                  <Flex justify="space-between" align="start">
                    <Heading size="md" color={textColor}>
                      {classItem.name}
                    </Heading>
                    <Badge colorScheme="green" variant="solid" borderRadius="full" px={2}>
                      Aktif
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardBody>
                  <VStack align="start" spacing={2}>
                    <Flex align="center">
                      <Icon as={FaUserGraduate} mr={2} color="blue.500" />
                      <Text fontSize="sm">
                        Öğretmen: {classItem.teachers?.full_name || 'Bilinmiyor'}
                      </Text>
                    </Flex>
                    <Flex 
                      align="center"
                      as={Button}
                      variant="ghost"
                      size="sm"
                      justifyContent="flex-start"
                      px={0}
                      _hover={{ color: "teal.500" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push('/students/assignments');
                      }}
                    >
                      <Icon as={FaClipboardCheck} mr={2} color="green.500" />
                      <Text fontSize="sm">Ödevleri Görüntüle</Text>
                    </Flex>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </>
      ) : (
        <Box
          p={10}
          textAlign="center"
          borderWidth="1px"
          borderRadius="lg"
          borderColor={borderColor}
          bg={cardBg}
        >
          <Icon as={FaBook} boxSize={12} color="gray.400" mb={4} />
          <Heading size="md" mb={2}>Henüz bir sınıfa kayıtlı değilsiniz</Heading>
          <Text mb={5} color="gray.500">
            Öğretmenlerinizden sınıf davet bağlantısı isteyin
          </Text>
        </Box>
      )}
    </Box>
  );
} 