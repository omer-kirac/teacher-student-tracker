'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Skeleton,
  SimpleGrid,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { supabase } from '@/lib/supabase';
import SolutionsChart from '@/components/SolutionsChart';
import StudentStats from '@/components/StudentStats';
import StudentRanking from '@/components/StudentRanking';
import React from 'react';
import { FiUsers, FiCheckCircle } from 'react-icons/fi';
import EmptyStateIllustration from '@/components/EmptyStateIllustration';
import Image from 'next/image';

interface Student {
  id: string;
  name: string;
  created_at: string;
  photo_url?: string;
}

interface Solution {
  id: string;
  student_id: string;
  date: string;
  solved_questions: number;
}

interface ClassDetails {
  id: string;
  name: string;
  created_at: string;
}

// Renk paletinden renk seçer - daha estetik renkler
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', 
  '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
];

export default function ClassPage({ params }: { params: { id: string } }) {
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [studentPhoto, setStudentPhoto] = useState<File | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [solutionDate, setSolutionDate] = useState(new Date().toISOString().split('T')[0]);
  const [solvedQuestions, setSolvedQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentName, setStudentName] = useState('');
  const [editStudentPhoto, setEditStudentPhoto] = useState<File | null>(null);
  const editFileInputRef = React.useRef<HTMLInputElement>(null);
  
  const { 
    isOpen: isStudentModalOpen, 
    onOpen: onStudentModalOpen, 
    onClose: onStudentModalClose 
  } = useDisclosure();

  const { 
    isOpen: isSolutionModalOpen, 
    onOpen: onSolutionModalOpen, 
    onClose: onSolutionModalClose 
  } = useDisclosure();

  const { 
    isOpen: isDeleteDialogOpen, 
    onOpen: onDeleteDialogOpen, 
    onClose: onDeleteDialogClose 
  } = useDisclosure();

  const { 
    isOpen: isEditStudentModalOpen, 
    onOpen: onEditStudentModalOpen, 
    onClose: onEditStudentModalClose 
  } = useDisclosure();

  const router = useRouter();
  const toast = useToast();
  const cancelRef = React.useRef<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Öğrenciler için renk paleti oluştur
  const studentColors = useMemo(() => {
    const colors: Record<string, string> = {};
    students.forEach((student, index) => {
      // Belirli bir renk paleti kullan
      colors[student.id] = COLORS[index % COLORS.length];
    });
    return colors;
  }, [students]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      fetchClassDetails();
      fetchStudents();
    };

    checkSession();
  }, [params.id, router]);
  
  // Öğrenciler yüklendiğinde çözümleri getir
  useEffect(() => {
    if (students.length > 0) {
      fetchSolutions();
    }
  }, [students]);

  const fetchClassDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setClassDetails(data);
    } catch (error: any) {
      toast({
        title: 'Hata!',
        description: 'Sınıf bilgileri yüklenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error('Error fetching class details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', params.id)
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: 'Hata!',
        description: 'Öğrenciler yüklenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error('Error fetching students:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSolutions = async () => {
    try {
      // Öğrenci listesi boşsa veya henüz yüklenmediyse işlemi yapma
      if (students.length === 0) return;
      
      const { data, error } = await supabase
        .from('student_solutions')
        .select('*')
        .in('student_id', students.map(s => s.id))
        .order('date', { ascending: false });

      if (error) throw error;
      setSolutions(data || []);
    } catch (error: any) {
      console.error('Error fetching solutions:', error.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setStudentPhoto(e.target.files[0]);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentName.trim()) {
      toast({
        title: 'Hata!',
        description: 'Öğrenci adı boş olamaz',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Önce öğrenciyi ekle
      const { data, error } = await supabase
        .from('students')
        .insert([
          { 
            name: newStudentName,
            class_id: params.id
          }
        ])
        .select();

      if (error) throw error;

      // Fotoğraf yüklendiyse storage'a kaydet
      if (studentPhoto && data && data[0]) {
        const studentId = data[0].id;
        const fileExt = studentPhoto.name.split('.').pop();
        const fileName = `${studentId}.${fileExt}`;
        const filePath = `student-photos/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('student-photos')
          .upload(filePath, studentPhoto, {
            upsert: true,
          });
          
        if (uploadError) throw uploadError;
        
        // Fotoğraf URL'ini öğrenci kaydına ekle
        const { data: publicUrlData } = supabase.storage
          .from('student-photos')
          .getPublicUrl(filePath);
        
        if (publicUrlData) {
          await supabase
            .from("students")
            .update({ photo_url: publicUrlData.publicUrl })
            .eq('id', studentId);
            
          // Öğrenci verisini güncelle photo_url ile birlikte
          data[0].photo_url = publicUrlData.publicUrl;
        }
      }

      toast({
        title: 'Başarılı!',
        description: 'Yeni öğrenci eklendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setStudents([...students, ...data]);
      setNewStudentName('');
      setStudentPhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onStudentModalClose();
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

  const handleAddSolution = async () => {
    if (!selectedStudentId) {
      toast({
        title: 'Hata!',
        description: 'Lütfen bir öğrenci seçin',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Önce aynı tarihte aynı öğrenci için bir kayıt var mı kontrol et
      const { data: existingData, error: checkError } = await supabase
        .from('student_solutions')
        .select('*')
        .eq('student_id', selectedStudentId)
        .eq('date', solutionDate)
        .maybeSingle();

      if (checkError) throw checkError;

      let operation;
      if (existingData) {
        // Veri varsa güncelle
        operation = supabase
          .from('student_solutions')
          .update({ solved_questions: solvedQuestions })
          .eq('id', existingData.id)
          .select();
      } else {
        // Veri yoksa yeni ekle
        operation = supabase
          .from('student_solutions')
          .insert([
            {
              student_id: selectedStudentId,
              date: solutionDate,
              solved_questions: solvedQuestions
            }
          ])
          .select();
      }

      const { data, error } = await operation;
      if (error) throw error;

      toast({
        title: 'Başarılı!',
        description: existingData ? 'Çözüm bilgisi güncellendi' : 'Yeni çözüm bilgisi eklendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Çözümleri yeniden yükle
      fetchSolutions();
      
      setSolvedQuestions(0);
      onSolutionModalClose();
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

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', selectedStudent.id);

      if (error) throw error;

      toast({
        title: 'Başarılı!',
        description: 'Öğrenci silindi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Öğrenci listesini güncelle
      setStudents(students.filter(student => student.id !== selectedStudent.id));
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

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setEditStudentPhoto(e.target.files[0]);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentName(student.name);
    setEditStudentPhoto(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    onEditStudentModalOpen();
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent || !studentName.trim()) {
      toast({
        title: 'Hata!',
        description: 'Öğrenci adı boş olamaz',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Öğrenci adını güncelle
      const { error } = await supabase
        .from('students')
        .update({ name: studentName })
        .eq('id', editingStudent.id);

      if (error) throw error;

      // Fotoğraf güncellemesi varsa storage'a kaydet
      if (editStudentPhoto) {
        const fileExt = editStudentPhoto.name.split('.').pop();
        const fileName = `${editingStudent.id}.${fileExt}`;
        const filePath = `student-photos/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('student-photos')
          .upload(filePath, editStudentPhoto, {
            upsert: true,
          });
          
        if (uploadError) throw uploadError;
        
        // Fotoğraf URL'ini öğrenci kaydına ekle
        const { data: publicUrlData } = supabase.storage
          .from('student-photos')
          .getPublicUrl(filePath);
        
        if (publicUrlData) {
          await supabase
            .from("students")
            .update({ photo_url: publicUrlData.publicUrl })
            .eq('id', editingStudent.id);
            
          // Öğrenci fotoğraf URL'ini güncelle
          editingStudent.photo_url = publicUrlData.publicUrl;
        }
      }

      toast({
        title: 'Başarılı!',
        description: 'Öğrenci güncellendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Öğrenci listesini güncelle
      setStudents(
        students.map(s => 
          s.id === editingStudent.id ? { ...s, name: studentName, photo_url: editingStudent.photo_url } : s
        )
      );

      setEditStudentPhoto(null);
      onEditStudentModalClose();
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

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex direction="column" gap={6}>
          {/* Header skeleton */}
          <Box mb={8}>
            <Skeleton height="28px" width="120px" mb={2} />
            <Skeleton height="36px" width="300px" />
          </Box>

          {/* Tab skeleton */}
          <Skeleton height="48px" borderRadius="md" mb={4} />

          {/* Content skeleton */}
          <Box borderWidth="1px" borderRadius="lg" p={6}>
            <SimpleGrid columns={{ base: 1 }} spacing={4}>
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton 
                  key={i} 
                  height="60px" 
                  borderRadius="md" 
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
    <Container maxW="container.xl" py={10}>
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        <Box>
          <Button variant="outline" size="sm" mb={2} onClick={handleBackToDashboard}>
            ← Panele Dön
          </Button>
          <Heading>{classDetails?.name}</Heading>
        </Box>
        <Flex gap={4}>
          <Button colorScheme="blue" onClick={onStudentModalOpen}>
            Yeni Öğrenci Ekle
          </Button>
          <Button colorScheme="green" onClick={onSolutionModalOpen} isDisabled={students.length === 0}>
            Çözüm Ekle
          </Button>
        </Flex>
      </Flex>

      <Tabs isFitted variant="enclosed">
        <TabList mb="1em">
          <Tab>Öğrenciler</Tab>
          <Tab>Çözüm Takibi</Tab>
          <Tab>Sıralama</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {students.length === 0 ? (
              <EmptyStateIllustration
                title="Henüz öğrenci bulunmuyor"
                message="Bu sınıfa öğrenci ekleyerek başlayın"
                icon={<Icon as={FiUsers} boxSize={8} />}
                buttonText="İlk Öğrenciyi Ekleyin"
                onButtonClick={onStudentModalOpen}
                type="student"
              />
            ) : (
              <Box
                borderWidth="1px"
                borderRadius="lg"
                overflow="hidden"
                p={4}
                mb={8}
                boxShadow="md"
                bg={useColorModeValue('white', 'gray.800')}
                transition="all 0.3s"
                _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
              >
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Öğrenci Adı</Th>
                      <Th>Eklenme Tarihi</Th>
                      <Th width="100px" textAlign="center">İşlemler</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {students.map((student, index) => (
                      <Tr 
                        key={student.id}
                        _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                        transition="background 0.2s"
                      >
                        <Td>
                          <Flex align="center">
                            <Box 
                              width="32px" 
                              height="32px" 
                              borderRadius="full" 
                              overflow="hidden" 
                              mr={2}
                              bg={student.photo_url ? "transparent" : studentColors[student.id]}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              color="white"
                              fontWeight="bold"
                            >
                              {student.photo_url ? (
                                <Image 
                                  src={student.photo_url} 
                                  alt={student.name}
                                  width={32}
                                  height={32}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                student.name.charAt(0).toUpperCase()
                              )}
                            </Box>
                            <Text>{student.name}</Text>
                          </Flex>
                        </Td>
                        <Td>{new Date(student.created_at).toLocaleDateString()}</Td>
                        <Td>
                          <Flex justify="center" gap={2}>
                            <Button 
                              size="sm" 
                              colorScheme="blue"
                              onClick={() => handleEditStudent(student)}
                              _hover={{ transform: 'translateY(-2px)', shadow: 'sm' }}
                              _active={{ transform: 'translateY(0)', shadow: 'none' }}
                              transition="all 0.2s"
                            >
                              Düzenle
                            </Button>
                            <Button 
                              size="sm" 
                              colorScheme="red"
                              onClick={() => {
                                setSelectedStudent(student);
                                onDeleteDialogOpen();
                              }}
                              _hover={{ transform: 'translateY(-2px)', shadow: 'sm' }}
                              _active={{ transform: 'translateY(0)', shadow: 'none' }}
                              transition="all 0.2s"
                            >
                              Sil
                            </Button>
                          </Flex>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </TabPanel>
          <TabPanel>
            <Box>
              {solutions.length === 0 ? (
                <EmptyStateIllustration
                  title="Henüz çözüm kaydı bulunmuyor"
                  message="Öğrencilerin çözdüğü soruları kaydedin"
                  icon={<Icon as={FiCheckCircle} boxSize={8} />}
                  buttonText="Çözüm Ekle"
                  onButtonClick={onSolutionModalOpen}
                  type="solution"
                />
              ) : (
                <SolutionsChart students={students} solutions={solutions} />
              )}
            </Box>
          </TabPanel>
          <TabPanel>
            <Box>
              <StudentRanking students={students} solutions={solutions} />
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Yeni Öğrenci Ekleme Modal */}
      <Modal isOpen={isStudentModalOpen} onClose={onStudentModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Yeni Öğrenci Ekle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>Öğrenci Adı</FormLabel>
              <Input
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Öğrencinin adı ve soyadı"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Öğrenci Fotoğrafı (Opsiyonel)</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                p={1}
              />
              {studentPhoto && (
                <Flex mt={2} align="center">
                  <Box 
                    width="50px" 
                    height="50px" 
                    borderRadius="full" 
                    overflow="hidden" 
                    mr={2}
                    bg={COLORS[students.length % COLORS.length]}
                  >
                    <Image 
                      src={URL.createObjectURL(studentPhoto)} 
                      alt="Öğrenci fotoğrafı önizleme"
                      width={50}
                      height={50}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                  <Text fontSize="sm">
                    {studentPhoto.name} ({(studentPhoto.size / 1024).toFixed(1)} KB)
                  </Text>
                </Flex>
              )}
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onStudentModalClose}>
              İptal
            </Button>
            <Button colorScheme="blue" onClick={handleAddStudent}>
              Ekle
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Yeni Çözüm Ekleme Modal */}
      <Modal isOpen={isSolutionModalOpen} onClose={onSolutionModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Çözüm Bilgisi Ekle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>Öğrenci</FormLabel>
              <Box 
                border="1px solid" 
                borderColor="gray.200" 
                borderRadius="md" 
                p={2}
                position="relative"
              >
                {selectedStudentId ? (
                  <Flex align="center" onClick={() => setSelectedStudentId('')} cursor="pointer">
                    <Box 
                      width="32px" 
                      height="32px" 
                      borderRadius="full" 
                      overflow="hidden" 
                      mr={2}
                      bg={(() => {
                        const selectedStudent = students.find(s => s.id === selectedStudentId);
                        if (selectedStudent) {
                          return selectedStudent.photo_url ? "transparent" : studentColors[selectedStudent.id];
                        }
                        return "gray.400";
                      })()}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                      fontWeight="bold"
                    >
                      {(() => {
                        const selectedStudent = students.find(s => s.id === selectedStudentId);
                        if (selectedStudent) {
                          if (selectedStudent.photo_url) {
                            return (
                              <Image 
                                src={selectedStudent.photo_url} 
                                alt={selectedStudent.name}
                                width={32}
                                height={32}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            );
                          }
                          return selectedStudent.name.charAt(0).toUpperCase();
                        }
                        return null;
                      })()}
                    </Box>
                    <Text>
                      {students.find(s => s.id === selectedStudentId)?.name || "Öğrenci Seçin"}
                    </Text>
                  </Flex>
                ) : (
                  <Text color="gray.500" mb={2}>Öğrenci Seçin</Text>
                )}
                
                {!selectedStudentId && (
                  <Box maxH="200px" overflowY="auto">
                    {students.map(student => (
                      <Flex 
                        key={student.id} 
                        align="center" 
                        p={2} 
                        _hover={{ bg: 'gray.50' }}
                        cursor="pointer"
                        onClick={() => setSelectedStudentId(student.id)}
                        borderRadius="md"
                      >
                        <Box 
                          width="32px" 
                          height="32px" 
                          borderRadius="full" 
                          overflow="hidden" 
                          mr={2}
                          bg={student.photo_url ? "transparent" : studentColors[student.id]}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          color="white"
                          fontWeight="bold"
                        >
                          {student.photo_url ? (
                            <Image 
                              src={student.photo_url} 
                              alt={student.name}
                              width={32}
                              height={32}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            student.name.charAt(0).toUpperCase()
                          )}
                        </Box>
                        <Text>{student.name}</Text>
                      </Flex>
                    ))}
                  </Box>
                )}
              </Box>
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Tarih</FormLabel>
              <Input
                type="date"
                value={solutionDate}
                onChange={(e) => setSolutionDate(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Çözülen Soru Sayısı</FormLabel>
              <NumberInput 
                min={0} 
                value={solvedQuestions} 
                onChange={(valueString) => setSolvedQuestions(parseInt(valueString))}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSolutionModalClose}>
              İptal
            </Button>
            <Button colorScheme="blue" onClick={handleAddSolution}>
              Kaydet
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Öğrenci Düzenleme Modal */}
      <Modal isOpen={isEditStudentModalOpen} onClose={onEditStudentModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Öğrenci Düzenle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>Öğrenci Adı</FormLabel>
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Öğrencinin adı ve soyadı"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Öğrenci Fotoğrafı</FormLabel>
              {editingStudent && editingStudent.photo_url && !editStudentPhoto && (
                <Flex mb={3} align="center">
                  <Box 
                    width="50px" 
                    height="50px" 
                    borderRadius="full" 
                    overflow="hidden" 
                    mr={2}
                    bg={editingStudent.photo_url ? "transparent" : studentColors[editingStudent.id]}
                  >
                    <Image 
                      src={editingStudent.photo_url} 
                      alt="Mevcut fotoğraf"
                      width={50}
                      height={50}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                  <Text fontSize="sm">Mevcut fotoğraf</Text>
                </Flex>
              )}
              
              <Input
                type="file"
                accept="image/*"
                onChange={handleEditFileChange}
                ref={editFileInputRef}
                p={1}
              />
              
              {editStudentPhoto && (
                <Flex mt={2} align="center">
                  <Box 
                    width="50px" 
                    height="50px" 
                    borderRadius="full" 
                    overflow="hidden" 
                    mr={2}
                    bg={editingStudent ? studentColors[editingStudent.id] : "gray.400"}
                  >
                    <Image 
                      src={URL.createObjectURL(editStudentPhoto)} 
                      alt="Yeni fotoğraf önizleme"
                      width={50}
                      height={50}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                  <Text fontSize="sm">
                    {editStudentPhoto.name} ({(editStudentPhoto.size / 1024).toFixed(1)} KB)
                  </Text>
                </Flex>
              )}
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditStudentModalClose}>
              İptal
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateStudent}>
              Güncelle
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Öğrenci Silme Onay Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteDialogClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Öğrenciyi Sil
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text>
                <strong>{selectedStudent?.name}</strong> isimli öğrenciyi silmek istediğinize emin misiniz?
              </Text>
              <Text mt={2} fontWeight="bold" color="red.500">
                Bu işlem geri alınamaz ve öğrenciye ait tüm çözüm verileri de silinecektir.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteDialogClose}>
                İptal
              </Button>
              <Button colorScheme="red" onClick={handleDeleteStudent} ml={3}>
                Sil
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
} 