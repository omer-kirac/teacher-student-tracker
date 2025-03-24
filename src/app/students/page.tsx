'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Flex,
  Avatar,
  Badge,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Stack,
  HStack,
  Button,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon, TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { supabase } from '@/lib/supabase';

interface Student {
  id: string;
  name: string;
  class_id: string;
  class_name: string;
  created_at: string;
  photo_url?: string;
  total_solved_questions: number;
}

interface ClassInfo {
  id: string;
  name: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({
    key: 'total_solved_questions',
    direction: 'descending',
  });

  // Tema renklerini tanımla
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  
  // Öğretmen ve sınıfları kontrol et
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }
        
        await fetchTeacherClasses(session.user.id);
        await fetchAllStudentsWithStats(session.user.id);
      } catch (error) {
        console.error('Kullanıcı bilgileri alınamadı:', error);
        toast({
          title: 'Hata',
          description: 'Kullanıcı bilgileri alınamadı.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router, toast]);
  
  // Öğretmenin sınıflarını getir
  const fetchTeacherClasses = async (teacherId: string) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', teacherId)
        .order('name');
        
      if (error) throw error;
      
      setClasses(data || []);
    } catch (error: any) {
      console.error('Sınıflar alınamadı:', error.message);
    }
  };
  
  // Tüm öğrencileri ve istatistiklerini getir
  const fetchAllStudentsWithStats = async (teacherId: string) => {
    try {
      // Öğretmenin sınıflarını al
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', teacherId);
        
      if (classesError) throw classesError;
      
      if (!classesData || classesData.length === 0) {
        setStudents([]);
        setFilteredStudents([]);
        return;
      }
      
      const classIds = classesData.map(c => c.id);
      
      // SQL sorgusu hazırlama
      // Bu sorgu öğrencileri, sınıf adlarını ve toplam çözdükleri soru sayısını getirir
      const { data, error } = await supabase
        .rpc('get_all_students_with_stats', { teacher_class_ids: classIds });
        
      if (error) throw error;
      
      const formattedData = data.map((item: any) => ({
        id: item.student_id,
        name: item.student_name,
        class_id: item.class_id,
        class_name: item.class_name,
        created_at: item.created_at,
        photo_url: item.photo_url,
        total_solved_questions: item.total_solved_questions || 0
      }));
      
      setStudents(formattedData);
      setFilteredStudents(formattedData);
      
      // Varsayılan sıralama: çözülen soru sayısına göre azalan
      sortStudents(formattedData, 'total_solved_questions', 'descending');
      
    } catch (error: any) {
      console.error('Öğrenciler alınamadı:', error.message);
      toast({
        title: 'Hata',
        description: 'Öğrenci bilgileri alınamadı.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Öğrencileri sırala
  const sortStudents = useCallback((studentsToSort: Student[], key: string, direction: 'ascending' | 'descending') => {
    const sortedStudents = [...studentsToSort].sort((a, b) => {
      // Sayısal değerler için
      if (key === 'total_solved_questions') {
        return direction === 'ascending'
          ? a.total_solved_questions - b.total_solved_questions
          : b.total_solved_questions - a.total_solved_questions;
      }
      
      // Metinsel değerler için
      const aValue = String(a[key as keyof Student] || '');
      const bValue = String(b[key as keyof Student] || '');
      
      if (aValue < bValue) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredStudents(sortedStudents);
    setSortConfig({ key, direction });
  }, []);
  
  // Sıralama yönünü değiştir
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    sortStudents(filteredStudents, key, direction);
  };
  
  // Sıralama ikonunu getir
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <TriangleUpIcon ml={1} w={3} h={3} /> : <TriangleDownIcon ml={1} w={3} h={3} />;
  };
  
  // Filtreleme işlemi
  useEffect(() => {
    if (students.length === 0) return;
    
    const filterData = () => {
      let result = [...students];
      
      // Sınıfa göre filtrele
      if (selectedClass !== 'all') {
        result = result.filter(student => student.class_id === selectedClass);
      }
      
      // İsme göre filtrele
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        result = result.filter(student => 
          student.name.toLowerCase().includes(search) ||
          student.class_name.toLowerCase().includes(search)
        );
      }
      
      // Filtrelenen sonuçları ayarla (sıralama yapmadan)
      setFilteredStudents(result);
    };
    
    filterData();
  }, [searchTerm, selectedClass, students]);
  
  // Filtrelenmiş öğrencileri sırala
  useEffect(() => {
    if (filteredStudents.length > 0) {
      sortStudents(filteredStudents, sortConfig.key, sortConfig.direction);
    }
  }, [filteredStudents.length, sortConfig.key, sortConfig.direction, sortStudents]);
  
  // Öğrenci detayına git
  const handleStudentClick = (studentId: string, classId: string) => {
    router.push(`/classes/${classId}?student=${studentId}`);
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="calc(100vh - 60px)">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={6} size="xl">Tüm Öğrenciler</Heading>
      
      <Stack direction={{ base: "column", md: "row" }} mb={6} spacing={4}>
        <InputGroup maxW={{ base: "100%", md: "300px" }}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="İsme göre ara"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        
        <Select 
          maxW={{ base: "100%", md: "300px" }}
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="all">Tüm Sınıflar</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </Stack>
      
      {filteredStudents.length === 0 ? (
        <Box p={10} textAlign="center" borderWidth={1} borderRadius="md" bg={bg}>
          <Text mb={4}>Hiç öğrenci bulunamadı.</Text>
        </Box>
      ) : (
        <Box boxShadow="md" borderRadius="lg" overflow="hidden" bg={bg}>
          <Table variant="simple">
            <Thead bg={headerBg}>
              <Tr>
                <Th w="50px">#</Th>
                <Th>Öğrenci</Th>
                <Th 
                  cursor="pointer" 
                  onClick={() => requestSort('class_name')}
                >
                  Sınıf {getSortIcon('class_name')}
                </Th>
                <Th 
                  cursor="pointer" 
                  onClick={() => requestSort('total_solved_questions')}
                  isNumeric
                >
                  Çözülen Soru {getSortIcon('total_solved_questions')}
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredStudents.map((student, index) => (
                <Tr 
                  key={student.id} 
                  _hover={{ bg: useColorModeValue('gray.50', 'gray.700'), cursor: 'pointer' }}
                  onClick={() => handleStudentClick(student.id, student.class_id)}
                >
                  <Td fontWeight="bold">{index + 1}</Td>
                  <Td>
                    <Flex align="center">
                      <Avatar 
                        size="sm" 
                        name={student.name} 
                        src={student.photo_url} 
                        mr={3} 
                      />
                      <Text fontWeight="medium">{student.name}</Text>
                    </Flex>
                  </Td>
                  <Td>{student.class_name}</Td>
                  <Td isNumeric>
                    <Badge 
                      colorScheme={
                        student.total_solved_questions > 500 ? "green" : 
                        student.total_solved_questions > 200 ? "blue" : 
                        student.total_solved_questions > 50 ? "yellow" : "gray"
                      }
                      p={1}
                      borderRadius="md"
                    >
                      {student.total_solved_questions}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Container>
  );
} 