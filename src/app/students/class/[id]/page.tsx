'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Heading,
  Text,
  Grid,
  Flex,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  Avatar,
  Badge,
  Button,
  useToast,
  Icon,
  Divider,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { FaBook, FaClipboardCheck, FaUpload, FaFileAlt } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { Student, Class, StudentSolution } from '@/types';
import CustomLoader from '@/components/CustomLoader';

export default function StudentClassPage() {
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<Class | null>(null);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [solutions, setSolutions] = useState<StudentSolution[]>([]);
  const [solvedQuestions, setSolvedQuestions] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;
  const toast = useToast();

  // Renk ayarları
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Veri yükleme fonksiyonu
  const fetchData = async () => {
    try {
      // Kullanıcının oturum bilgilerini kontrol et
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        router.push('/login');
        return;
      }

      const userId = sessionData.session.user.id;

      // Öğrenci bilgilerini getir
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', userId)
        .single();

      if (studentError || !studentData) {
        router.push('/login');
        return;
      }

      setStudentData(studentData);

      // Sınıf bilgilerini getir
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select(`
          *,
          teachers (
            id,
            full_name,
            email
          )
        `)
        .eq('id', classId)
        .single();

      if (classError || !classData) {
        toast({
          title: 'Hata',
          description: 'Sınıf bilgileri yüklenemedi',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        router.push('/students/dashboard');
        return;
      }

      setClassData(classData);

      // Öğrencinin bu sınıftaki çözümlerini getir
      const { data: solutionsData, error: solutionsError } = await supabase
        .from('student_solutions')
        .select('*')
        .eq('student_id', userId)
        .eq('class_id', classId)
        .order('date', { ascending: false });

      if (!solutionsError) {
        setSolutions(solutionsData || []);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast({
        title: 'Veri yükleme hatası',
        description: 'Sınıf bilgileri yüklenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchData();
    }
  }, [classId]);

  // Çözüm yükleme fonksiyonu
  const handleSolutionUpload = async () => {
    try {
      if (!studentData || !classData || solvedQuestions <= 0) {
        toast({
          title: 'Hata',
          description: 'Lütfen çözülen soru sayısını giriniz',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from('student_solutions')
        .insert([
          {
            student_id: studentData.id,
            class_id: classId,
            solved_questions: solvedQuestions,
            date: new Date().toISOString(),
          },
        ]);

      if (error) throw error;

      // Sayfayı yenile
      fetchData();
      
      toast({
        title: 'Başarılı',
        description: 'Çözümünüz kaydedildi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Modalı kapat ve formu temizle
      onClose();
      setSolvedQuestions(0);
    } catch (error) {
      console.error('Çözüm yükleme hatası:', error);
      toast({
        title: 'Hata',
        description: 'Çözümünüz kaydedilirken bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="80vh">
        <CustomLoader />
      </Flex>
    );
  }

  // Çözümlerim bölümü
  const renderSolutionsPanel = () => (
    <Box 
      borderWidth="1px"
      borderRadius="lg"
      bg={cardBg}
      p={6}
      borderColor={borderColor}
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Çözüm Geçmişi</Heading>
        <Button leftIcon={<FaUpload />} colorScheme="green" size="sm" onClick={onOpen}>
          Yeni Çözüm Yükle
        </Button>
      </Flex>
      
      <Divider mb={4} />
      
      {solutions.length > 0 ? (
        <Grid templateColumns="1fr" gap={4}>
          {solutions.map((solution) => (
            <Card key={solution.id} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontWeight="bold">
                    {new Date(solution.date).toLocaleDateString('tr-TR')}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Çözülen Soru: {solution.solved_questions}
                  </Text>
                </Box>
                <Badge colorScheme="green">Tamamlandı</Badge>
              </Flex>
            </Card>
          ))}
        </Grid>
      ) : (
        <Text textAlign="center" color="gray.500">
          Henüz çözüm yüklemediniz
        </Text>
      )}
      
      {/* Çözüm Yükleme Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Yeni Çözüm Yükle</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Çözülen Soru Sayısı</FormLabel>
              <NumberInput value={solvedQuestions} min={1} onChange={(value) => setSolvedQuestions(parseInt(value))}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSolutionUpload} isLoading={loading}>
              Kaydet
            </Button>
            <Button onClick={onClose}>İptal</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );

  return (
    <Box px={5} py={5} maxW="1200px" mx="auto">
      <Flex 
        mb={8} 
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'flex-start', md: 'center' }}
        justify="space-between"
      >
        <Box>
          <Heading size="lg" mb={1}>
            {classData?.name || 'Sınıf'}
          </Heading>
          <Text color="gray.600">
            Öğretmen: {classData?.teachers?.full_name || 'Bilinmiyor'}
          </Text>
        </Box>
        <Button 
          mt={{ base: 4, md: 0 }}
          leftIcon={<FaBook />}
          colorScheme="blue"
          onClick={() => router.push('/students/dashboard')}
        >
          Tüm Sınıflarım
        </Button>
      </Flex>

      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>Genel Bakış</Tab>
          <Tab>Ödevler</Tab>
          <Tab>Çözümlerim</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Box 
              borderWidth="1px"
              borderRadius="lg"
              bg={cardBg}
              p={6}
              borderColor={borderColor}
              mb={6}
            >
              <Heading size="md" mb={4}>Sınıf Bilgileri</Heading>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                <Box>
                  <Text fontWeight="bold">Sınıf Adı:</Text>
                  <Text mb={3}>{classData?.name}</Text>
                  
                  <Text fontWeight="bold">Öğretmen:</Text>
                  <Text mb={3}>{classData?.teachers?.full_name}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">Öğrenci Adı:</Text>
                  <Text mb={3}>{studentData?.name}</Text>
                  
                  <Text fontWeight="bold">Email:</Text>
                  <Text mb={3}>{studentData?.email}</Text>
                </Box>
              </Grid>
            </Box>

            <Box 
              borderWidth="1px"
              borderRadius="lg"
              bg={cardBg}
              p={6}
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>İstatistikler</Heading>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
                <Card p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                  <Flex align="center">
                    <Icon as={FaClipboardCheck} boxSize={10} color="green.500" mr={4} />
                    <Box>
                      <Text fontSize="sm" color="gray.500">Toplam Çözülen Soru</Text>
                      <Text fontSize="2xl" fontWeight="bold">
                        {solutions.reduce((total, sol) => total + (sol.solved_questions || 0), 0)}
                      </Text>
                    </Box>
                  </Flex>
                </Card>

                <Card p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                  <Flex align="center">
                    <Icon as={FaFileAlt} boxSize={10} color="blue.500" mr={4} />
                    <Box>
                      <Text fontSize="sm" color="gray.500">Ödev Çözüm</Text>
                      <Text fontSize="2xl" fontWeight="bold">
                        {solutions.length}
                      </Text>
                    </Box>
                  </Flex>
                </Card>

                <Card p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                  <Flex align="center">
                    <Icon as={FaUpload} boxSize={10} color="purple.500" mr={4} />
                    <Box>
                      <Text fontSize="sm" color="gray.500">Son Yükleme</Text>
                      <Text fontSize="xl" fontWeight="bold">
                        {solutions.length > 0 
                          ? new Date(solutions[0].date).toLocaleDateString('tr-TR') 
                          : 'Henüz Yok'}
                      </Text>
                    </Box>
                  </Flex>
                </Card>
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel>
            <Box 
              borderWidth="1px"
              borderRadius="lg"
              bg={cardBg}
              p={6}
              borderColor={borderColor}
              textAlign="center"
            >
              <Icon as={FaClipboardCheck} boxSize={12} color="gray.400" mb={4} />
              <Heading size="md" mb={2}>Yakında...</Heading>
              <Text mb={5} color="gray.500">
                Ödev takip sistemi çok yakında aktif olacak
              </Text>
            </Box>
          </TabPanel>

          <TabPanel>
            {renderSolutionsPanel()}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
} 