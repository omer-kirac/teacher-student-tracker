'use client';

import { useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Select,
  Badge,
} from '@chakra-ui/react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface Student {
  id: string;
  name: string;
  created_at: string;
}

interface Solution {
  id: string;
  student_id: string;
  date: string;
  solved_questions: number;
}

interface StudentStatsProps {
  students: Student[];
  solutions: Solution[];
}

// Renk paleti
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function StudentStats({ students, solutions }: StudentStatsProps) {
  // Toplam çözüm sayıları
  const totalSolutionsByStudent = useMemo(() => {
    const totals: Record<string, number> = {};
    
    students.forEach(student => {
      totals[student.id] = solutions
        .filter(s => s.student_id === student.id)
        .reduce((sum, s) => sum + s.solved_questions, 0);
    });
    
    return totals;
  }, [students, solutions]);

  // Öğrenci başına ortalama çözüm sayısı
  const averageSolutionsByStudent = useMemo(() => {
    const averages: Record<string, number> = {};
    
    students.forEach(student => {
      const studentSolutions = solutions.filter(s => s.student_id === student.id);
      
      if (studentSolutions.length > 0) {
        const total = studentSolutions.reduce((sum, s) => sum + s.solved_questions, 0);
        averages[student.id] = Math.round((total / studentSolutions.length) * 10) / 10;
      } else {
        averages[student.id] = 0;
      }
    });
    
    return averages;
  }, [students, solutions]);

  // Son 7 günün trendi (öğrenci başına)
  const weeklyTrend = useMemo(() => {
    const trends: Record<string, number> = {};
    
    students.forEach(student => {
      const studentSolutions = solutions.filter(s => s.student_id === student.id);
      
      if (studentSolutions.length >= 2) {
        // Tarihe göre sırala
        const sortedSolutions = [...studentSolutions].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        // Son iki ölçümü al
        const lastIndex = sortedSolutions.length - 1;
        const lastValue = sortedSolutions[lastIndex].solved_questions;
        const prevValue = sortedSolutions[lastIndex - 1].solved_questions;
        
        // Değişim yüzdesi hesapla
        if (prevValue > 0) {
          trends[student.id] = Math.round(((lastValue - prevValue) / prevValue) * 100);
        } else {
          trends[student.id] = lastValue > 0 ? 100 : 0;
        }
      } else {
        trends[student.id] = 0;
      }
    });
    
    return trends;
  }, [students, solutions]);

  // Pasta grafik için veri
  const pieChartData = useMemo(() => {
    return students.map(student => ({
      name: student.name,
      value: totalSolutionsByStudent[student.id] || 0,
      id: student.id
    })).filter(item => item.value > 0);
  }, [students, totalSolutionsByStudent]);

  // Bar grafik için veri
  const barChartData = useMemo(() => {
    return students.map(student => ({
      name: student.name,
      total: totalSolutionsByStudent[student.id] || 0,
      average: averageSolutionsByStudent[student.id] || 0,
      id: student.id
    }));
  }, [students, totalSolutionsByStudent, averageSolutionsByStudent]);

  // Son 30 gündeki aktivite istiği
  const last30DaysActivity = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const activityCount: Record<string, number> = {};
    
    students.forEach(student => {
      const recentSolutions = solutions.filter(s => {
        const solutionDate = new Date(s.date);
        return s.student_id === student.id && 
               solutionDate >= thirtyDaysAgo && 
               solutionDate <= today;
      });
      
      activityCount[student.id] = recentSolutions.length;
    });
    
    return activityCount;
  }, [students, solutions]);

  if (students.length === 0 || solutions.length === 0) {
    return (
      <Box p={10} textAlign="center" borderWidth={1} borderRadius="md">
        <Text>Henüz yeterli veri bulunmuyor.</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="md" mb={6}>Öğrenci Performans İstatistikleri</Heading>
      
      {/* Özet istatistikler */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Stat p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
          <StatLabel>Toplam Çözülen Soru</StatLabel>
          <StatNumber>
            {Object.values(totalSolutionsByStudent).reduce((sum, val) => sum + val, 0)}
          </StatNumber>
          <StatHelpText>tüm öğrenciler</StatHelpText>
        </Stat>
        
        <Stat p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
          <StatLabel>Günlük Ortalama</StatLabel>
          <StatNumber>
            {Math.round(Object.values(averageSolutionsByStudent).reduce((sum, val) => sum + val, 0) / 
              (Object.values(averageSolutionsByStudent).length || 1))}
          </StatNumber>
          <StatHelpText>öğrenci başına</StatHelpText>
        </Stat>
        
        <Stat p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
          <StatLabel>En Başarılı Öğrenci</StatLabel>
          <StatNumber>
            {(() => {
              const topStudentId = Object.entries(totalSolutionsByStudent)
                .sort((a, b) => b[1] - a[1])[0]?.[0];
              return topStudentId ? 
                students.find(s => s.id === topStudentId)?.name : 
                'Veri yok';
            })()}
          </StatNumber>
          <StatHelpText>
            toplam {
              Math.max(...Object.values(totalSolutionsByStudent))
            } soru
          </StatHelpText>
        </Stat>
      </SimpleGrid>
      
      {/* Grafikler */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mb={8}>
        {/* Toplam çözüm - pasta grafik */}
        <Box p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
          <Heading size="sm" mb={4}>Toplam Çözüm Dağılımı</Heading>
          <Box height="300px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} soru`, 'Toplam']} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Box>
        
        {/* Toplam ve ortalama - bar grafik */}
        <Box p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
          <Heading size="sm" mb={4}>Toplam vs Ortalama Performans</Heading>
          <Box height="300px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 'auto']} allowDataOverflow={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Toplam Çözülen" fill="#8884d8" />
                <Bar dataKey="average" name="Günlük Ortalama" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </SimpleGrid>
      
      {/* Öğrenci bazlı detaylı istatistikler */}
      <Box p={4} borderWidth={1} borderRadius="md" boxShadow="sm" mb={8}>
        <Heading size="sm" mb={4}>Öğrenci Bazlı Performans</Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {students.map(student => (
            <Box key={student.id} p={3} borderWidth={1} borderRadius="md">
              <Flex justifyContent="space-between" alignItems="center" mb={2}>
                <Heading size="xs">{student.name}</Heading>
                <Badge 
                  colorScheme={
                    last30DaysActivity[student.id] > 15 ? 'green' : 
                    last30DaysActivity[student.id] > 5 ? 'yellow' : 'red'
                  }
                >
                  {last30DaysActivity[student.id]} gün aktif
                </Badge>
              </Flex>
              
              <Stat mt={2}>
                <Flex justifyContent="space-between">
                  <Box>
                    <StatLabel>Toplam</StatLabel>
                    <StatNumber>{totalSolutionsByStudent[student.id] || 0}</StatNumber>
                  </Box>
                  
                  <Box>
                    <StatLabel>Ortalama</StatLabel>
                    <StatNumber>{averageSolutionsByStudent[student.id] || 0}</StatNumber>
                  </Box>
                  
                  <Box>
                    <StatLabel>Trend</StatLabel>
                    <StatNumber>
                      <StatArrow type={weeklyTrend[student.id] >= 0 ? 'increase' : 'decrease'} />
                      {Math.abs(weeklyTrend[student.id] || 0)}%
                    </StatNumber>
                  </Box>
                </Flex>
              </Stat>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
} 