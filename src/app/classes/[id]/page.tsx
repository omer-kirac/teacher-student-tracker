'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Avatar,
  TableContainer,
  Badge,
  Spinner,
  Grid,
  Card,
  CardBody,
  Center,
  VStack,
  HStack,
  Link,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  InputGroup,
  InputLeftElement,
  ButtonGroup,
  Select,
} from '@chakra-ui/react';
import { supabase } from '@/lib/supabase';
import SolutionsChart from '@/components/SolutionsChart';
import StudentStats from '@/components/StudentStats';
import StudentRanking from '@/components/StudentRanking';
import React from 'react';
import { FiUsers, FiCheckCircle, FiArrowLeft, FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import EmptyStateIllustration from '@/components/EmptyStateIllustration';
import Image from 'next/image';
import { FaBook, FaUsers, FaClipboardCheck, FaChalkboardTeacher, FaLink, FaTrophy, FaChartLine, FaPlus } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { Teacher, Class } from '@/types';
import CustomLoader from '@/components/CustomLoader';
import FileUploader from '@/components/FileUploader';
import CustomButton from '@/components/CustomButton';
import GooeyNav from '@/components/GooeyNav';
import type { FocusableElement } from '@chakra-ui/utils';

// Student interface'ini ve diğer tipleri doğrudan tanımlayalım
interface Student {
  id: string;
  name: string;
  created_at: string;
  photo_url?: string;
  email?: string;
}

interface StudentSolution {
  id: string;
  student_id: string;
  date: string;
  solved_questions: number;
  class_id?: string;
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

export default function ClassDetailsPage({ params }: { params: { id: string } }) {
  // Renk ayarları
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('blue.700', 'gray.800');
  
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<Partial<Class>>({});
  const [teacherData, setTeacherData] = useState<Teacher | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [solutions, setSolutions] = useState<StudentSolution[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const [studentPhoto, setStudentPhoto] = useState<File | null>(null);
  const [solutionDate, setSolutionDate] = useState(new Date().toISOString().split('T')[0]);
  const [solvedQuestions, setSolvedQuestions] = useState(0);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentName, setStudentName] = useState('');
  const [editStudentPhoto, setEditStudentPhoto] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');

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
  const urlParams = useParams();
  const classId = urlParams?.id as string;
  const toast = useToast();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const editFileInputRef = React.useRef<HTMLInputElement>(null);
  
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
    const fetchData = async () => {
      try {
        // Kullanıcının oturum bilgilerini kontrol et
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
        router.push('/login');
        return;
      }
      
        const userId = sessionData.session.user.id;

        // Öğretmen bilgilerini getir
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', userId)
          .single();

        if (teacherError || !teacherData) {
          router.push('/login');
          return;
        }

        setTeacherData(teacherData);

        // Sınıf bilgilerini getir
        const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
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
          router.push('/dashboard');
          return;
        }

        setClassData(classData);

        // Sınıftaki öğrencileri getir
        const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
          .eq('class_id', classId);

        if (!studentsError) {
          setStudents(studentsData || []);
        }

        // Öğrencilerin çözümlerini getir
        const { data: solutionsData, error: solutionsError } = await supabase
          .from('student_solutions')
          .select('*')
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

    if (classId) {
      fetchData();
    }
  }, [classId, router, toast]);

  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="80vh">
        <CustomLoader />
      </Flex>
    );
  }

  // Öğrencinin çözümünü bul
  const getStudentSolutions = (studentId: string) => {
    return solutions.filter(solution => solution.student_id === studentId);
  };

  // Toplam çözülen soru sayısını hesapla
  const getTotalSolvedQuestions = (studentId: string) => {
    const studentSolutions = getStudentSolutions(studentId);
    return studentSolutions.reduce((total, solution) => total + solution.solved_questions, 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setStudentPhoto(e.target.files[0]);
    }
  };
  
  const handleFileSelect = (file: File | null) => {
    setStudentPhoto(file);
  };
  
  const handleEditFileSelect = (file: File | null) => {
    setEditStudentPhoto(file);
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
            class_id: classId
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
      if (editFileInputRef.current) editFileInputRef.current.value = "";
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
              class_id: classId,
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

  // Dashboard sayfasına dönüş fonksiyonu
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

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentName(student.name);
    setEditStudentPhoto(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    onEditStudentModalOpen();
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent || !studentName.trim()) {
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
      // Önce öğrenciyi güncelle
      const updates: any = { 
        name: studentName,
      };

      // Fotoğraf seçildiyse, storage'a yükle
      if (editStudentPhoto) {
        const fileExt = editStudentPhoto.name.split('.').pop();
        const fileName = `${selectedStudent.id}.${fileExt}`;
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
            .eq('id', selectedStudent.id);
            
          // Öğrenci fotoğraf URL'ini güncelle
          selectedStudent.photo_url = publicUrlData.publicUrl;
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
          s.id === selectedStudent.id ? { ...s, name: studentName, photo_url: selectedStudent.photo_url } : s
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

  // GooeyNav'dan gelen tabindex değişikliğini işleyecek function
  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  return (
    <Container maxW="container.xl" py={6}>
      <Flex direction="column" mb={6}>
        <Flex justify="space-between" align="center" mb={4}>
          <HStack spacing={2}>
            <Link onClick={handleBackToDashboard} _hover={{ textDecor: 'none' }}>
              <CustomButton leftIcon={<FiArrowLeft />} size="sm" variant="outline" buttonColorOutline="#1a52cb">
                Panele Dön
              </CustomButton>
            </Link>
            <Heading size="lg">{classData?.name || '6-C'}</Heading>
          </HStack>
          
          <HStack spacing={3}>
            <CustomButton 
              leftIcon={<FiUsers />} 
              variant="outline" 
              buttonColorOutline="#1a52cb"
              onClick={() => router.push(`/classes/${classId}/invite`)}
            >
              Öğrenci Davet Et
            </CustomButton>
            <CustomButton
              leftIcon={<FiPlus />}
              buttonColor="#e50041"
              onClick={onStudentModalOpen}
            >
              Yeni Öğrenci Ekle
            </CustomButton>
          </HStack>
        </Flex>

        {/* Ana Sekmeler - GooeyNav ile */}
        <Box mb={6} bg={headerBg} p={3} borderRadius="xl">
          <GooeyNav
            items={[
              { label: "Öğrenciler", href: "#students" },
              { label: "Çözüm Takibi", href: "#solutions" },
              { label: "Sıralama", href: "#ranking" },
              { label: "Ödevler", href: "#assignments" },
            ]}
            animationTime={600}
            pCount={15}
            minDistance={20}
            maxDistance={42}
            maxRotate={75}
            colors={[1, 2, 3, 1, 2, 3, 1, 4]}
            timeVariance={300}
            initialActiveIndex={activeTab}
            onTabChange={handleTabChange}
          />
        </Box>

        {/* Öğrenciler İçeriği */}
        <Box display={activeTab === 0 ? 'block' : 'none'}>
          <Card borderRadius="lg" boxShadow="md" bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <Box p={4}>
              {students.length === 0 ? (
                <Flex direction="column" align="center" justify="center" py={8}>
                  <EmptyStateIllustration 
                    title="Öğrenci Yok" 
                    message="Bu sınıfta henüz öğrenci yok" 
                    icon={<FaUsers />} 
                  />
                  <Text fontWeight="medium" mt={4} textAlign="center">
                    Bu sınıfta henüz öğrenci yok
                  </Text>
                  <CustomButton
                    mt={4}
                    buttonColor="#e50041"
                    leftIcon={<FiPlus />}
                    onClick={onStudentModalOpen}
                  >
                    Öğrenci Ekle
                  </CustomButton>
                </Flex>
              ) : (
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>ÖĞRENCİ ADI</Th>
                        <Th isNumeric>İŞLEMLER</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {students.map(student => (
                        <Tr key={student.id}>
                          <Td>
                            <Flex align="center">
                              <Avatar 
                                size="sm" 
                                name={student.name} 
                                src={student.photo_url || undefined} 
                                mr={3} 
                              />
                              {student.name}
                            </Flex>
                          </Td>
                          <Td isNumeric>
                            <HStack spacing={2} justifyContent="flex-end">
                              <CustomButton
                                size="sm"
                                leftIcon={<FiPlus />}
                                buttonColor="#e50041" 
                                onClick={() => {
                                  setSelectedStudentId(student.id);
                                  onSolutionModalOpen();
                                }}
                              >
                                Çözüm Ekle
                              </CustomButton>
                              <CustomButton
                                size="sm"
                                leftIcon={<FiEdit />}
                                variant="outline"
                                buttonColorOutline="#1a52cb"
                                onClick={() => handleEditStudent(student)}
                              >
                                Düzenle
                              </CustomButton>
                              <CustomButton
                                size="sm"
                                leftIcon={<FiTrash2 />}
                                variant="outline"
                                buttonColorOutline="#101622"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  onDeleteDialogOpen();
                                }}
                              >
                                Sil
                              </CustomButton>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Card>
        </Box>

        {/* Çözüm Takibi İçeriği */}
        <Box display={activeTab === 1 ? 'block' : 'none'}>
          <Card borderRadius="lg" boxShadow="md" bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
            <Box p={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Çözüm Grafiği</Heading>
                <Box>
                  <CustomButton 
                    variant="outline" 
                    mr={2} 
                    buttonColorOutline="#1a52cb"
                    onClick={() => setChartType('line')}
                    bg={chartType === 'line' ? 'blue.50' : 'transparent'}
                  >
                    Çizgi
                  </CustomButton>
                  <CustomButton 
                    variant="outline" 
                    mr={2}
                    buttonColorOutline="#1a52cb"
                    onClick={() => setChartType('area')}
                    bg={chartType === 'area' ? 'blue.50' : 'transparent'}
                  >
                    Alan
                  </CustomButton>
                  <CustomButton 
                    variant="outline" 
                    buttonColorOutline="#1a52cb"
                    onClick={() => setChartType('bar')}
                    bg={chartType === 'bar' ? 'blue.50' : 'transparent'}
                  >
                    Sütun
                  </CustomButton>
                </Box>
              </Flex>
              <Box height="500px">
                {students.length > 0 && solutions.length > 0 ? (
                  <SolutionsChart 
                    students={students} 
                    solutions={solutions}
                    hideControls={true}
                    chartType={chartType}
                  />
                ) : (
                  <Flex direction="column" align="center" justify="center" height="100%">
                    <EmptyStateIllustration 
                      title="Veri Bulunamadı" 
                      message="Henüz çözüm verisi bulunmuyor" 
                      icon={<FaChartLine />} 
                    />
                    <Text fontWeight="medium" mt={4} textAlign="center">
                      Henüz çözüm verisi bulunmuyor
                    </Text>
                  </Flex>
                )}
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Sıralama İçeriği */}
        <Box display={activeTab === 2 ? 'block' : 'none'}>
          <Card borderRadius="lg" boxShadow="md" bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <Box p={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Öğrenci Sıralaması</Heading>
                <Box>
                  <CustomButton size="sm" variant="outline" buttonColorOutline="#1a52cb">
                    Tüm Zamanlar
                  </CustomButton>
                </Box>
              </Flex>

              {students.length === 0 || solutions.length === 0 ? (
                <Flex direction="column" align="center" justify="center" py={8}>
                  <EmptyStateIllustration 
                    title="Sıralama Yok" 
                    message="Sıralama için yeterli veri bulunmuyor" 
                    icon={<FaTrophy />} 
                  />
                  <Text fontWeight="medium" mt={4} textAlign="center">
                    Sıralama için yeterli veri bulunmuyor
                  </Text>
                </Flex>
              ) : (
                <StudentRanking students={students} solutions={solutions} />
              )}
            </Box>
          </Card>
        </Box>

        {/* Ödevler İçeriği */}
        <Box display={activeTab === 3 ? 'block' : 'none'}>
          <Card borderRadius="lg" boxShadow="md" bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <Box p={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Sınıf Ödevleri</Heading>
                <CustomButton
                  leftIcon={<FaPlus />}
                  buttonColor="#e50041"
                  onClick={() => router.push(`/classes/${classId}/assignments`)}
                >
                  Tüm Ödevlere Git
                </CustomButton>
              </Flex>
              
              <Box>
                {/* Burada ödev listesi gösterilecek veya ödev sayfasına yönlendirme yapılacak */}
                <Flex direction="column" align="center" justify="center" py={8}>
                  <EmptyStateIllustration 
                    title="Ödevler" 
                    message="Tüm ödevleri görmek ve yönetmek için ödevler sayfasına gidin" 
                    icon={<FaBook />} 
                  />
                  <Text fontWeight="medium" mt={4} textAlign="center">
                    Bu sınıfa ait ödevleri görüntülemek, düzenlemek ve notlandırmak için
                  </Text>
                  <CustomButton
                    mt={4}
                    leftIcon={<FaBook />}
                    buttonColor="#e50041"
                    onClick={() => router.push(`/classes/${classId}/assignments`)}
                  >
                    Ödevler Sayfasına Git
                  </CustomButton>
                </Flex>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Modaller ve Dialoglar */}
        {/* Öğrenci Ekleme Modal */}
        <Modal isOpen={isStudentModalOpen} onClose={onStudentModalClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Yeni Öğrenci Ekle</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl mb={4}>
                <FormLabel>Öğrenci Adı</FormLabel>
                <Input 
                  placeholder="Öğrenci adını girin" 
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Fotoğraf (Opsiyonel)</FormLabel>
                <FileUploader
                  onFileSelect={handleFileSelect}
                  accept="image/*"
                  id="student-photo-upload"
                  compact={true}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <CustomButton mr={3} onClick={handleAddStudent} buttonColor="#e50041">
                Ekle
              </CustomButton>
              <CustomButton variant="outline" onClick={onStudentModalClose} buttonColorOutline="#1a52cb">İptal</CustomButton>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Çözüm Ekleme Modal */}
        <Modal isOpen={isSolutionModalOpen} onClose={onSolutionModalClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Çözüm Ekle</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl mb={4}>
                <FormLabel>Öğrenci</FormLabel>
                <Text fontWeight="medium">
                  {students.find(s => s.id === selectedStudentId)?.name || ''}
                </Text>
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
                <NumberInput min={0} value={solvedQuestions} onChange={(_, value) => setSolvedQuestions(value)}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <CustomButton mr={3} onClick={handleAddSolution} buttonColor="#e50041">
                Ekle
              </CustomButton>
              <CustomButton variant="outline" onClick={onSolutionModalClose} buttonColorOutline="#1a52cb">İptal</CustomButton>
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
                  placeholder="Öğrenci adını girin" 
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Fotoğraf (Opsiyonel)</FormLabel>
                <FileUploader
                  onFileSelect={handleEditFileSelect}
                  accept="image/*"
                  id="student-photo-edit-upload"
                  compact={true}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <CustomButton mr={3} onClick={handleUpdateStudent} buttonColor="#e50041">
                Güncelle
              </CustomButton>
              <CustomButton variant="outline" onClick={onEditStudentModalClose} buttonColorOutline="#1a52cb">İptal</CustomButton>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Öğrenci Silme Onay Dialogu */}
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
                {selectedStudent?.name} adlı öğrenciyi silmek istediğinize emin misiniz?
                Bu işlem geri alınamaz.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button onClick={onDeleteDialogClose} variant="outline" ref={cancelRef}>
                  İptal
                </Button>
                <CustomButton onClick={handleDeleteStudent} ml={3} buttonColor="#e50041">
                  Sil
                </CustomButton>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Flex>
    </Container>
  );
}

// Genel Bakış sekmesi bileşeni
function OverviewTab({ classId }: { classId: string }) {
  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [solutions, setSolutions] = useState<StudentSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('blue.700', 'gray.800');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Sınıf bilgilerini getir
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('*')
          .eq('id', classId)
          .single();

        if (classError) throw classError;
        setClassData(classData);

        // Sınıftaki öğrencileri getir
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', classId);

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);

        // Öğrencilerin çözümlerini getir
        const { data: solutionsData, error: solutionsError } = await supabase
          .from('student_solutions')
          .select('*')
          .eq('class_id', classId)
          .order('date', { ascending: false });

        if (solutionsError) throw solutionsError;
        setSolutions(solutionsData || []);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  if (loading) return <Center><Spinner /></Center>;

  return (
    <Box>
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
            
            <Text fontWeight="bold">Oluşturulma Tarihi:</Text>
            <Text mb={3}>
              {classData?.created_at 
                ? new Date(classData.created_at).toLocaleDateString('tr-TR') 
                : 'Bilinmiyor'}
            </Text>
          </Box>
          
          <Box>
            <Text fontWeight="bold">Öğrenci Sayısı:</Text>
            <Text mb={3}>{students.length}</Text>
            
            <Text fontWeight="bold">Toplam Çözülen Soru:</Text>
            <Text mb={3}>
              {solutions.reduce((total, sol) => total + sol.solved_questions, 0)}
            </Text>
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
              <Icon as={FaUsers} boxSize={10} color="blue.500" mr={4} />
              <Box>
                <Text fontSize="sm" color="gray.500">Toplam Öğrenci</Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {students.length}
                </Text>
              </Box>
            </Flex>
          </Card>

          <Card p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <Flex align="center">
              <Icon as={FaClipboardCheck} boxSize={10} color="green.500" mr={4} />
              <Box>
                <Text fontSize="sm" color="gray.500">Toplam Çözüm</Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {solutions.length}
                </Text>
              </Box>
            </Flex>
          </Card>

          <Card p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <Flex align="center">
              <Icon as={FaChalkboardTeacher} boxSize={10} color="purple.500" mr={4} />
              <Box>
                <Text fontSize="sm" color="gray.500">Ortalama Soru</Text>
                <Text fontSize="xl" fontWeight="bold">
                  {students.length > 0 
                    ? Math.round(solutions.reduce((total, sol) => total + sol.solved_questions, 0) / students.length) 
                    : 0}
                </Text>
              </Box>
            </Flex>
          </Card>
        </Grid>
      </Box>
    </Box>
  );
}

// Öğrenciler sekmesi bileşeni
function StudentsTab({ classId }: { classId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [solutions, setSolutions] = useState<StudentSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('blue.700', 'gray.800');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Sınıftaki öğrencileri getir
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', classId);

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);

        // Öğrencilerin çözümlerini getir
        const { data: solutionsData, error: solutionsError } = await supabase
          .from('student_solutions')
          .select('*')
          .eq('class_id', classId)
          .order('date', { ascending: false });

        if (solutionsError) throw solutionsError;
        setSolutions(solutionsData || []);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  if (loading) return <Center><Spinner /></Center>;

  const getStudentSolutions = (studentId: string) => {
    return solutions.filter(solution => solution.student_id === studentId);
  };

  const getTotalSolvedQuestions = (studentId: string) => {
    const studentSolutions = getStudentSolutions(studentId);
    return studentSolutions.reduce((total, solution) => total + solution.solved_questions, 0);
  };

  return (
    <Box>
      <Heading size="md" mb={4}>Öğrenci Listesi</Heading>
      
      {students.length > 0 ? (
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Öğrenci</Th>
                <Th>Email</Th>
                <Th isNumeric>Toplam Çözülen Soru</Th>
                <Th isNumeric>Son Aktivite</Th>
              </Tr>
            </Thead>
            <Tbody>
              {students.map((student) => {
                const studentSolutions = getStudentSolutions(student.id);
                const lastActivity = studentSolutions.length > 0 
                  ? new Date(studentSolutions[0].date).toLocaleDateString('tr-TR')
                  : '-';
                
                return (
                  <Tr key={student.id}>
                    <Td>
                      <Flex align="center">
                        <Avatar 
                          size="sm" 
                          name={student.name} 
                          src={student.photo_url || undefined} 
                          mr={2}
                        />
                        {student.name}
                      </Flex>
                    </Td>
                    <Td>{student.email || '-'}</Td>
                    <Td isNumeric>{getTotalSolvedQuestions(student.id)}</Td>
                    <Td isNumeric>{lastActivity}</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      ) : (
        <Text textAlign="center" color="gray.500">
          Bu sınıfta henüz öğrenci bulunmuyor
        </Text>
      )}
    </Box>
  );
}

// Ödev Takibi sekmesi bileşeni
function AssignmentsTab({ classId }: { classId: string }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('blue.700', 'gray.800');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Sınıftaki öğrencileri getir
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', classId);

        if (studentsError) throw studentsError;
        setAssignments(studentsData || []);

        // Öğrencilerin çözümlerini getir
        const { data: solutionsData, error: solutionsError } = await supabase
          .from('student_solutions')
          .select('*')
          .eq('class_id', classId)
          .order('date', { ascending: false });

        if (solutionsError) throw solutionsError;
        setAssignments(solutionsData || []);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  if (loading) return <Center><Spinner /></Center>;

  const getStudentSolutions = (studentId: string) => {
    return assignments.filter(solution => solution.student_id === studentId);
  };

  // Toplam çözülen soru sayısını hesapla
  const getTotalSolvedQuestions = (studentId: string) => {
    const studentSolutions = getStudentSolutions(studentId);
    return studentSolutions.reduce((total, solution) => total + solution.solved_questions, 0);
  };

  return (
    <Box>
      <Heading size="md" mb={4}>Ödev Takibi</Heading>
      
      {assignments.length > 0 ? (
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Öğrenci</Th>
                <Th isNumeric>Toplam Çözülen</Th>
                <Th>Son Yükleme</Th>
                <Th>Durum</Th>
              </Tr>
            </Thead>
            <Tbody>
              {assignments.map((student) => {
                const studentSolutions = getStudentSolutions(student.student_id);
                const totalSolved = getTotalSolvedQuestions(student.student_id);
                const lastUpload = studentSolutions.length > 0 
                  ? new Date(studentSolutions[0].date).toLocaleDateString('tr-TR')
                  : '-';
                
                // Durumu belirle
                let status = 'Pasif';
                let statusColor = 'gray';
                
                if (studentSolutions.length > 0) {
                  const lastDate = new Date(studentSolutions[0].date);
                  const today = new Date();
                  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (diffDays <= 7) {
                    status = 'Aktif';
                    statusColor = 'green';
                  } else if (diffDays <= 14) {
                    status = 'İyi';
                    statusColor = 'blue';
                  } else if (diffDays <= 30) {
                    status = 'Orta';
                    statusColor = 'orange';
                  } else {
                    status = 'Pasif';
                    statusColor = 'red';
                  }
                }
                
                return (
                  <Tr key={student.student_id}>
                    <Td>
                      <Flex align="center">
                        <Avatar 
                          size="sm" 
                          name={student.name} 
                          src={student.photo_url || undefined} 
                          mr={2}
                        />
                        {student.name}
                      </Flex>
                    </Td>
                    <Td isNumeric>{totalSolved}</Td>
                    <Td>{lastUpload}</Td>
                    <Td>
                      <Badge colorScheme={statusColor}>{status}</Badge>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      ) : (
        <Text textAlign="center" color="gray.500">
          Bu sınıfta henüz öğrenci bulunmuyor
        </Text>
      )}
    </Box>
  );
}

// Performans Takibi sekmesi bileşeni
function PerformanceTab({ classId }: { classId: string }) {
  const [solutions, setSolutions] = useState<StudentSolution[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('blue.700', 'gray.800');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', classId);

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);

        const { data: solutionsData, error: solutionsError } = await supabase
          .from('student_solutions')
          .select('*')
          .eq('class_id', classId)
          .order('date', { ascending: false });

        if (solutionsError) throw solutionsError;
        setSolutions(solutionsData || []);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  if (loading) return <Center><Spinner /></Center>;

  const getStudentSolutions = (studentId: string) => {
    return solutions.filter(solution => solution.student_id === studentId);
  };

  // Toplam çözülen soru sayısını hesapla
  const getTotalSolvedQuestions = (studentId: string) => {
    const studentSolutions = getStudentSolutions(studentId);
    return studentSolutions.reduce((total, solution) => total + solution.solved_questions, 0);
  };

  return (
    <Box>
      <Heading size="md" mb={4}>Performans Takibi</Heading>
      
      {solutions.length > 0 ? (
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Öğrenci</Th>
                <Th isNumeric>Toplam Çözülen</Th>
                <Th>Son Yükleme</Th>
                <Th>Durum</Th>
              </Tr>
            </Thead>
            <Tbody>
              {solutions.map((solution) => {
                const studentSolutions = getStudentSolutions(solution.student_id);
                const totalSolved = getTotalSolvedQuestions(solution.student_id);
                const lastUpload = studentSolutions.length > 0 
                  ? new Date(studentSolutions[0].date).toLocaleDateString('tr-TR')
                  : '-';
                
                // Durumu belirle
                let status = 'Pasif';
                let statusColor = 'gray';
                
                if (studentSolutions.length > 0) {
                  const lastDate = new Date(studentSolutions[0].date);
                  const today = new Date();
                  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (diffDays <= 7) {
                    status = 'Aktif';
                    statusColor = 'green';
                  } else if (diffDays <= 14) {
                    status = 'İyi';
                    statusColor = 'blue';
                  } else if (diffDays <= 30) {
                    status = 'Orta';
                    statusColor = 'orange';
                  } else {
                    status = 'Pasif';
                    statusColor = 'red';
                  }
                }
                
                return (
                  <Tr key={solution.id}>
                    <Td>
                      <Flex align="center">
                        <Avatar 
                          size="sm" 
                          name={solution.name} 
                          src={solution.photo_url || undefined} 
                          mr={2}
                        />
                        {solution.name}
                      </Flex>
                    </Td>
                    <Td isNumeric>{totalSolved}</Td>
                    <Td>{lastUpload}</Td>
                    <Td>
                      <Badge colorScheme={statusColor}>{status}</Badge>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      ) : (
        <Text textAlign="center" color="gray.500">
          Henüz çözüm verisi bulunmuyor
        </Text>
      )}
    </Box>
  );
}