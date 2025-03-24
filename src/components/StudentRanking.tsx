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
  Center,
  Icon,
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
import { FiArrowUp, FiArrowDown, FiAward } from 'react-icons/fi';
import EmptyStateIllustration from './EmptyStateIllustration';

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
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBgColor = useColorModeValue('blue.50', 'blue.900');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  
  const gold = useColorModeValue('#FFD700', '#FFC107');
  const silver = useColorModeValue('#C0C0C0', '#B0B0B0');
  const bronze = useColorModeValue('#CD7F32', '#D68C45');
  
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
      changePercentage: number,
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
      
      // Değişim yüzdesi
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const prevWeekSolutions = studentSolutions.filter(s => {
        const solutionDate = new Date(s.date);
        return solutionDate >= twoWeeksAgo && solutionDate < oneWeekAgo;
      });
      
      const prevWeekTotal = prevWeekSolutions.reduce((sum, s) => sum + s.solved_questions, 0);
      
      // Değişim yüzdesini hesapla
      let changePercentage = 0;
      if (prevWeekTotal > 0) {
        changePercentage = Math.round(((lastWeekTotal - prevWeekTotal) / prevWeekTotal) * 100);
      } else if (lastWeekTotal > 0) {
        changePercentage = 100; // Eğer önceki hafta 0 ise, %100 artış
      }
      
      // Rastgele bir rank değişimi (gerçek uygulamada önceki haftadan bu haftaya değişim hesaplanabilir)
      const rankChange = lastWeekTotal > 0 ? Math.floor(Math.random() * 5) - 2 : 0;
      
      totals[student.id] = {
        studentId: student.id,
        studentName: student.name,
        total,
        lastWeekTotal,
        rankChange,
        changePercentage,
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
    return calculateSolutionData.map((student, index) => ({
      id: student.studentId,
      name: student.studentName.length > 10 ? 
        `${student.studentName.substring(0, 10)}...` : 
        student.studentName,
      fullName: student.studentName,
      total: student.total,
      color: COLORS[index % COLORS.length] // Add color property to each student
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
      <EmptyStateIllustration
        title="Henüz veri bulunmuyor"
        message="Öğrencilerin çözdüğü soruları ekleyin"
        icon={<Icon as={FiAward} boxSize={8} />}
        type="student"
      />
    );
  }

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} bg={tableBgColor} borderColor={borderColor}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md" color={textColor}>Öğrenci Sıralaması</Heading>
        <Select 
          value={timeFrame} 
          onChange={(e) => setTimeFrame(e.target.value as any)}
          width="160px"
          borderColor={borderColor}
          _hover={{ borderColor: 'blue.400' }}
          transition="all 0.2s"
        >
          <option value="all">Tüm Zamanlar</option>
          <option value="month">Bu Ay</option>
          <option value="week">Bu Hafta</option>
        </Select>
      </Flex>
      
      <Tabs variant="enclosed" mb={6}>
        <TabList>
          <Tab _selected={{ color: 'blue.500', borderColor: 'blue.500' }}>Sıralama Tablosu</Tab>
          <Tab _selected={{ color: 'blue.500', borderColor: 'blue.500' }}>Grafik Görünümü</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0} pt={4}>
            {/* Haftanın en iyisi */}
            {weeklyBest && weeklyBest.lastWeekTotal > 0 && (
              <Box 
                mb={6} 
                p={4} 
                borderWidth={1} 
                borderRadius="lg" 
                bg={useColorModeValue('blue.50', 'blue.900')}
                borderColor={useColorModeValue('blue.200', 'blue.700')}
                _hover={{ 
                  transform: 'translateY(-3px)', 
                  boxShadow: 'md',
                  borderColor: useColorModeValue('blue.300', 'blue.500') 
                }}
                transition="all 0.3s"
              >
                <Flex justify="space-between" align="center">
                  <Box>
                    <Heading size="sm" color={useColorModeValue('blue.700', 'blue.300')}>Haftanın En İyisi</Heading>
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
                  <Badge 
                    bg={useColorModeValue('yellow.100', 'yellow.800')} 
                    color={useColorModeValue('yellow.800', 'yellow.100')} 
                    p={2} 
                    fontSize="xl" 
                    borderRadius="full"
                  >
                    🏆
                  </Badge>
                </Flex>
              </Box>
            )}
            
            {/* Sıralama tablosu */}
            <Box 
              borderWidth={1} 
              borderRadius="lg" 
              overflow="hidden"
              borderColor={borderColor}
              _hover={{ boxShadow: 'sm' }}
              transition="all 0.3s"
            >
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
                      bg={index === 0 ? useColorModeValue("yellow.50", "yellow.900") : 
                         index === 1 ? useColorModeValue("gray.50", "gray.800") : 
                         index === 2 ? useColorModeValue("orange.50", "orange.900") : "transparent"}
                      _hover={{ 
                        bg: hoverBgColor,
                        transform: 'scale(1.01)',
                        transition: 'all 0.2s'
                      }}
                      transition="background 0.2s"
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
                        <Center>
                          {student.changePercentage > 0 ? (
                            <Badge colorScheme="green" px={2} py={1} borderRadius="full">
                              <Flex align="center">
                                <Icon as={FiArrowUp} mr={1} />
                                {student.changePercentage}%
                              </Flex>
                            </Badge>
                          ) : student.changePercentage < 0 ? (
                            <Badge colorScheme="red" px={2} py={1} borderRadius="full">
                              <Flex align="center">
                                <Icon as={FiArrowDown} mr={1} />
                                {Math.abs(student.changePercentage)}%
                              </Flex>
                            </Badge>
                          ) : (
                            <Badge colorScheme="gray" px={2} py={1} borderRadius="full">
                              Değişim yok
                            </Badge>
                          )}
                        </Center>
                      </Td>
                      <Td>
                        {student.bestDay ? (
                          <Flex align="center">
                            <Badge colorScheme="blue" mr={2}>
                              {new Date(student.bestDay.date).toLocaleDateString()}
                            </Badge>
                            <Text fontWeight="semibold">{student.bestDay.count} soru</Text>
                          </Flex>
                        ) : (
                          <Text color="gray.500">-</Text>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>
          
          <TabPanel>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={useColorModeValue('#eee', '#444')} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  tick={{ fill: textColor }}
                  stroke={borderColor}
                />
                <YAxis 
                  tick={{ fill: textColor }}
                  stroke={borderColor}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="value" minPointSize={3}>
                  {barChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                    />
                  ))}
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    fill={textColor}
                    style={{ fontWeight: 'bold' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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