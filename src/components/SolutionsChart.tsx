'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';
import { 
  Box, 
  Text, 
  Heading, 
  Select, 
  Flex, 
  Badge, 
  ButtonGroup, 
  Button, 
  Avatar, 
  HStack,
  useColorModeValue
} from '@chakra-ui/react';

interface Student {
  id: string;
  name: string;
  created_at: string;
  photo_url?: string; // Fotoğraf URL'i eklendi
}

interface Solution {
  id: string;
  student_id: string;
  date: string;
  solved_questions: number;
}

interface ChartProps {
  students: Student[];
  solutions: Solution[];
}

// Tutarlı renk oluşturur - her öğrenci için benzersiz ama tutarlı renk
const generateConsistentColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
};

// Renk paletinden renk seçer - daha estetik renkler
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', 
  '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
];

// Özel legend 
const CustomLegend = ({ payload, students, studentColors }: any) => {
  return (
    <Flex justify="center" flexWrap="wrap" gap={4} py={3}>
      {payload.map((entry: any, index: number) => {
        const studentId = entry.value;
        const student = students.find((s: Student) => s.id === studentId);
        if (!student) return null;
        
        return (
          <Flex 
            key={`legend-${index}`} 
            align="center" 
            borderWidth={1}
            borderRadius="md"
            px={3}
            py={1}
            borderColor={entry.color}
            _hover={{ bg: 'gray.50' }}
          >
            <Avatar 
              size="xs" 
              name={student.name}
              src={student.photo_url}
              bg={entry.color}
              color="white"
              mr={2}
            />
            <Text fontSize="sm" fontWeight="medium">{student.name}</Text>
          </Flex>
        );
      })}
    </Flex>
  );
};

export default function SolutionsChart({ students, solutions }: ChartProps) {
  const [timeFrame, setTimeFrame] = useState<'all' | '30days' | '7days'>('all');
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  
  // Grafiği oluşturmak için veriyi hazırla
  const chartData = useMemo(() => {
    // Zaman dilimi filtreleme
    const filterDate = new Date();
    if (timeFrame === '30days') {
      filterDate.setDate(filterDate.getDate() - 30);
    } else if (timeFrame === '7days') {
      filterDate.setDate(filterDate.getDate() - 7);
    } else {
      // 'all' durumunda tüm zamanları göster, çok eski bir tarih ata
      filterDate.setFullYear(2000);
    }
    
    // Tarihe göre filtrele
    const filteredSolutions = solutions.filter(s => {
      const solutionDate = new Date(s.date);
      return solutionDate >= filterDate;
    });
    
    // Tüm benzersiz tarihleri bul ve sırala
    const allDates = [...new Set(filteredSolutions.map(s => s.date))].sort();
    
    if (allDates.length === 0) {
      return [];
    }
    
    // Her tarih için bir veri noktası oluştur
    return allDates.map(date => {
      const dataPoint: any = { date };
      
      // Her öğrenci için o tarihteki çözüm bilgisini ekle
      students.forEach(student => {
        const solution = filteredSolutions.find(s => 
          s.student_id === student.id && s.date === date
        );
        
        dataPoint[student.id] = solution ? solution.solved_questions : 0;
        dataPoint[`${student.id}_name`] = student.name; // Tooltip için öğrenci adını sakla
      });
      
      return dataPoint;
    });
  }, [students, solutions, timeFrame]);

  // Öğrenci renklerini belirle
  const studentColors = useMemo(() => {
    const colors: Record<string, string> = {};
    students.forEach((student, index) => {
      // Belirli bir renk paleti kullan
      colors[student.id] = COLORS[index % COLORS.length];
    });
    return colors;
  }, [students]);

  // Öğrenciler için ortalama çözüm sayıları
  const averages = useMemo(() => {
    const result: Record<string, number> = {};
    
    students.forEach(student => {
      const studentSolutions = solutions.filter(s => s.student_id === student.id);
      if (studentSolutions.length > 0) {
        const sum = studentSolutions.reduce((acc, sol) => acc + sol.solved_questions, 0);
        result[student.id] = Math.round((sum / studentSolutions.length) * 10) / 10;
      } else {
        result[student.id] = 0;
      }
    });
    
    return result;
  }, [students, solutions]);

  // Legend için tema renkleri
  const legendBg = useColorModeValue('white', 'gray.800');

  if (chartData.length === 0 || students.length === 0) {
    return (
      <Box p={10} textAlign="center" borderWidth={1} borderRadius="md">
        <Text>Henüz çözüm verisi bulunmuyor.</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md">Öğrenci Çözüm Grafiği</Heading>
        <Flex gap={4}>
          <Select 
            value={timeFrame} 
            onChange={(e) => setTimeFrame(e.target.value as any)}
            width="160px"
          >
            <option value="all">Tüm Zamanlar</option>
            <option value="30days">Son 30 Gün</option>
            <option value="7days">Son 7 Gün</option>
          </Select>
          
          <ButtonGroup size="sm" isAttached variant="outline">
            <Button
              colorScheme={chartType === 'line' ? 'blue' : 'gray'}
              onClick={() => setChartType('line')}
            >
              Çizgi
            </Button>
            <Button
              colorScheme={chartType === 'area' ? 'blue' : 'gray'}
              onClick={() => setChartType('area')}
            >
              Alan
            </Button>
          </ButtonGroup>
        </Flex>
      </Flex>
      
      <Box height="400px" mb={6}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#666' }}
                tickMargin={10}
              />
              <YAxis 
                tick={{ fill: '#666' }}
                tickMargin={10}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    // Sadece değeri 0'dan büyük olan öğrencileri göster
                    const nonZeroEntries = payload.filter(entry => (entry.value as number) > 0);
                    
                    return (
                      <Box 
                        bg={legendBg}
                        p={3} 
                        borderRadius="md" 
                        boxShadow="md"
                        border="1px solid"
                        borderColor="gray.200"
                        minWidth="200px"
                      >
                        <Text fontWeight="bold" mb={2}>{label}</Text>
                        {nonZeroEntries.map((entry, index) => {
                          const studentId = entry.dataKey as string;
                          const student = students.find(s => s.id === studentId);
                          if (!student) return null;
                          
                          return (
                            <Flex 
                              key={index} 
                              align="center" 
                              mb={index < nonZeroEntries.length - 1 ? 2 : 0}
                            >
                              <Avatar 
                                size="xs" 
                                name={student.name}
                                src={student.photo_url}
                                bg={entry.color as string}
                                mr={2}
                              />
                              <Text color={entry.color as string}>
                                {student.name}: <strong>{entry.value} soru</strong>
                              </Text>
                            </Flex>
                          );
                        })}
                      </Box>
                    );
                  }
                  
                  return null;
                }}
              />
              <Legend 
                content={<CustomLegend students={students} studentColors={studentColors} />}
                height={60}
              />
              {students.map((student) => (
                <Line
                  key={student.id}
                  type="monotone"
                  dataKey={student.id}
                  stroke={studentColors[student.id]}
                  strokeWidth={3}
                  dot={{ r: 5, strokeWidth: 2 }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                  name={student.id}
                />
              ))}
              
              {/* Öğrencilerin ortalama değerlerini göster */}
              {students.map((student) => 
                averages[student.id] > 0 && (
                  <ReferenceLine 
                    key={`avg-${student.id}`}
                    y={averages[student.id]} 
                    stroke={studentColors[student.id]}
                    strokeDasharray="3 3"
                    strokeWidth={2}
                    isFront={false}
                  />
                )
              )}
            </LineChart>
          ) : (
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#666' }}
                tickMargin={10}
              />
              <YAxis 
                tick={{ fill: '#666' }}
                tickMargin={10}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    // Sadece değeri 0'dan büyük olan öğrencileri göster
                    const nonZeroEntries = payload.filter(entry => (entry.value as number) > 0);
                    
                    return (
                      <Box 
                        bg={legendBg}
                        p={3} 
                        borderRadius="md" 
                        boxShadow="md"
                        border="1px solid"
                        borderColor="gray.200"
                        minWidth="200px"
                      >
                        <Text fontWeight="bold" mb={2}>{label}</Text>
                        {nonZeroEntries.map((entry, index) => {
                          const studentId = entry.dataKey as string;
                          const student = students.find(s => s.id === studentId);
                          if (!student) return null;
                          
                          return (
                            <Flex 
                              key={index} 
                              align="center" 
                              mb={index < nonZeroEntries.length - 1 ? 2 : 0}
                            >
                              <Avatar 
                                size="xs" 
                                name={student.name}
                                src={student.photo_url}
                                bg={entry.color as string}
                                mr={2}
                              />
                              <Text color={entry.color as string}>
                                {student.name}: <strong>{entry.value} soru</strong>
                              </Text>
                            </Flex>
                          );
                        })}
                      </Box>
                    );
                  }
                  
                  return null;
                }}
              />
              <Legend 
                content={<CustomLegend students={students} studentColors={studentColors} />}
                height={60}
              />
              {students.map((student) => (
                <Area
                  key={student.id}
                  type="monotone"
                  dataKey={student.id}
                  stroke={studentColors[student.id]}
                  fill={studentColors[student.id]}
                  fillOpacity={0.2}
                  strokeWidth={2}
                  name={student.id}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </Box>
      
      {/* Öğrenci bazlı özet bilgiler */}
      <Flex gap={4} flexWrap="wrap" justify="center">
        {students.map(student => {
          const studentSolutions = solutions.filter(s => s.student_id === student.id);
          const total = studentSolutions.reduce((sum, s) => sum + s.solved_questions, 0);
          const lastWeekSolutions = studentSolutions.filter(s => {
            const date = new Date(s.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return date >= weekAgo;
          });
          const lastWeekTotal = lastWeekSolutions.reduce((sum, s) => sum + s.solved_questions, 0);
          
          return (
            <Box 
              key={student.id} 
              borderWidth={1} 
              borderRadius="md" 
              p={3}
              borderColor={studentColors[student.id]}
              boxShadow="sm"
              width="200px"
            >
              <Flex justify="space-between" align="center" mb={2}>
                <HStack>
                  <Avatar 
                    size="sm" 
                    name={student.name} 
                    src={student.photo_url}
                    bg={studentColors[student.id]}
                  />
                  <Text fontWeight="bold">{student.name}</Text>
                </HStack>
                <Badge 
                  colorScheme={lastWeekTotal > 0 ? "green" : "gray"}
                  borderRadius="full"
                  px={2}
                >
                  {lastWeekTotal > 0 ? "Aktif" : "Pasif"}
                </Badge>
              </Flex>
              <Text>Toplam: <strong>{total}</strong> soru</Text>
              <Text>Ortalama: <strong>{averages[student.id]}</strong> soru/gün</Text>
              <Text>Son Hafta: <strong>{lastWeekTotal}</strong> soru</Text>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
} 