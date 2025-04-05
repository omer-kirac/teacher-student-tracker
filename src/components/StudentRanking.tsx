'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Text,
  Flex,
  Avatar,
  Badge,
  useColorModeValue,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';
import { FiAward } from 'react-icons/fi';
import EmptyStateIllustration from './EmptyStateIllustration';

interface Student {
  id: string;
  name: string;
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

// Renk paleti
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', 
  '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
];

export default function StudentRanking({ students, solutions }: StudentRankingProps) {
  const [showAllTime, setShowAllTime] = useState(false);
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('white', 'gray.800');
  const gold = useColorModeValue('#FFD700', '#FFC107');
  const silver = useColorModeValue('#C0C0C0', '#B0B0B0');
  const bronze = useColorModeValue('#CD7F32', '#D68C45');

  // Öğrenci renklerini belirle
  const studentColors = useMemo(() => {
    const colors: Record<string, string> = {};
    students.forEach((student, index) => {
      colors[student.id] = COLORS[index % COLORS.length];
    });
    return colors;
  }, [students]);

  const calculateSolutionData = useMemo(() => {
    const filterDate = new Date();
    
    if (!showAllTime) {
      // Son 1 ay ve haftalık verileri göster
      const monthlyData = solutions.filter(s => {
        const solutionDate = new Date(s.date);
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        return solutionDate >= monthAgo;
      });

      const weeklyData = solutions.filter(s => {
        const solutionDate = new Date(s.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return solutionDate >= weekAgo;
      });

      // Her öğrenci için verileri hesapla
      const totals: Record<string, any> = {};

      students.forEach(student => {
        const monthlyStudentSolutions = monthlyData.filter(s => s.student_id === student.id);
        const weeklyStudentSolutions = weeklyData.filter(s => s.student_id === student.id);

        const monthlyTotal = monthlyStudentSolutions.reduce((sum, s) => sum + s.solved_questions, 0);
        const weeklyTotal = weeklyStudentSolutions.reduce((sum, s) => sum + s.solved_questions, 0);

        // En iyi günü bul
        let bestDay = null;
        if (monthlyStudentSolutions.length > 0) {
          bestDay = monthlyStudentSolutions.reduce((best, current) => 
            current.solved_questions > (best?.solved_questions || 0) ? current : best
          );
        }

        totals[student.id] = {
          studentId: student.id,
          studentName: student.name,
          total: monthlyTotal,
          lastWeekTotal: weeklyTotal,
          bestDay: bestDay ? {
            date: new Date(bestDay.date).toLocaleDateString('tr-TR'),
            solved: bestDay.solved_questions
          } : null
        };
      });

      return Object.values(totals).sort((a, b) => b.total - a.total);
    } else {
      // Tüm zamanlar için verileri göster
      const totals: Record<string, any> = {};

      students.forEach(student => {
        const studentSolutions = solutions.filter(s => s.student_id === student.id);
        const total = studentSolutions.reduce((sum, s) => sum + s.solved_questions, 0);

        // Son 7 günlük çözümleri hesapla
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekSolutions = studentSolutions.filter(s => new Date(s.date) >= lastWeekStart);
        const lastWeekTotal = lastWeekSolutions.reduce((sum, s) => sum + s.solved_questions, 0);

        // En iyi günü bul
        let bestDay = null;
        if (studentSolutions.length > 0) {
          bestDay = studentSolutions.reduce((best, current) => 
            current.solved_questions > (best?.solved_questions || 0) ? current : best
          );
        }

        totals[student.id] = {
          studentId: student.id,
          studentName: student.name,
          total,
          lastWeekTotal,
          bestDay: bestDay ? {
            date: new Date(bestDay.date).toLocaleDateString('tr-TR'),
            solved: bestDay.solved_questions
          } : null
        };
      });

      return Object.values(totals).sort((a, b) => b.total - a.total);
    }
  }, [students, solutions, showAllTime]);

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

  // Haftanın en iyisi
  const weeklyBest = calculateSolutionData[0];

  return (
    <Box>
      {/* Haftanın En İyisi */}
      <Box 
        p={4} 
        bg="blue.50" 
        borderRadius="lg" 
        mb={6}
        borderWidth="1px"
        borderColor="blue.200"
        cursor="pointer"
        onClick={() => setShowAllTime(!showAllTime)}
        role="button"
        aria-label="Zaman aralığını değiştir"
        _hover={{
          bg: 'blue.100',
          transition: 'all 0.2s'
        }}
      >
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={4}>
            <Avatar
              size="lg"
              name={weeklyBest.studentName}
              src={students.find(s => s.id === weeklyBest.studentId)?.photo_url}
              bg={studentColors[weeklyBest.studentId]}
            />
            <Box>
              <Flex align="center" gap={2}>
                <Text fontSize="lg" fontWeight="bold" color="blue.800">Haftanın En İyisi</Text>
                <Badge colorScheme="blue" fontSize="sm">
                  {showAllTime ? 'Tüm Zamanlar' : 'Son 1 Ay ve Hafta'}
                </Badge>
              </Flex>
              <Text fontSize="xl" fontWeight="bold" mb={1}>{weeklyBest.studentName}</Text>
              <Text color="blue.600">Son 7 günde {weeklyBest.lastWeekTotal} soru çözdü!</Text>
              {weeklyBest.bestDay && (
                <Text fontSize="sm" color="blue.600">
                  En iyi günü: {weeklyBest.bestDay.date} ({weeklyBest.bestDay.solved} soru)
                </Text>
              )}
            </Box>
          </Flex>
          <Text fontSize="3xl">🏆</Text>
        </Flex>
      </Box>

      {/* Sıralama Tablosu */}
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th width="50px">SIRA</Th>
              <Th>ÖĞRENCİ</Th>
              <Th isNumeric>TOPLAM ÇÖZÜLEN</Th>
              <Th isNumeric>SON 7 GÜN</Th>
              <Th isNumeric>EN İYİ GÜN</Th>
            </Tr>
          </Thead>
          <Tbody>
            {calculateSolutionData.map((student, index) => (
              <Tr key={student.studentId}>
                <Td>
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
                <Td>
                  <Flex align="center">
                    <Avatar
                      size="sm"
                      name={student.studentName}
                      src={students.find(s => s.id === student.studentId)?.photo_url}
                      bg={studentColors[student.studentId]}
                      mr={3}
                    />
                    <Text fontWeight="medium">{student.studentName}</Text>
                  </Flex>
                </Td>
                <Td isNumeric fontWeight="bold">{student.total}</Td>
                <Td isNumeric>{student.lastWeekTotal}</Td>
                <Td isNumeric>
                  {student.bestDay ? `${student.bestDay.solved} soru` : '-'}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
} 