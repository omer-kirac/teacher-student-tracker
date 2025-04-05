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
  BarChart,
  Bar,
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
  useColorModeValue,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Center,
} from '@chakra-ui/react';
import { FiBarChart2, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import EmptyStateIllustration from './EmptyStateIllustration';

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
  hideControls?: boolean;
  chartType?: 'line' | 'area' | 'bar';
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

// Define the CustomTooltip component
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  students?: Student[]; // Add students prop
}

const CustomTooltip = ({ active, payload, label, students = [] }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    // Only show students with values > 0
    const nonZeroEntries = payload.filter((entry: any) => (entry.value as number) > 0);
    const chartBg = useColorModeValue('white', 'gray.800');
    
    return (
      <Box 
        bg={chartBg}
        p={3} 
        borderRadius="md" 
        boxShadow="md"
        border="1px solid"
        borderColor="gray.200"
        minWidth="200px"
      >
        <Text fontWeight="bold" mb={2}>{label}</Text>
        {nonZeroEntries.map((entry: any, index: number) => {
          const studentId = entry.dataKey as string;
          const student = students.find((s: Student) => s.id === studentId);
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
};

export default function SolutionsChart({ 
  students, 
  solutions, 
  hideControls = false,
  chartType: externalChartType 
}: ChartProps) {
  const [timeFrame, setTimeFrame] = useState<'all' | '30days' | '7days'>('all');
  const [internalChartType, setInternalChartType] = useState<'line' | 'area' | 'bar'>('line');
  
  // Use external chart type if provided, otherwise use internal state
  const chartType = externalChartType || internalChartType;
  
  // Remove the global window assignment
  // if (typeof window !== 'undefined') {
  //   window.currentStudents = students;
  // }
  
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

  // Use our accessible color hook for better contrast
  const chartBg = useColorModeValue('white', 'gray.800');
  const chartBorder = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const gridColor = useColorModeValue('#eee', '#444');
  
  // Calculate weekly statistics
  const weeklyStats = useMemo(() => {
    return students.map(student => {
      const studentSolutions = solutions.filter(s => s.student_id === student.id);
      
      // Get total of all solutions
      const total = studentSolutions.reduce((sum, s) => sum + s.solved_questions, 0);
      
      // Calculate current week solutions
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);
      const thisWeekSolutions = studentSolutions.filter(s => new Date(s.date) >= thisWeekStart);
      const weeklyTotal = thisWeekSolutions.reduce((sum, s) => sum + s.solved_questions, 0);
      
      // Calculate previous week solutions for comparison
      const prevWeekStart = new Date(thisWeekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      const prevWeekSolutions = studentSolutions.filter(s => {
        const date = new Date(s.date);
        return date >= prevWeekStart && date < thisWeekStart;
      });
      const prevWeekTotal = prevWeekSolutions.reduce((sum, s) => sum + s.solved_questions, 0);
      
      // Calculate change percentage
      let changePercentage = 0;
      if (prevWeekTotal > 0) {
        changePercentage = Math.round(((weeklyTotal - prevWeekTotal) / prevWeekTotal) * 100);
      } else if (weeklyTotal > 0) {
        changePercentage = 100; // If previous week was 0, it's a 100% increase
      }
      
      return {
        studentId: student.id,
        studentName: student.name,
        total,
        weeklyTotal,
        prevWeekTotal,
        changePercentage,
        average: averages[student.id] || 0
      };
    }).sort((a, b) => b.weeklyTotal - a.weeklyTotal); // Sort by weekly total
  }, [students, solutions, averages]);

  if (students.length === 0 || solutions.length === 0) {
    return (
      <EmptyStateIllustration
        title="Henüz veri bulunmuyor"
        message="Öğrencilerin çözdüğü soruları kaydedin"
        icon={<Icon as={FiBarChart2} boxSize={8} />}
        type="solution"
      />
    );
  }

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      bg={chartBg}
      borderColor={chartBorder}
      height="500px"
      display="flex"
      flexDirection="column"
    >
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md" color={textColor}>Çözüm Grafiği</Heading>
        {!hideControls && (
          <Flex gap={4}>
            <Select 
              value={timeFrame} 
              onChange={(e) => setTimeFrame(e.target.value as any)}
              width="160px"
              borderColor={chartBorder}
              _hover={{ borderColor: 'blue.400' }}
              transition="all 0.2s"
            >
              <option value="all">Tüm Zamanlar</option>
              <option value="30days">Son 30 Gün</option>
              <option value="7days">Son 7 Gün</option>
            </Select>
            
            <ButtonGroup size="sm" isAttached variant="outline">
              <Button
                colorScheme={chartType === 'line' ? 'blue' : 'gray'}
                onClick={() => setInternalChartType('line')}
                _hover={{ transform: 'translateY(-1px)' }}
                transition="all 0.2s"
              >
                Çizgi
              </Button>
              <Button
                colorScheme={chartType === 'area' ? 'blue' : 'gray'}
                onClick={() => setInternalChartType('area')}
                _hover={{ transform: 'translateY(-1px)' }}
                transition="all 0.2s"
              >
                Alan
              </Button>
              <Button
                colorScheme={chartType === 'bar' ? 'blue' : 'gray'}
                onClick={() => setInternalChartType('bar')}
                _hover={{ transform: 'translateY(-1px)' }}
                transition="all 0.2s"
              >
                Sütun
              </Button>
            </ButtonGroup>
          </Flex>
        )}
      </Flex>
      
      <Box flex="1">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: textColor }}
                tickMargin={10}
                stroke={chartBorder}
              />
              <YAxis 
                tick={{ fill: textColor }}
                tickMargin={10}
                domain={[0, 'auto']}
                allowDataOverflow={false}
                stroke={chartBorder}
              />
              <Tooltip content={<CustomTooltip students={students} />} />
              <Legend content={<CustomLegend students={students} studentColors={studentColors} />} height={60} />
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
          ) : chartType === 'area' ? (
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: textColor }}
                tickMargin={10}
                stroke={chartBorder}
              />
              <YAxis 
                tick={{ fill: textColor }}
                tickMargin={10}
                domain={[0, 'auto']}
                allowDataOverflow={false}
                stroke={chartBorder}
              />
              <Tooltip content={<CustomTooltip students={students} />} />
              <Legend content={<CustomLegend students={students} studentColors={studentColors} />} height={60} />
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
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: textColor }}
                tickMargin={10}
                stroke={chartBorder}
              />
              <YAxis 
                tick={{ fill: textColor }}
                tickMargin={10}
                domain={[0, 'auto']}
                allowDataOverflow={false}
                stroke={chartBorder}
              />
              <Tooltip content={<CustomTooltip students={students} />} />
              <Legend content={<CustomLegend students={students} studentColors={studentColors} />} height={60} />
              {students.map((student) => (
                <Bar
                  key={student.id}
                  dataKey={student.id}
                  fill={studentColors[student.id]}
                  name={student.id}
                  radius={[2, 2, 0, 0]}
                  stackId={student.id}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </Box>
      
      {/* Weekly Stats Section */}
      <Box
        mt={8}
        borderTopWidth="1px"
        borderColor={chartBorder}
        pt={6}
      >
        <Heading size="md" mb={4} color={textColor}>Haftalık İstatistikler</Heading>
        <Flex wrap="wrap" gap={4} justifyContent="space-between">
          {weeklyStats.slice(0, 4).map((stat, index) => (
            <Flex 
              key={stat.studentId}
              borderWidth="1px" 
              borderRadius="lg" 
              p={3} 
              borderColor={chartBorder}
              bg={chartBg}
              align="center"
              minWidth="220px"
              flex="1"
              _hover={{ 
                transform: 'translateY(-2px)', 
                boxShadow: 'sm', 
                borderColor: studentColors[stat.studentId]
              }}
              transition="all 0.2s"
            >
              <Avatar 
                size="md" 
                name={stat.studentName} 
                src={students.find(s => s.id === stat.studentId)?.photo_url}
                bg={studentColors[stat.studentId]}
                mr={3}
              />
              <Box>
                <Text fontWeight="bold" fontSize="sm" isTruncated mb={1}>{stat.studentName}</Text>
                <Text fontSize="sm" color="gray.500">Son 7 gün: <Text as="span" fontWeight="bold">{stat.weeklyTotal}</Text> soru</Text>
                {stat.changePercentage > 0 ? (
                  <Text fontSize="xs" color="green.500">
                    <Icon as={FiArrowUp} /> {stat.changePercentage}% artış
                  </Text>
                ) : stat.changePercentage < 0 ? (
                  <Text fontSize="xs" color="red.500">
                    <Icon as={FiArrowDown} /> {Math.abs(stat.changePercentage)}% azalış
                  </Text>
                ) : (
                  <Text fontSize="xs" color="gray.500">
                    Değişim yok
                  </Text>
                )}
              </Box>
            </Flex>
          ))}
        </Flex>
      </Box>
    </Box>
  );
} 