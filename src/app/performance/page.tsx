'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Select,
  Spinner,
  useColorModeValue,
  useToast,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import { ChevronDownIcon, InfoIcon } from '@chakra-ui/icons';
import { supabase } from '@/lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import React from 'react';
import CustomLoader from '@/components/CustomLoader';

interface Student {
  id: string;
  name: string;
  class_id: string;
  class_name: string;
}

interface ClassInfo {
  id: string;
  name: string;
}

interface Solution {
  id: string;
  student_id: string;
  date: string;
  solved_questions: number;
}

export default function PerformanceAnalysis() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSolved: 0,
    dailyAverage: 0,
    lastWeekTotal: 0,
    lastWeekChange: 0,
  });
  
  // Tema renklerini tanımla
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const theadBg = useColorModeValue('gray.50', 'gray.700');
  
  // Kullanıcı kontrolü ve verileri getir
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }
        
        await fetchTeacherClasses(session.user.id);
        await fetchStudents(session.user.id);
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
  
  // Sınıf değişiminde öğrenci listesini filtrele
  useEffect(() => {
    if (selectedClass === 'all') {
      setFilteredStudents(students);
    } else {
      setFilteredStudents(students.filter(s => s.class_id === selectedClass));
    }
    
    // Sınıf değiştiğinde seçili öğrenciyi sıfırla
    setSelectedStudent('');
    setSolutions([]);
    setChartData([]);
    setStats({
      totalSolved: 0,
      dailyAverage: 0,
      lastWeekTotal: 0,
      lastWeekChange: 0,
    });
  }, [selectedClass, students]);
  
  // Öğrenci seçildiğinde verileri getir
  useEffect(() => {
    if (selectedStudent) {
      fetchStudentSolutions(selectedStudent);
    }
  }, [selectedStudent]);
  
  // Çözüm verileri değişince grafik verilerini güncelle
  useEffect(() => {
    if (solutions.length > 0) {
      prepareChartData();
      calculateStats();
    }
  }, [solutions]);
  
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
  
  // Öğretmenin öğrencilerini getir
  const fetchStudents = async (teacherId: string) => {
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
      
      // Öğrencileri ve sınıf bilgilerini getir
      const { data, error } = await supabase
        .from('students')
        .select(`
          id, 
          name, 
          class_id,
          classes (
            id,
            name
          )
        `)
        .in('class_id', classIds)
        .order('name');
        
      if (error) throw error;
      
      // Veriyi düzenle
      const formattedData = data.map((student: any) => ({
        id: student.id,
        name: student.name,
        class_id: student.class_id,
        class_name: student.classes.name
      }));
      
      setStudents(formattedData);
      setFilteredStudents(formattedData);
    } catch (error: any) {
      console.error('Öğrenciler alınamadı:', error.message);
    }
  };
  
  // Seçilen öğrencinin çözümlerini getir
  const fetchStudentSolutions = async (studentId: string) => {
    setLoadingStats(true);
    try {
      // Son 30 günlük çözümleri getir
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('student_solutions')
        .select('*')
        .eq('student_id', studentId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date');
        
      if (error) throw error;
      
      setSolutions(data || []);
    } catch (error: any) {
      console.error('Öğrenci çözümleri alınamadı:', error.message);
      toast({
        title: 'Hata',
        description: 'Öğrenci çözümleri alınamadı.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingStats(false);
    }
  };
  
  // Grafik verilerini hazırla
  const prepareChartData = () => {
    // Son 30 gün için tarih aralığı oluştur
    const last30Days: { [key: string]: any } = {};
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last30Days[dateStr] = { date: dateStr, solved_questions: 0 };
    }
    
    // Çözümleri tarih ile eşleştir
    solutions.forEach(solution => {
      if (last30Days[solution.date]) {
        last30Days[solution.date].solved_questions = solution.solved_questions;
      }
    });
    
    // Tarihe göre sırala ve chart veri formatına dönüştür
    const chartData = Object.values(last30Days)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(day => ({
        date: new Date(day.date).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit'
        }),
        solved_questions: day.solved_questions
      }));
    
    setChartData(chartData);
  };
  
  // İstatistikleri hesapla
  const calculateStats = () => {
    const totalSolved = solutions.reduce((sum, s) => sum + s.solved_questions, 0);
    const dailyAverage = solutions.length > 0 ? totalSolved / solutions.length : 0;
    
    // Son 7 günlük verileri hesapla
    const today = new Date();
    const lastWeekStart = new Date();
    lastWeekStart.setDate(today.getDate() - 7);
    
    const prevWeekStart = new Date();
    prevWeekStart.setDate(today.getDate() - 14);
    
    const lastWeekSolutions = solutions.filter(s => {
      const solutionDate = new Date(s.date);
      return solutionDate >= lastWeekStart && solutionDate <= today;
    });
    
    const prevWeekSolutions = solutions.filter(s => {
      const solutionDate = new Date(s.date);
      return solutionDate >= prevWeekStart && solutionDate < lastWeekStart;
    });
    
    const lastWeekTotal = lastWeekSolutions.reduce((sum, s) => sum + s.solved_questions, 0);
    const prevWeekTotal = prevWeekSolutions.reduce((sum, s) => sum + s.solved_questions, 0);
    
    // Değişim yüzdesi
    let lastWeekChange = 0;
    if (prevWeekTotal > 0) {
      lastWeekChange = ((lastWeekTotal - prevWeekTotal) / prevWeekTotal) * 100;
    } else if (lastWeekTotal > 0) {
      lastWeekChange = 100; // Önceki hafta 0, bu hafta pozitif ise %100 artış
    }
    
    setStats({
      totalSolved,
      dailyAverage: parseFloat(dailyAverage.toFixed(1)),
      lastWeekTotal,
      lastWeekChange,
    });
  };
  
  // Öğrenci değiştir
  const handleStudentChange = (studentId: string) => {
    setSelectedStudent(studentId);
  };
  
  // Sınıf değiştir
  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
  };
  
  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="80vh">
        <CustomLoader />
      </Flex>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={6} size="xl">Performans Analizi</Heading>
      
      <Flex direction={{ base: 'column', md: 'row' }} mb={6} gap={4}>
        <Box width={{ base: '100%', md: '50%' }} mb={{ base: 4, md: 0 }}>
          <Text mb={2} fontWeight="medium">Sınıf Seçin</Text>
          <Select 
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
          >
            <option value="all">Tüm Sınıflar</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Box>
        
        <Box width={{ base: '100%', md: '50%' }}>
          <Text mb={2} fontWeight="medium">Öğrenci Seçin</Text>
          <Select 
            value={selectedStudent}
            onChange={(e) => handleStudentChange(e.target.value)}
            placeholder="Öğrenci seçin"
            isDisabled={filteredStudents.length === 0}
          >
            {filteredStudents.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} - {student.class_name}
              </option>
            ))}
          </Select>
        </Box>
      </Flex>
      
      {selectedStudent ? (
        loadingStats ? (
          <Flex justify="center" py={10}>
            <Spinner size="lg" />
          </Flex>
        ) : (
          <>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
              <Stat bg={cardBg} p={4} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
                <StatLabel>Toplam Çözülen Soru</StatLabel>
                <StatNumber>{stats.totalSolved}</StatNumber>
                <StatHelpText>Son 30 gün</StatHelpText>
              </Stat>
              
              <Stat bg={cardBg} p={4} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
                <StatLabel>Günlük Ortalama</StatLabel>
                <StatNumber>{stats.dailyAverage}</StatNumber>
                <StatHelpText>Soru / Gün</StatHelpText>
              </Stat>
              
              <Stat bg={cardBg} p={4} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
                <StatLabel>Son Hafta</StatLabel>
                <StatNumber>{stats.lastWeekTotal}</StatNumber>
                <StatHelpText>
                  <StatArrow type={stats.lastWeekChange >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(stats.lastWeekChange).toFixed(1)}%
                </StatHelpText>
              </Stat>
              
              <Stat bg={cardBg} p={4} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
                <StatLabel>Çözüm Kaydı</StatLabel>
                <StatNumber>{solutions.length}</StatNumber>
                <StatHelpText>Kayıtlı gün sayısı</StatHelpText>
              </Stat>
            </SimpleGrid>
            
            <Box bg={cardBg} p={4} borderRadius="lg" boxShadow="md" borderWidth="1px" borderColor={borderColor} mb={6}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Günlük Çözülen Soru Sayısı</Heading>
                <Menu>
                  <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="sm" variant="outline">
                    Grafik Tipi
                  </MenuButton>
                  <MenuList>
                    <MenuItem>Çizgi Grafik</MenuItem>
                    <MenuItem>Sütun Grafik</MenuItem>
                    <MenuItem>Alan Grafik</MenuItem>
                  </MenuList>
                </Menu>
              </Flex>
              
              <Box height="400px">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 'auto']} allowDataOverflow={false} />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="solved_questions" 
                        name="Çözülen Soru" 
                        stroke="#3182CE" 
                        fill="#3182CE" 
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Flex justify="center" align="center" height="100%">
                    <Box textAlign="center">
                      <InfoIcon boxSize={10} color="gray.400" mb={4} />
                      <Text color="gray.500">Bu öğrenci için çözüm kaydı bulunmamaktadır</Text>
                    </Box>
                  </Flex>
                )}
              </Box>
            </Box>
            
            <Box bg={cardBg} p={4} borderRadius="lg" boxShadow="md" borderWidth="1px" borderColor={borderColor}>
              <Heading size="md" mb={4}>Son Çözümler</Heading>
              
              {solutions.length > 0 ? (
                <Box maxHeight="300px" overflowY="auto">
                  <Box as="table" width="100%" borderWidth="1px" borderRadius="md">
                    <Box as="thead" bg={theadBg}>
                      <Box as="tr">
                        <Box as="th" p={3} textAlign="left">Tarih</Box>
                        <Box as="th" p={3} textAlign="right">Çözülen Soru</Box>
                      </Box>
                    </Box>
                    <Box as="tbody">
                      {[...solutions]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 10)
                        .map((solution) => (
                          <Box as="tr" key={solution.id} borderTopWidth="1px">
                            <Box as="td" p={3}>
                              {new Date(solution.date).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </Box>
                            <Box as="td" p={3} textAlign="right" fontWeight="bold">
                              {solution.solved_questions}
                            </Box>
                          </Box>
                        ))
                      }
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box p={5} textAlign="center" color="gray.500">
                  <Text>Bu öğrenci için çözüm kaydı bulunmamaktadır</Text>
                </Box>
              )}
            </Box>
          </>
        )
      ) : (
        <Box 
          p={10} 
          textAlign="center" 
          borderWidth="1px" 
          borderRadius="lg" 
          bg={cardBg}
          borderColor={borderColor}
        >
          <InfoIcon boxSize={10} color="blue.400" mb={4} />
          <Heading size="md" mb={2}>Öğrenci Seçin</Heading>
          <Text>Performans analizini görüntülemek için bir öğrenci seçin.</Text>
        </Box>
      )}
    </Container>
  );
} 