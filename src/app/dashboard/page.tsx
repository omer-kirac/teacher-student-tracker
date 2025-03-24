'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Text,
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
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Divider,
  Stack,
  Progress,
  Avatar,
  AvatarGroup,
  Center,
  VStack,
  HStack,
  Skeleton,
  useColorModeValue,
} from '@chakra-ui/react';
import { supabase } from '@/lib/supabase';
import React from 'react';
import { FiPlus, FiUsers, FiBook, FiBarChart2, FiGrid, FiCheckCircle } from 'react-icons/fi';
import type { RefObject } from 'react';
import EmptyStateIllustration from '@/components/EmptyStateIllustration';

interface Class {
  id: string;
  name: string;
  created_at: string;
}

export default function Dashboard() {
  // State hooks first
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [newClassName, setNewClassName] = useState('');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [className, setClassName] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalSolvedProblems: 0
  });
  
  // useDisclosure hooks
  const { 
    isOpen, 
    onOpen, 
    onClose 
  } = useDisclosure();

  const { 
    isOpen: isDeleteDialogOpen, 
    onOpen: onDeleteDialogOpen, 
    onClose: onDeleteDialogClose 
  } = useDisclosure();

  const { 
    isOpen: isEditClassModalOpen, 
    onOpen: onEditClassModalOpen, 
    onClose: onEditClassModalClose 
  } = useDisclosure();

  // Other hooks
  const router = useRouter();
  const toast = useToast();
  const cancelRef = React.useRef<any>(null);

  // Define all color mode values here to prevent conditional hook calls
  const boxBg = useColorModeValue('white', 'gray.800');
  const itemBorderColor = useColorModeValue('gray.200', 'gray.700');
  const itemBg = useColorModeValue('white', 'gray.700');
  const hoverBorderColor = useColorModeValue('blue.300', 'blue.300');
  const centerBg = useColorModeValue('blue.50', 'blue.900');
  const centerColor = useColorModeValue('blue.500', 'blue.300');
  const editButtonHoverBg = useColorModeValue('blue.50', 'blue.900');
  const deleteButtonHoverBg = useColorModeValue('red.50', 'red.900');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No session found, redirecting to login');
          router.push('/login');
          return;
        }
        
        console.log('User session:', session.user);
        setUser(session.user);
        
        let teacherId = session.user.id;
        let teacherData = null;
        
        // Fetch teacher profile data
        try {
          const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .eq('id', teacherId)
            .single();
            
          console.log('Teacher data by ID:', data, 'Error:', error);
          
          if (!error && data) {
            console.log('Teacher profile found by ID:', data);
            teacherData = data;
            setTeacherProfile(data);
          } else {
            // If teacher not found by id, try looking up by email
            console.log('Teacher not found by ID, trying by email');
            const { data: teacherByEmail, error: emailError } = await supabase
              .from('teachers')
              .select('*')
              .eq('email', session.user.email)
              .single();
              
            console.log('Teacher by email:', teacherByEmail, 'Error:', emailError);
            
            if (!emailError && teacherByEmail) {
              console.log('Teacher profile found by email:', teacherByEmail);
              teacherData = teacherByEmail;
              teacherId = teacherByEmail.id; // Use the teacher ID from the profile
              setTeacherProfile(teacherByEmail);
            } else {
              console.error('No teacher profile found for this user');
              toast({
                title: 'Profil Hatası',
                description: 'Öğretmen profil bilgileri bulunamadı.',
                status: 'error',
                duration: 5000,
                isClosable: true,
              });
            }
          }
        } catch (error) {
          console.error('Error fetching teacher profile:', error);
        }
        
        // Only fetch classes and stats if we have a valid teacherId
        if (teacherId) {
          console.log('Fetching data for teacher ID:', teacherId);
          fetchClasses(teacherId);
          fetchStats(teacherId);
        } else {
          console.error('No valid teacher ID found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Session check error:', error);
        setLoading(false);
        router.push('/login');
      }
    };

    checkSession();
  }, [router, toast]);

  const fetchStats = async (teacherId: string) => {
    try {
      console.log('Fetching stats for teacher ID:', teacherId);
      
      // Get total classes count
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', teacherId);
        
      if (classesError) {
        console.error('Error fetching classes:', classesError);
        throw classesError;
      }
      
      console.log('Classes data:', classesData);
      const classIds = classesData?.map(cls => cls.id) || [];
      console.log('Class IDs:', classIds);
      
      // Set default stats
      let studentsCount = 0;
      let solvedCount = 0;
      
      // Only query for students and solutions if there are classes
      if (classIds.length > 0) {
        // Get total students in these classes
        const { count: students, error: studentsError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: false })
          .in('class_id', classIds);
          
        if (studentsError) {
          console.error('Error fetching students count:', studentsError);
          throw studentsError;
        }
        
        console.log('Students count:', students);
        studentsCount = students || 0;
        
        // First get the student IDs from the teacher's classes
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id')
          .in('class_id', classIds);
          
        if (studentError) {
          console.error('Error fetching student IDs:', studentError);
          throw studentError;
        }
        
        const studentIds = studentData?.map(student => student.id) || [];
        console.log('Student IDs:', studentIds);
        
        if (studentIds.length > 0) {
          // Get all solution records to sum up solved_questions
          const { data: solutionsData, error: solvedError } = await supabase
            .from('student_solutions')
            .select('solved_questions')
            .in('student_id', studentIds);
            
          if (solvedError) {
            console.error('Error fetching solutions data:', solvedError);
            throw solvedError;
          }
          
          // Sum all solved_questions values
          if (solutionsData && solutionsData.length > 0) {
            solvedCount = solutionsData.reduce((total, solution) => 
              total + (solution.solved_questions || 0), 0);
          }
          
          console.log('Solutions data:', solutionsData);
          console.log('Total solved questions:', solvedCount);
        } else {
          console.log('No students found in these classes');
        }
      }
      
      // Update the stats state
      const updatedStats = {
        totalClasses: classIds.length,
        totalStudents: studentsCount,
        totalSolvedProblems: solvedCount
      };
      
      console.log('Updated stats:', updatedStats);
      setStats(updatedStats);
      
    } catch (error: any) {
      console.error('Error fetching stats:', error.message);
      toast({
        title: 'İstatistik Hatası',
        description: 'İstatistikler yüklenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchClasses = async (teacherId: string) => {
    try {
      console.log('Fetching classes for teacher ID:', teacherId);
      
      if (!teacherId) {
        console.error('Invalid teacher ID provided to fetchClasses');
        setClasses([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching classes:', error);
        throw error;
      }
      
      console.log('Classes fetch result:', data);
      setClasses(data || []);
    } catch (error: any) {
      console.error('Error fetching classes:', error.message);
      toast({
        title: 'Hata!',
        description: 'Sınıflar yüklenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      // Set empty classes array to avoid null/undefined issues
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      toast({
        title: 'Hata!',
        description: 'Sınıf adı boş olamaz',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!user || !user.id) {
      toast({
        title: 'Hata!',
        description: 'Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      console.log('Creating class with teacher ID:', user.id);
      
      // Önce öğretmen tablosunun kontrolü
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (teacherError) {
        console.error('Teacher not found error:', teacherError);
        
        // Öğretmen bulunamadıysa, otomatik oluştur
        const { error: insertError } = await supabase
          .from('teachers')
          .insert([{ 
            id: user.id, 
            email: user.email,
            full_name: user.user_metadata?.full_name || 'Öğretmen',
            password_hash: 'secure_placeholder'
          }]);
          
        if (insertError) {
          console.error('Teacher insert error:', insertError);
          throw insertError;
        }
      }
      
      // Sınıf oluştur
      const { data, error } = await supabase
        .from('classes')
        .insert([
          { 
            name: newClassName,
            teacher_id: user.id 
          }
        ])
        .select();

      if (error) {
        console.error('Class insert error:', error);
        throw error;
      }

      toast({
        title: 'Başarılı!',
        description: 'Yeni sınıf oluşturuldu',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Yeni sınıfı listeye ekle
      if (data) {
        setClasses([...data, ...classes]);
        // Update stats
        setStats(prev => ({...prev, totalClasses: prev.totalClasses + 1}));
      }
      setNewClassName('');
      onClose();
    } catch (error: any) {
      toast({
        title: 'Hata!',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', selectedClass.id);

      if (error) throw error;

      toast({
        title: 'Başarılı!',
        description: 'Sınıf silindi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Sınıf listesini güncelle
      setClasses(classes.filter(cls => cls.id !== selectedClass.id));
      // Update stats
      setStats(prev => ({...prev, totalClasses: prev.totalClasses - 1}));
      onDeleteDialogClose();
    } catch (error: any) {
      toast({
        title: 'Hata!',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditClass = (cls: Class) => {
    setEditingClass(cls);
    setClassName(cls.name);
    onEditClassModalOpen();
  };

  const handleUpdateClass = async () => {
    if (!editingClass || !className.trim()) return;

    try {
      const { error } = await supabase
        .from('classes')
        .update({ name: className })
        .eq('id', editingClass.id);

      if (error) throw error;

      toast({
        title: 'Başarılı!',
        description: 'Sınıf bilgileri güncellendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Sınıf listesini güncelle
      setClasses(
        classes.map(cls => 
          cls.id === editingClass.id 
            ? { ...cls, name: className } 
            : cls
        )
      );
      
      setClassName('');
      setEditingClass(null);
      onEditClassModalClose();
    } catch (error: any) {
      toast({
        title: 'Hata!',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleClassClick = (classId: string) => {
    router.push(`/classes/${classId}`);
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex direction="column" gap={6}>
          {/* Header skeleton */}
          <Skeleton 
            height="120px" 
            borderRadius="xl" 
            startColor="blue.100"
            endColor="blue.400"
            speed={1.2}
          />

          {/* Skeletons for stat cards */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mt={2}>
            {[1, 2, 3].map(i => (
              <Skeleton 
                key={i} 
                height="120px" 
                borderRadius="lg" 
                startColor="gray.50"
                endColor="gray.200"
                speed={1.2}
              />
            ))}
          </SimpleGrid>

          {/* Skeleton for classes section */}
          <Box borderRadius="lg" borderWidth="1px" p={6}>
            <Skeleton height="28px" width="150px" mb={6} />
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton 
                  key={i} 
                  height="100px" 
                  borderRadius="lg" 
                  speed={1.2}
                />
              ))}
            </SimpleGrid>
          </Box>
        </Flex>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Flex direction="column" gap={6}>
        {/* Header section with welcome message */}
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ base: 'flex-start', md: 'center' }}
          bg="linear-gradient(to right, #2D3748, #1A365D)"
          borderRadius="xl"
          p={6}
          color="white"
          boxShadow="lg"
        >
          <VStack align="flex-start" spacing={0}>
            <Text fontSize="sm" color="gray.300">Hoşgeldiniz,</Text>
            <Heading size="lg" className="css-5ahwhq">
              {teacherProfile?.full_name || user?.user_metadata?.full_name || 'Öğretmen'}
            </Heading>
            <Text fontSize="sm" color="gray.300" mt={1}>Öğrencilerinizin ilerlemesini takip edin</Text>
          </VStack>
          <HStack mt={{ base: 4, md: 0 }} spacing={4}>
            <Button 
              bg="whiteAlpha.200" 
              _hover={{ bg: 'whiteAlpha.300' }} 
              rightIcon={<FiUsers />}
              onClick={() => router.push('/students')}
            >
              Öğrenciler
            </Button>
            <Button 
              colorScheme="blue" 
              rightIcon={<FiPlus />}
              onClick={onOpen}
            >
              Yeni Sınıf
            </Button>
          </HStack>
        </Flex>

        {/* Stat cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mt={2}>
          <Card 
            borderRadius="lg" 
            overflow="hidden"
            variant="elevated"
            transition="all 0.3s"
            _hover={{ transform: 'translateY(-5px)', shadow: 'xl' }}
          >
            <CardBody p={6}>
              <Flex align="center" mb={4}>
                <Center 
                  bg="blue.100" 
                  w="48px" 
                  h="48px" 
                  borderRadius="12px"
                  color="blue.500"
                >
                  <Icon as={FiGrid} boxSize={6} />
                </Center>
                <Box ml={4}>
                  <Text fontSize="sm" color="gray.500">Toplam Sınıf</Text>
                  <Heading size="lg">{stats.totalClasses}</Heading>
                </Box>
              </Flex>
              <Progress value={Math.min(stats.totalClasses * 10, 100)} colorScheme="blue" borderRadius="full" size="sm" />
            </CardBody>
          </Card>

          <Card 
            borderRadius="lg" 
            overflow="hidden"
            variant="elevated"
            transition="all 0.3s"
            _hover={{ transform: 'translateY(-5px)', shadow: 'xl' }}
          >
            <CardBody p={6}>
              <Flex align="center" mb={4}>
                <Center 
                  bg="purple.100" 
                  w="48px" 
                  h="48px" 
                  borderRadius="12px"
                  color="purple.500"
                >
                  <Icon as={FiUsers} boxSize={6} />
                </Center>
                <Box ml={4}>
                  <Text fontSize="sm" color="gray.500">Toplam Öğrenci</Text>
                  <Heading size="lg">{stats.totalStudents}</Heading>
                </Box>
              </Flex>
              <Progress value={Math.min(stats.totalStudents * 2, 100)} colorScheme="purple" borderRadius="full" size="sm" />
            </CardBody>
          </Card>

          <Card 
            borderRadius="lg" 
            overflow="hidden"
            variant="elevated"
            transition="all 0.3s"
            _hover={{ transform: 'translateY(-5px)', shadow: 'xl' }}
          >
            <CardBody p={6}>
              <Flex align="center" mb={4}>
                <Center 
                  bg="green.100" 
                  w="48px" 
                  h="48px" 
                  borderRadius="12px"
                  color="green.500"
                >
                  <Icon as={FiCheckCircle} boxSize={6} />
                </Center>
                <Box ml={4}>
                  <Text fontSize="sm" color="gray.500">Çözülen Sorular</Text>
                  <Heading size="lg">{stats.totalSolvedProblems}</Heading>
                </Box>
              </Flex>
              <Progress 
                value={Math.min(stats.totalSolvedProblems/300, 100)} 
                colorScheme="green" 
                borderRadius="full" 
                size="sm" 
              />
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Classes section */}
        <Card
          borderRadius="lg"
          overflow="hidden"
          boxShadow="md"
          bg={boxBg}
          transition="all 0.3s"
          _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
        >
          <CardHeader pb={0}>
            <Flex justify="space-between" align="center">
              <Heading size="md">Sınıflarım</Heading>
              <Button 
                colorScheme="blue" 
                size="sm" 
                onClick={onOpen} 
                leftIcon={<FiPlus />}
                _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                _active={{ transform: 'translateY(0)', shadow: 'none' }}
                transition="all 0.2s"
              >
                Yeni Sınıf
              </Button>
            </Flex>
          </CardHeader>
          <CardBody>
            {classes.length === 0 ? (
              <EmptyStateIllustration
                title="Henüz sınıf bulunmuyor"
                message="Eğitim vereceğiniz ilk sınıfı ekleyerek başlayın"
                icon={<Icon as={FiBook} boxSize={8} />}
                buttonText="İlk Sınıfınızı Oluşturun"
                onButtonClick={onOpen}
                type="class"
              />
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mt={4}>
                {classes.map((cls, index) => (
                  <Box
                    key={cls.id}
                    borderWidth="1px"
                    borderRadius="lg"
                    p={5}
                    cursor="pointer"
                    onClick={() => handleClassClick(cls.id)}
                    borderColor={itemBorderColor}
                    bg={itemBg}
                    transition="all 0.3s"
                    _hover={{
                      transform: 'translateY(-5px)', 
                      boxShadow: 'md',
                      borderColor: hoverBorderColor
                    }}
                  >
                    <Flex justify="space-between" align="center">
                      <HStack>
                        <Center 
                          bg={centerBg} 
                          w="40px" 
                          h="40px" 
                          borderRadius="10px"
                          color={centerColor}
                        >
                          <Icon as={FiBook} boxSize={5} />
                        </Center>
                        <VStack align="start" spacing={0}>
                          <Heading size="sm">{cls.name}</Heading>
                        </VStack>
                      </HStack>
                      <HStack spacing={2}>
                        <Button 
                          size="xs" 
                          colorScheme="blue"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClass(cls);
                          }}
                          _hover={{ bg: editButtonHoverBg }}
                        >
                          Düzenle
                        </Button>
                        <Button 
                          size="xs" 
                          colorScheme="red"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClass(cls);
                            onDeleteDialogOpen();
                          }}
                          _hover={{ bg: deleteButtonHoverBg }}
                        >
                          Sil
                        </Button>
                      </HStack>
                    </Flex>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </CardBody>
        </Card>
      </Flex>

      {/* Create Class Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent borderRadius="xl">
          <ModalHeader>Yeni Sınıf Oluştur</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Sınıf Adı</FormLabel>
              <Input
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Örn: 5-A Sınıfı"
                borderRadius="lg"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose} borderRadius="lg">
              İptal
            </Button>
            <Button colorScheme="blue" onClick={handleCreateClass} borderRadius="lg">
              Oluştur
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Class Modal */}
      <Modal isOpen={isEditClassModalOpen} onClose={onEditClassModalClose}>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent borderRadius="xl">
          <ModalHeader>Sınıf Düzenle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Sınıf Adı</FormLabel>
              <Input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Örn: 5-A Sınıfı"
                borderRadius="lg"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onEditClassModalClose} borderRadius="lg">
              İptal
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateClass} borderRadius="lg">
              Güncelle
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteDialogClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Sınıfı Sil
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text>
                <strong>{selectedClass?.name}</strong> isimli sınıfı silmek istediğinize emin misiniz?
              </Text>
              <Text mt={2} fontWeight="bold" color="red.500">
                Bu işlem geri alınamaz ve sınıfa ait tüm öğrenciler ve çözümler de silinecektir.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteDialogClose} borderRadius="lg">
                İptal
              </Button>
              <Button colorScheme="red" onClick={handleDeleteClass} ml={3} borderRadius="lg">
                Sil
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
} 