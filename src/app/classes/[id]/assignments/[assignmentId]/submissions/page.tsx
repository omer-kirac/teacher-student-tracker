'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
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
  Textarea,
  useColorModeValue,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  Avatar,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  Stack
} from '@chakra-ui/react';
import { supabase } from '@/lib/supabase';
import { FaArrowLeft, FaEye, FaCheck, FaTrash } from 'react-icons/fa';
import { Assignment, StudentAssignment, Student, Class } from '@/types';
import CustomLoader from '@/components/CustomLoader';
import ButtonLoader from '@/components/ButtonLoader';

export default function AssignmentSubmissionsPage() {
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<(StudentAssignment & { student: Student })[]>([]);
  const [classData, setClassData] = useState<Class | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentAssignment & { student: Student } | null>(null);
  const [grade, setGrade] = useState(0);
  const [solvedQuestions, setSolvedQuestions] = useState(0);
  const [teacherComment, setTeacherComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;
  const assignmentId = params?.assignmentId as string;
  const toast = useToast();
  
  const { 
    isOpen: isViewModalOpen,
    onOpen: onViewModalOpen,
    onClose: onViewModalClose
  } = useDisclosure();
  
  const { 
    isOpen: isGradeModalOpen,
    onOpen: onGradeModalOpen,
    onClose: onGradeModalClose
  } = useDisclosure();
  
  // Stil ayarları
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

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

        // Öğretmen kontrolü
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', userId)
          .single();

        if (teacherError || !teacherData) {
          router.push('/login');
          return;
        }

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
          router.push(`/classes/${classId}/assignments`);
          return;
        }

        setClassData(classData);

        // Ödev bilgilerini getir
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('assignments')
          .select('*')
          .eq('id', assignmentId)
          .single();

        if (assignmentError || !assignmentData) {
          toast({
            title: 'Hata',
            description: 'Ödev bilgileri yüklenemedi',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          router.push(`/classes/${classId}/assignments`);
          return;
        }

        setAssignment(assignmentData);

        // Sınıftaki öğrencileri getir
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', classId);

        if (studentsError) throw studentsError;
        const students = studentsData || [];

        // Ödev teslimlerini getir
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('student_assignments')
          .select('*')
          .eq('assignment_id', assignmentId);

        if (submissionsError) throw submissionsError;
        
        // Öğrenci ve teslim bilgilerini birleştir
        const submissionsWithStudents = submissionsData.map((submission: StudentAssignment) => {
          const student = students.find(s => s.id === submission.student_id) || {
            id: submission.student_id,
            name: 'Bilinmeyen Öğrenci',
            photo_url: null
          };
          
          return {
            ...submission,
            student
          };
        });

        setSubmissions(submissionsWithStudents);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        toast({
          title: 'Veri yükleme hatası',
          description: 'Ödev teslimleri yüklenirken bir hata oluştu',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    if (classId && assignmentId) {
      fetchData();
    }
  }, [classId, assignmentId, router, toast]);

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      setIsSubmitting(true);
      
      // 1. Ödev teslimini güncelle
      const { error: submissionError } = await supabase
        .from('student_assignments')
        .update({
          grade: solvedQuestions, // Not olarak çözülen soru sayısını kaydediyoruz
          teacher_comment: teacherComment,
          status: 'graded'
        })
        .eq('id', selectedSubmission.id);

      if (submissionError) throw submissionError;
      
      // 2. Öğrenci çözümleri tablosundaki çözülen soru sayısını güncelle (try-catch içinde, hata olursa devam et)
      try {
        // Önce mevcut bir kayıt var mı kontrol et
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formatında bugünün tarihi
        
        const { data: existingSolution, error: checkError } = await supabase
          .from('student_solutions')
          .select('id, solved_questions')
          .eq('student_id', selectedSubmission.student.id)
          .eq('class_id', classId)
          .eq('date', today)
          .maybeSingle();
          
        if (!checkError) { // Sorgu başarılıysa devam et
          if (existingSolution) {
            // Varolan kaydı güncelle
            await supabase
              .from('student_solutions')
              .update({
                solved_questions: existingSolution.solved_questions + solvedQuestions
              })
              .eq('id', existingSolution.id);
          } else {
            // Yeni kayıt oluştur
            await supabase
              .from('student_solutions')
              .insert([{
                student_id: selectedSubmission.student.id,
                class_id: classId,
                date: today,
                solved_questions: solvedQuestions
              }]);
          }
        } else {
          console.error('Student solutions kontrol hatası (göz ardı ediliyor):', checkError);
        }
      } catch (solutionError) {
        // student_solutions işlemleri sırasında hata oluşursa loglayalım ama ana işlemi durdurmayalım
        console.error('Student solutions işlem hatası (göz ardı ediliyor):', solutionError);
      }

      toast({
        title: 'Başarılı',
        description: 'Ödev değerlendirmesi kaydedildi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Listeyi güncelle
      setSubmissions(submissions.map(s => {
        if (s.id === selectedSubmission.id) {
          return {
            ...s,
            grade: solvedQuestions,
            teacher_comment: teacherComment,
            status: 'graded'
          };
        }
        return s;
      }));

      onGradeModalClose();
    } catch (error: any) {
      console.error('Değerlendirme hatası:', error.message);
      toast({
        title: 'Hata',
        description: `Değerlendirme kaydedilemedi: ${error.message}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openViewModal = (submission: StudentAssignment & { student: Student }) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || 0);
    setSolvedQuestions(submission.grade || 0); // Grade değerini çözülen soru sayısı olarak kullanıyoruz
    setTeacherComment(submission.teacher_comment || '');
    onViewModalOpen();
  };

  const openGradeModal = (submission: StudentAssignment & { student: Student }) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || 0);
    setSolvedQuestions(submission.grade || 0); // Grade değerini çözülen soru sayısı olarak kullanıyoruz
    setTeacherComment(submission.teacher_comment || '');
    onGradeModalOpen();
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Belirtilmemiş';
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="80vh">
        <CustomLoader />
      </Flex>
    );
  }

  return (
    <Box px={5} py={5} maxW="1200px" mx="auto">
      <Flex 
        mb={8} 
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'flex-start', md: 'center' }}
        justify="space-between"
      >
        <Box>
          <Heading size="lg" mb={1}>
            Ödev Teslimleri
          </Heading>
          <Text color="gray.600">
            {assignment?.title || 'Ödev'} - {classData?.name || 'Sınıf'}
          </Text>
        </Box>
        <Button 
          leftIcon={<FaArrowLeft />}
          colorScheme="gray"
          onClick={() => router.push(`/classes/${classId}/assignments`)}
          mt={{ base: 4, md: 0 }}
        >
          Ödevlere Dön
        </Button>
      </Flex>

      <Box 
        borderWidth="1px"
        borderRadius="lg"
        bg={cardBg}
        p={6}
        borderColor={borderColor}
        mb={6}
      >
        <Heading size="md" mb={4}>Ödev Detayları</Heading>
        <Stack direction={{ base: 'column', md: 'row' }} spacing={10} mb={6}>
          <Box flex="1">
            <Text fontWeight="bold">Başlık:</Text>
            <Text mb={2}>{assignment?.title}</Text>
            
            <Text fontWeight="bold">Açıklama:</Text>
            <Text mb={2}>{assignment?.description || 'Açıklama yok'}</Text>
          </Box>
          
          <Box flex="1">
            <Text fontWeight="bold">Son Teslim Tarihi:</Text>
            <Text mb={2}>{assignment?.due_date ? formatDate(assignment.due_date) : 'Belirtilmemiş'}</Text>
            
            <Text fontWeight="bold">Teslim Eden Öğrenci Sayısı:</Text>
            <Text>{submissions.length}</Text>
          </Box>
        </Stack>
      </Box>

      {submissions.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Bu ödev için henüz bir teslim yapılmamış.
        </Alert>
      ) : (
        <Box 
          borderWidth="1px"
          borderRadius="lg"
          bg={cardBg}
          p={6}
          borderColor={borderColor}
        >
          <Heading size="md" mb={4}>Teslimler</Heading>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Öğrenci</Th>
                  <Th>Teslim Tarihi</Th>
                  <Th>Durum</Th>
                  <Th>Çözülen Sorular</Th>
                  <Th isNumeric>İşlemler</Th>
                </Tr>
              </Thead>
              <Tbody>
                {submissions.map((submission) => (
                  <Tr key={submission.id}>
                    <Td>
                      <Flex align="center">
                        <Avatar
                          size="sm"
                          name={submission.student.name}
                          src={submission.student.photo_url || undefined}
                          mr={2}
                        />
                        <Text>{submission.student.name}</Text>
                      </Flex>
                    </Td>
                    <Td>{formatDate(submission.submission_date)}</Td>
                    <Td>
                      <Badge colorScheme={submission.status === 'graded' ? 'green' : 'blue'}>
                        {submission.status === 'graded' ? 'Notlandırıldı' : 'Teslim Edildi'}
                      </Badge>
                    </Td>
                    <Td>{submission.grade !== null && submission.grade !== undefined ? submission.grade : '-'}</Td>
                    <Td isNumeric>
                      <Flex justify="flex-end" gap={2}>
                        <Tooltip label="Görüntüle">
                          <IconButton
                            aria-label="Görüntüle"
                            icon={<FaEye />}
                            size="sm"
                            colorScheme="blue"
                            onClick={() => openViewModal(submission)}
                          />
                        </Tooltip>
                        <Tooltip label="Notlandır">
                          <IconButton
                            aria-label="Notlandır"
                            icon={<FaCheck />}
                            size="sm"
                            colorScheme="green"
                            onClick={() => openGradeModal(submission)}
                          />
                        </Tooltip>
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Teslim Görüntüleme Modal */}
      <Modal isOpen={isViewModalOpen} onClose={onViewModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ödev Teslimi</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold">Öğrenci:</Text>
                <Flex align="center" mt={1}>
                  <Avatar
                    size="sm"
                    name={selectedSubmission?.student.name}
                    src={selectedSubmission?.student.photo_url || undefined}
                    mr={2}
                  />
                  <Text>{selectedSubmission?.student.name}</Text>
                </Flex>
              </Box>

              <Box>
                <Text fontWeight="bold">Teslim Tarihi:</Text>
                <Text>{selectedSubmission?.submission_date ? formatDate(selectedSubmission.submission_date) : '-'}</Text>
              </Box>

              {selectedSubmission?.grade !== undefined && selectedSubmission?.grade !== null && (
                <Box>
                  <Text fontWeight="bold">Çözülen Soru Sayısı:</Text>
                  <Text>{selectedSubmission.grade}</Text>
                </Box>
              )}

              {selectedSubmission?.teacher_comment && (
                <Box>
                  <Text fontWeight="bold">Öğretmen Yorumu:</Text>
                  <Text>{selectedSubmission.teacher_comment}</Text>
                </Box>
              )}

              <Box>
                <Text fontWeight="bold" mb={2}>Yüklenen Fotoğraflar:</Text>
                {!selectedSubmission?.photo_url ? (
                  <Text color="gray.500">Fotoğraf bulunamadı</Text>
                ) : Array.isArray(selectedSubmission.photo_url) ? (
                  // Çoklu fotoğraf durumu
                  <Box borderWidth="1px" borderRadius="md" overflow="hidden">
                    {selectedSubmission.photo_url.map((url, index) => (
                      <Box key={index} p={2} borderBottomWidth={index < selectedSubmission.photo_url.length - 1 ? "1px" : "0"}>
                        <Text fontSize="sm" mb={1} color="gray.500">Sayfa {index + 1}</Text>
                        <Flex justify="center">
                          <img 
                            src={typeof url === 'string' && url.startsWith('data:') ? url : url} 
                            alt={`Ödev teslimi sayfa ${index + 1}`}
                            style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                          />
                        </Flex>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  // Tek fotoğraf durumu (geriye dönük uyumluluk için)
                  <Box borderWidth="1px" borderRadius="md" overflow="hidden">
                    <Flex justify="center" p={2}>
                      <img 
                        src={typeof selectedSubmission.photo_url === 'string' && selectedSubmission.photo_url.startsWith('data:') 
                          ? selectedSubmission.photo_url  // Base64 formatında
                          : selectedSubmission.photo_url as string  // URL formatında veya diğer formatlar
                        } 
                        alt="Ödev teslimi" 
                        style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                      />
                    </Flex>
                  </Box>
                )}
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button 
              colorScheme="green" 
              mr={3} 
              onClick={() => {
                onViewModalClose();
                openGradeModal(selectedSubmission!);
              }}
            >
              Notlandır
            </Button>
            <Button onClick={onViewModalClose}>Kapat</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Notlandırma Modal */}
      <Modal isOpen={isGradeModalOpen} onClose={onGradeModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ödevi Değerlendir</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4}>
              <strong>{selectedSubmission?.student.name}</strong> tarafından teslim edilen ödevi değerlendiriyorsunuz.
            </Text>
            
            <FormControl mb={4}>
              <FormLabel>Çözülen Soru Sayısı</FormLabel>
              <NumberInput min={0} value={solvedQuestions} onChange={(valueString) => setSolvedQuestions(Number(valueString))}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            
            <FormControl>
              <FormLabel>Öğretmen Yorumu</FormLabel>
              <Textarea
                placeholder="Ödev hakkında yorum ekleyin"
                value={teacherComment}
                onChange={(e) => setTeacherComment(e.target.value)}
                rows={4}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button 
              colorScheme="blue" 
              mr={3} 
              onClick={handleGradeSubmission}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ButtonLoader /> : 'Kaydet'}
            </Button>
            <Button onClick={onGradeModalClose}>İptal</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 