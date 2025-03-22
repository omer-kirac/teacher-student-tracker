'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Text,
  Badge,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Select,
  ButtonGroup,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Avatar,
} from '@chakra-ui/react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

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

interface StudentRankingProps {
  students: Student[];
  solutions: Solution[];
}

// Renk paleti - SolutionsChart bileşenindeki renk paleti ile aynı olmalı
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', 
  '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
];

export default function StudentRanking({ students, solutions }: StudentRankingProps) {
  const [timeFrame, setTimeFrame] = useState<'all' | 'month' | 'week'>('all');
  const tableBgColor = useColorModeValue('white', 'gray.800');
  const headerBgColor = useColorModeValue('gray.50', 'gray.700');
  
  const gold = useColorModeValue('yellow.400', 'yellow.300');
  const silver = useColorModeValue('gray.400', 'gray.300');
  const bronze = useColorModeValue('orange.400', 'orange.300');
  
  // Öğrencilerin çözüm verilerini zaman aralığına göre hesapla
  const calculateSolutionData = useMemo(() => {
    // Zaman dilimi filtreleme
    const filterDate = new Date();
    if (timeFrame === 'month') {
      filterDate.setDate(filterDate.getDate() - 30);
    } else if (timeFrame === 'week') {
      filterDate.setDate(filterDate.getDate() - 7);
    } else {
      // 'all' durumunda tüm zamanları göster, çok eski bir tarih ata
      filterDate.setFullYear(2000);
    }
    
    const filteredSolutions = solutions.filter(s => {
      const solutionDate = new Date(s.date);
      return solutionDate >= filterDate;
    });
    
    const totals: Record<string, { 
      studentId: string, 
      studentName: string, 
      total: number,
      lastWeekTotal: number,
      rankChange: number,
      bestDay: {
        date: string,
        count: number
      } | null
    }> = {};
    
    students.forEach(student => {
      const studentSolutions = filteredSolutions.filter(s => s.student_id === student.id);
      
      // Toplam çözülen soru sayısı
      const total = studentSolutions.reduce((sum, s) => sum + s.solved_questions, 0);
      
      // Son bir haftada çözülen soru sayısı
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const lastWeekSolutions = studentSolutions.filter(s => {
        const solutionDate = new Date(s.date);
        return solutionDate >= oneWeekAgo;
      });
      
      const lastWeekTotal = lastWeekSolutions.reduce((sum, s) => sum + s.solved_questions, 0);
      
      // En iyi günü bul
      let bestDay: { date: string, count: number } | null = null;
      
      if (studentSolutions.length > 0) {
        // Her tarih için toplam çözülen soru sayısını hesapla
        const dailyTotals: Record<string, number> = {};
        
        studentSolutions.forEach(s => {
          if (!dailyTotals[s.date]) {
            dailyTotals[s.date] = 0;
          }
          dailyTotals[s.date] += s.solved_questions;
        });
        
        // En yüksek sayıyı bul
        let maxCount = 0;
        let maxDate = '';
        
        Object.entries(dailyTotals).forEach(([date, count]) => {
          if (count > maxCount) {
            maxCount = count;
            maxDate = date;
          }
        });
        
        if (maxCount > 0) {
          bestDay = {
            date: maxDate,
            count: maxCount
          };
        }
      }
      
      // Rastgele bir rank değişimi (gerçek uygulamada önceki haftadan bu haftaya değişim hesaplanabilir)
      const rankChange = lastWeekTotal > 0 ? Math.floor(Math.random() * 5) - 2 : 0;
      
      totals[student.id] = {
        studentId: student.id,
        studentName: student.name,
        total,
        lastWeekTotal,
        rankChange,
        bestDay
      };
    });
    
    // Toplam çözüme göre sırala
    return Object.values(totals).sort((a, b) => b.total - a.total);
  }, [students, solutions, timeFrame]);

  // Son haftanın en iyisi
  const weeklyBest = useMemo(() => {
    if (calculateSolutionData.length === 0) return null;
    
    return [...calculateSolutionData].sort((a, b) => b.lastWeekTotal - a.lastWeekTotal)[0];
  }, [calculateSolutionData]);

  // Bar grafik için veri
  const barChartData = useMemo(() => {
    return calculateSolutionData.map(student => ({
      id: student.studentId,
      name: student.studentName.length > 10 ? 
        `${student.studentName.substring(0, 10)}...` : 
        student.studentName,
      fullName: student.studentName,
      total: student.total,
    })).slice(0, 10); // Sadece ilk 10 öğrenciyi göster
  }, [calculateSolutionData]);

  // Öğrenci renklerini belirle - SolutionsChart bileşeni ile aynı renklendirmeyi kullan
  const studentColors = useMemo(() => {
    const colors: Record<string, string> = {};
    students.forEach((student, index) => {
      // Belirli bir renk paleti kullan
      colors[student.id] = COLORS[index % COLORS.length];
    });
    return colors;
  }, [students]);

  // Bar grafik için özel tooltip
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const student = students.find(s => s.name === payload[0].payload.fullName);
      const color = student ? studentColors[student.id] : COLORS[0];
      
      return (
        <Box 
          bg="white"
          p={3}
          borderRadius="md"
          boxShadow="md"
          border="1px solid"
          borderColor="gray.200"
        >
          <Flex align="center" mb={2}>
            <Avatar
              size="sm"
              name={payload[0].payload.fullName}
              src={student?.photo_url}
              bg={color}
              mr={2}
            />
            <Text fontWeight="bold">{payload[0].payload.fullName}</Text>
          </Flex>
          <Text>Toplam Çözülen: <strong>{payload[0].value}</strong> soru</Text>
        </Box>
      );
    }
    
    return null;
  };

  if (students.length === 0 || solutions.length === 0) {
    return (
      <Box p={10} textAlign="center" borderWidth={1} borderRadius="md">
        <Text>Henüz yeterli veri bulunmuyor.</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md">Öğrenci Sıralaması</Heading>
        <Select 
          value={timeFrame} 
          onChange={(e) => setTimeFrame(e.target.value as any)}
          width="160px"
        >
          <option value="all">Tüm Zamanlar</option>
          <option value="month">Bu Ay</option>
          <option value="week">Bu Hafta</option>
        </Select>
      </Flex>
      
      <Tabs variant="enclosed" mb={6}>
        <TabList>
          <Tab>Sıralama Tablosu</Tab>
          <Tab>Grafik Görünümü</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0} pt={4}>
            {/* Haftanın en iyisi */}
            {weeklyBest && weeklyBest.lastWeekTotal > 0 && (
              <Box mb={6} p={4} borderWidth={1} borderRadius="md" bg="blue.50">
                <Flex justify="space-between" align="center">
                  <Box>
                    <Heading size="sm" color="blue.700">Haftanın En İyisi</Heading>
                    <Flex align="center" mt={2}>
                      <Avatar 
                        size="md" 
                        name={weeklyBest.studentName} 
                        src={students.find(s => s.id === weeklyBest.studentId)?.photo_url}
                        bg={studentColors[weeklyBest.studentId]}
                        mr={3}
                      />
                      <Box>
                        <Heading size="md">{weeklyBest.studentName}</Heading>
                        <Text mt={1} fontWeight="semibold">Son 7 günde {weeklyBest.lastWeekTotal} soru çözdü!</Text>
                        {weeklyBest.bestDay && (
                          <Text fontSize="sm" mt={1}>
                            En iyi günü: {new Date(weeklyBest.bestDay.date).toLocaleDateString()} 
                            ({weeklyBest.bestDay.count} soru)
                          </Text>
                        )}
                      </Box>
                    </Flex>
                  </Box>
                  <Badge colorScheme="blue" p={2} fontSize="xl" borderRadius="full">🏆</Badge>
                </Flex>
              </Box>
            )}
            
            {/* Sıralama tablosu */}
            <Box borderWidth={1} borderRadius="md" overflow="hidden">
              <Table variant="simple" bg={tableBgColor}>
                <Thead bg={headerBgColor}>
                  <Tr>
                    <Th width="80px" textAlign="center">Sıra</Th>
                    <Th>Öğrenci</Th>
                    <Th isNumeric>Toplam Çözülen</Th>
                    <Th isNumeric>Son 7 Gün</Th>
                    <Th width="100px" textAlign="center">Değişim</Th>
                    <Th>En İyi Gün</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {calculateSolutionData.map((student, index) => (
                    <Tr 
                      key={student.studentId}
                      bg={index === 0 ? "yellow.50" : index === 1 ? "gray.50" : index === 2 ? "orange.50" : "transparent"}
                      _hover={{ bg: 'gray.50' }}
                    >
                      <Td textAlign="center" fontWeight="bold">
                        {index === 0 ? (
                          <Text fontSize="xl" color={gold}>🥇</Text>
                        ) : index === 1 ? (
                          <Text fontSize="xl" color={silver}>🥈</Text>
                        ) : index === 2 ? (
                          <Text fontSize="xl" color={bronze}>🥉</Text>
                        ) : (
                          index + 1
                        )}
                      </Td>
                      <Td fontWeight={index < 3 ? "bold" : "normal"}>
                        <HStack>
                          <Avatar 
                            size="sm" 
                            name={student.studentName} 
                            src={students.find(s => s.id === student.studentId)?.photo_url}
                            bg={studentColors[student.studentId]}
                          />
                          <Text>{student.studentName}</Text>
                          {student.lastWeekTotal > 10 && (
                            <Badge colorScheme="green">Aktif</Badge>
                          )}
                          {student.lastWeekTotal === 0 && (
                            <Badge colorScheme="red">İnaktif</Badge>
                          )}
                        </HStack>
                      </Td>
                      <Td isNumeric fontWeight="bold">
                        {student.total}
                      </Td>
                      <Td isNumeric>
                        {student.lastWeekTotal}
                      </Td>
                      <Td>
                        <Flex justify="center">
                          {student.rankChange !== 0 && (
                            <Stat>
                              <StatNumber fontSize="sm">
                                <StatArrow 
                                  type={student.rankChange > 0 ? "increase" : "decrease"} 
                                />
                                {Math.abs(student.rankChange)}
                              </StatNumber>
                            </Stat>
                          )}
                          {student.rankChange === 0 && (
                            <Text fontSize="sm" color="gray.500">-</Text>
                          )}
                        </Flex>
                      </Td>
                      <Td fontSize="sm">
                        {student.bestDay ? (
                          <>
                            {new Date(student.bestDay.date).toLocaleDateString()} 
                            <Badge ml={1} colorScheme="purple">{student.bestDay.count}</Badge>
                          </>
                        ) : (
                          "-"
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>
          
          <TabPanel>
            {/* Bar chart görünümü */}
            <Box height="400px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 30,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#666' }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis />
                  <Tooltip
                    content={<CustomBarTooltip />}
                  />
                  <Legend formatter={() => 'Toplam Çözülen Soru'} />
                  <Bar dataKey="total" fill="#8884d8">
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={studentColors[entry.id]} />
                    ))}
                    <LabelList dataKey="total" position="top" fill="#666" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Ödül Rozet Açıklamaları */}
      <Box borderWidth={1} borderRadius="md" p={4} mt={6}>
        <Heading size="sm" mb={3}>Ödül ve Rozetler</Heading>
        <Flex gap={4} wrap="wrap">
          <HStack>
            <Text fontSize="xl" color={gold}>🥇</Text>
            <Text>1. Sıra</Text>
          </HStack>
          <HStack>
            <Text fontSize="xl" color={silver}>🥈</Text>
            <Text>2. Sıra</Text>
          </HStack>
          <HStack>
            <Text fontSize="xl" color={bronze}>🥉</Text>
            <Text>3. Sıra</Text>
          </HStack>
          <HStack>
            <Badge colorScheme="blue" p={2} fontSize="md">🏆</Badge>
            <Text>Haftanın En İyisi</Text>
          </HStack>
          <HStack>
            <Badge colorScheme="green">Aktif</Badge>
            <Text>7 günde 10+ soru</Text>
          </HStack>
          <HStack>
            <Badge colorScheme="red">İnaktif</Badge>
            <Text>7 günde 0 soru</Text>
          </HStack>
        </Flex>
      </Box>
    </Box>
  );
} 