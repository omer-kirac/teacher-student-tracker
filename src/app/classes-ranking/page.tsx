'use client';

import { useState, useEffect } from 'react';
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
  Badge,
  Spinner,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  useToast,
  Select,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { ExternalLinkIcon, InfoIcon, StarIcon, TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
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
} from 'recharts';
import React from 'react';
import CustomLoader from '@/components/CustomLoader';

interface ClassRankingResult {
  class_id: string;
  class_name: string;
  student_count: string;
  total_solved_questions: string;
  created_at: string;
}

interface ClassRanking {
  id: string;
  name: string;
  student_count: number;
  total_solved_questions: number;
  average_per_student: number;
  created_at: string;
}

export default function ClassesRankingPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassRanking[]>([]);
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'week'>('all');
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Tema renklerini tanımla
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Sarı tonları için fonksiyon oluştur
  const getYellowBg = (index: number) => {
    return index < 3 ? 
      useColorModeValue(`yellow.${100 - (index * 25)}`, `yellow.${900 - (index * 100)}`) : 
      undefined;
  };
  
  // Verileri getir
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }
        
        await fetchClassRankings(session.user.id, timeRange);
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
  }, [router, toast, timeRange]);
  
  // Sınıf verilerini değiştir
  useEffect(() => {
    prepareChartData();
  }, [classes]);
  
  // Sınıf performans verilerini getir
  const fetchClassRankings = async (teacherId: string, timeFilter: string) => {
    try {
      // SQL sorgusu hazırlama
      let query;
      
      // Zaman filtresine göre RPC fonksiyonlarını kullan
      if (timeFilter === 'week') {
        query = supabase.rpc('get_class_rankings_weekly', { 
          teacher_id_input: teacherId 
        });
      } else if (timeFilter === 'month') {
        query = supabase.rpc('get_class_rankings_monthly', { 
          teacher_id_input: teacherId 
        });
      } else {
        query = supabase.rpc('get_class_rankings_all_time', { 
          teacher_id_input: teacherId 
        });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setClasses([]);
        return;
      }
      
      // Öğrenci başına ortalama hesapla ve verileri düzenle
      const formattedData = data.map((item: ClassRankingResult) => {
        const studentCount = parseInt(item.student_count) || 0;
        const totalQuestions = parseInt(item.total_solved_questions) || 0;
        
        return {
          id: item.class_id,
          name: item.class_name,
          student_count: studentCount,
          total_solved_questions: totalQuestions,
          average_per_student: studentCount > 0 
            ? Math.round(totalQuestions / studentCount) 
            : 0,
          created_at: item.created_at
        };
      });
      
      // Sınıfları toplam soru sayısına göre azalan şekilde sırala
      const sortedClasses = formattedData.sort((a: ClassRanking, b: ClassRanking) => {
        return b.total_solved_questions - a.total_solved_questions;
      });
      
      setClasses(sortedClasses);
    } catch (error: any) {
      console.error('Sınıf sıralaması alınamadı:', error.message);
      toast({
        title: 'Hata',
        description: 'Sınıf sıralaması alınamadı.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Grafik verilerini hazırla
  const prepareChartData = () => {
    // En çok çözüm yapan ilk 10 sınıfı al
    const top10Classes = [...classes]
      .sort((a, b) => b.total_solved_questions - a.total_solved_questions)
      .slice(0, 10);
    
    // Grafik verilerini oluştur
    const chartData = top10Classes.map(cls => ({
      name: cls.name,
      total: cls.total_solved_questions,
      average: cls.average_per_student,
    }));
    
    setChartData(chartData);
  };
  
  // Sınıf detayına git
  const handleClassClick = (classId: string) => {
    router.push(`/classes/${classId}`);
  };
  
  // Zaman aralığını değiştir
  const handleTimeRangeChange = (newRange: 'all' | 'month' | 'week') => {
    setTimeRange(newRange);
  };
  
  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="80vh">
        <CustomLoader />
      </Flex>
    );
  }

  // Sıralamalar ve rozetleri hesapla
  const topClass = classes.length > 0 ? classes[0] : null;
  const topStudentClass = classes.length > 0 
    ? [...classes].sort((a, b) => b.average_per_student - a.average_per_student)[0]
    : null;

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={6} size="xl">Sınıf Performans Sıralaması</Heading>
      
      <FormControl mb={6} maxW="300px">
        <FormLabel>Zaman Aralığı</FormLabel>
        <Select 
          value={timeRange}
          onChange={(e) => handleTimeRangeChange(e.target.value as any)}
        >
          <option value="all">Tüm Zamanlar</option>
          <option value="month">Son 30 Gün</option>
          <option value="week">Son 7 Gün</option>
        </Select>
      </FormControl>
      
      {classes.length === 0 ? (
        <Box p={10} textAlign="center" borderWidth={1} borderRadius="md" bg={bgColor}>
          <InfoIcon boxSize={10} color="blue.400" mb={4} />
          <Heading size="md" mb={2}>Veri Bulunamadı</Heading>
          <Text>Bu zaman aralığı için sınıf performans verisi bulunmamaktadır.</Text>
        </Box>
      ) : (
        <>
          {/* Özet İstatistikler */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
            {topClass && (
              <Stat bg={cardBg} p={5} borderRadius="lg" boxShadow="md" position="relative" borderWidth="1px" borderColor={borderColor}>
                <Box position="absolute" top={3} right={3}>
                  <StarIcon color="yellow.400" boxSize={6} />
                </Box>
                <StatLabel fontSize="lg">En Çok Soru Çözen Sınıf</StatLabel>
                <StatNumber fontSize="2xl" mb={2} color="blue.500">{topClass.name}</StatNumber>
                <Text fontWeight="medium">{topClass.total_solved_questions} soru</Text>
                <Text fontSize="sm" mt={1}>Öğrenci sayısı: {topClass.student_count}</Text>
              </Stat>
            )}
            
            {topStudentClass && (
              <Stat bg={cardBg} p={5} borderRadius="lg" boxShadow="md" position="relative" borderWidth="1px" borderColor={borderColor}>
                <Box position="absolute" top={3} right={3}>
                  <StarIcon color="purple.400" boxSize={6} />
                </Box>
                <StatLabel fontSize="lg">Öğrenci Başına En Yüksek</StatLabel>
                <StatNumber fontSize="2xl" mb={2} color="purple.500">{topStudentClass.name}</StatNumber>
                <Text fontWeight="medium">{topStudentClass.average_per_student} soru/öğrenci</Text>
                <Text fontSize="sm" mt={1}>Toplam: {topStudentClass.total_solved_questions} soru</Text>
              </Stat>
            )}
            
            <Stat bg={cardBg} p={5} borderRadius="lg" boxShadow="md" position="relative" borderWidth="1px" borderColor={borderColor}>
              <StatLabel fontSize="lg">Toplam İstatistikler</StatLabel>
              <StatNumber fontSize="2xl" mb={2} color="green.500">{classes.length}</StatNumber>
              <Text fontWeight="medium">Aktif Sınıf</Text>
              <Text fontSize="sm" mt={1}>
                Toplam: {classes.reduce((sum, cls) => sum + cls.total_solved_questions, 0)} soru
              </Text>
            </Stat>
          </SimpleGrid>
          
          {/* Sınıf Sıralaması Grafiği */}
          <Box 
            bg={cardBg} 
            p={6} 
            borderRadius="lg" 
            boxShadow="md" 
            mb={8}
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Heading size="md" mb={6}>Sınıf Performans Grafiği</Heading>
            
            <Box height="400px">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis domain={[0, 'auto']} allowDataOverflow={false} />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="total" 
                      name="Toplam Çözülen Soru" 
                      fill="#3182CE" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="average" 
                      name="Öğrenci Başına Düşen" 
                      fill="#805AD5" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Flex justify="center" align="center" height="100%">
                  <Box textAlign="center">
                    <InfoIcon boxSize={10} color="gray.400" mb={4} />
                    <Text color="gray.500">Gösterilecek grafik verisi bulunamadı</Text>
                  </Box>
                </Flex>
              )}
            </Box>
          </Box>
          
          {/* Sınıf Sıralaması Tablosu */}
          <Box boxShadow="md" borderRadius="lg" overflow="hidden" bg={bgColor}>
            <Table variant="simple">
              <Thead bg={headerBg}>
                <Tr>
                  <Th w="50px">Sıra</Th>
                  <Th>Sınıf</Th>
                  <Th isNumeric>Öğrenci Sayısı</Th>
                  <Th isNumeric>Toplam Çözülen Soru</Th>
                  <Th isNumeric>Öğrenci Başına</Th>
                </Tr>
              </Thead>
              <Tbody>
                {classes.map((cls, index) => (
                  <Tr 
                    key={cls.id} 
                    _hover={{ 
                      bg: hoverBg, 
                      cursor: 'pointer',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => handleClassClick(cls.id)}
                    bg={getYellowBg(index)}
                  >
                    <Td fontWeight="bold">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && (index + 1)}
                    </Td>
                    <Td fontWeight={index < 3 ? "bold" : "medium"}>
                      <Flex align="center">
                        {cls.name}
                        <ExternalLinkIcon ml={2} color="gray.500" />
                      </Flex>
                    </Td>
                    <Td isNumeric>{cls.student_count}</Td>
                    <Td isNumeric fontWeight="bold">
                      <Badge 
                        colorScheme={
                          cls.total_solved_questions > 1000 ? "green" : 
                          cls.total_solved_questions > 500 ? "blue" : 
                          cls.total_solved_questions > 200 ? "yellow" : "gray"
                        }
                        p={1}
                        px={2}
                        borderRadius="md"
                      >
                        {cls.total_solved_questions}
                      </Badge>
                    </Td>
                    <Td isNumeric>
                      {cls.average_per_student}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </>
      )}
    </Container>
  );
} 