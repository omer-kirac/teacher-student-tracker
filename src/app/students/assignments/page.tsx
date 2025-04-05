'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Progress,
  VStack,
  HStack,
  Icon
} from '@chakra-ui/react';
import { supabase } from '@/lib/supabase';
import { FaUpload, FaCheck, FaExclamationTriangle, FaClock, FaFile } from 'react-icons/fa';
import { Assignment, StudentAssignment, Student, Class } from '@/types';
import CustomLoader from '@/components/CustomLoader';
import FileUploader from '@/components/FileUploader';
// import { sendSubmissionThankYouMessage } from '@/lib/utils/twilioService';

// Birleştirilmiş Assignment+StudentAssignment tipi tanımlayalım
interface AssignmentWithSubmission extends Assignment {
  student_assignment?: StudentAssignment;
}

export default function StudentAssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithSubmission | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const router = useRouter();
  const toast = useToast();
  
  const { 
    isOpen: isSubmitModalOpen,
    onOpen: onSubmitModalOpen,
    onClose: onSubmitModalClose
  } = useDisclosure();
  
  const { 
    isOpen: isViewModalOpen,
    onOpen: onViewModalOpen,
    onClose: onViewModalClose
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

        // Öğrenci bilgilerini getir
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*, classes(*)')
          .eq('id', userId)
          .single();

        if (studentError || !studentData) {
          toast({
            title: 'Hata',
            description: 'Öğrenci bilgileri yüklenemedi',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          router.push('/students/dashboard');
          return;
        }

        setStudentData(studentData);
        setClassData(studentData.classes);

        // Ödevleri getir
        if (studentData.class_id) {
          await fetchAssignments(userId, studentData.class_id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        toast({
          title: 'Veri yükleme hatası',
          description: 'Ödev bilgileri yüklenirken bir hata oluştu',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
      }
    };

    fetchData();
  }, [router, toast]);

  const fetchAssignments = async (studentId: string, classId: string) => {
    try {
      // Sınıfın ödevlerini getir
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('class_id', classId)
        .order('due_date', { ascending: true });

      if (assignmentsError) throw assignmentsError;

      // Öğrencinin teslim ettiği ödevleri getir
      const { data: studentAssignmentsData, error: studentAssignmentsError } = await supabase
        .from('student_assignments')
        .select('*')
        .eq('student_id', studentId);

      if (studentAssignmentsError) throw studentAssignmentsError;

      // Ödev ve teslim bilgilerini birleştir
      const assignmentsWithSubmissions = assignmentsData.map((assignment: Assignment) => {
        const studentAssignment = studentAssignmentsData.find(
          (sa: StudentAssignment) => sa.assignment_id === assignment.id
        );
        return {
          ...assignment,
          student_assignment: studentAssignment
        };
      });

      setAssignments(assignmentsWithSubmissions);
    } catch (error: any) {
      console.error('Ödevler yüklenirken hata:', error.message);
      toast({
        title: 'Hata',
        description: 'Ödevler yüklenemedi',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelect = (files: File[]) => {
    setPhotos(files);
  };

  // Tekli dosya seçim işleyicisi - FileUploader için gerekli
  const handleFileSelect = (file: File | null) => {
    if (file) {
      setPhotos([file]);
    } else {
      setPhotos([]);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || photos.length === 0) {
      toast({
        title: 'Hata',
        description: 'Lütfen en az bir fotoğraf seçin',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress(10);

      // Dosyaları Base64 formatına çevirelim
      const base64Promises = photos.map(photo => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Dosya okunamadı'));
          reader.readAsDataURL(photo);
        });
      });
      
      const base64Images = await Promise.all(base64Promises);
      console.log(`${photos.length} fotoğraf Base64 formatına dönüştürüldü`);
      
      setUploadProgress(70);
      
      // Teslim veritabanına ekleyelim
      // Mevcut bir teslim var mı kontrol et
      const { data: existingSubmission, error: checkError } = await supabase
        .from('student_assignments')
        .select('id')
        .eq('student_id', studentData?.id)
        .eq('assignment_id', selectedAssignment.id)
        .maybeSingle();
        
      setUploadProgress(80);
        
      if (checkError) {
        console.error('Mevcut teslim kontrolü hatası:', checkError);
        throw new Error(`Mevcut teslim kontrol edilemedi: ${checkError.message}`);
      }
      
      console.log('Mevcut teslim kontrolü:', existingSubmission);
      
      let operation;
      if (existingSubmission) {
        // Varolan teslimi güncelle
        console.log('Teslim güncelleniyor, ID:', existingSubmission.id);
        operation = supabase
          .from('student_assignments')
          .update({
            photo_url: base64Images,
            status: 'submitted',
            submission_date: new Date().toISOString()
          })
          .eq('id', existingSubmission.id);
      } else {
        // Yeni teslim oluştur
        console.log('Yeni teslim oluşturuluyor');
        operation = supabase
          .from('student_assignments')
          .insert([{
            student_id: studentData?.id,
            assignment_id: selectedAssignment.id,
            photo_url: base64Images,
            status: 'submitted',
            submission_date: new Date().toISOString()
          }]);
      }
      
      const { data: operationData, error: submissionError } = await operation;
      
      if (submissionError) {
        console.error('Teslim kaydetme hatası:', submissionError);
        throw new Error(`Teslim kaydedilemedi: ${submissionError.message}`);
      }
      
      console.log('Teslim başarıyla kaydedildi:', operationData);
      setUploadProgress(100);
      
      // Başarılı teslim bildirimi göster
      toast({
        title: 'Başarılı',
        description: 'Ödev teslim edildi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Öğrenciye WhatsApp üzerinden teşekkür mesajı gönder
      // Twilio çağrısını doğrudan istemci tarafında yapmak yerine API'yi kullanıyoruz
      if (studentData?.phone_number) {
        try {
          console.log('Sunucu taraflı bildirim gönderme API\'si çağrılıyor...');
          
          // Teslim bildirimi için API çağrısı yap
          const response = await fetch('/api/assignments/submit-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studentId: studentData.id,
              assignmentId: selectedAssignment.id,
              assignmentTitle: selectedAssignment.title,
              phoneNumber: studentData.phone_number
            }),
          });
          
          const result = await response.json();
          
          if (response.ok && result.success) {
            console.log('WhatsApp teşekkür mesajı başarıyla gönderildi');
            toast({
              title: 'Bildirim Gönderildi',
              description: 'WhatsApp üzerinden teslim onayı gönderildi',
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
          } else {
            console.error('WhatsApp teşekkür mesajı gönderilemedi:', result.error);
            toast({
              title: 'Bildirim Gönderilemedi',
              description: 'WhatsApp üzerinden teslim onayı gönderilemedi',
              status: 'warning',
              duration: 3000,
              isClosable: true,
            });
          }
        } catch (messagingError: any) {
          console.error('WhatsApp mesajı gönderilirken hata:', messagingError);
          // Mesaj gönderme hatasını göster ama işleme devam et
          toast({
            title: 'Bildirim Gönderilemedi',
            description: 'Ödev teslim edildi ancak bildirim gönderilemedi',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        }
      } else {
        console.warn('Öğrencinin telefon numarası olmadığı için bildirim gönderilemedi');
      }
      
      // Ödevleri yeniden yükle
      if (studentData?.class_id) {
        await fetchAssignments(studentData.id, studentData.class_id);
      }
      
      setPhotos([]);
      onSubmitModalClose();
    } catch (error: any) {
      console.error('Ödev teslim hatası (detaylı):', error);
      toast({
        title: 'Hata',
        description: `Ödev teslim edilemedi: ${error.message || 'Bilinmeyen hata'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const openSubmitModal = (assignment: AssignmentWithSubmission) => {
    setSelectedAssignment(assignment);
    setPhotos([]);
    onSubmitModalOpen();
  };

  const openViewModal = (assignment: AssignmentWithSubmission) => {
    setSelectedAssignment(assignment);
    onViewModalOpen();
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  const getStatusBadge = (assignment: AssignmentWithSubmission) => {
    if (!assignment.student_assignment) {
      return {
        label: 'Teslim Edilmedi',
        color: 'gray',
        icon: FaClock
      };
    }
    
    switch (assignment.student_assignment.status) {
      case 'submitted':
        return {
          label: 'Teslim Edildi',
          color: 'green',
          icon: FaCheck
        };
      case 'graded':
        return {
          label: 'Notlandırıldı',
          color: 'blue',
          icon: FaCheck
        };
      default:
        return {
          label: 'Teslim Edilmedi',
          color: 'gray',
          icon: FaClock
        };
    }
  };
  
  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="80vh">
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
            Ödevlerim
          </Heading>
          <Text color="gray.600">
            Sınıf: {classData?.name || 'Kayıtlı Sınıf Yok'}
          </Text>
        </Box>
        <button className="stylish-button gray" 
          onClick={() => router.push('/students/dashboard')}
          style={{ marginTop: { base: '16px', md: '0' } }}>
          <span className="shadow"></span>
          <span className="edge"></span>
          <span className="front text">Panele Dön</span>
        </button>
      </Flex>

      {!studentData?.class_id ? (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          Henüz bir sınıfa kayıtlı değilsiniz. Sınıfa kaydolduktan sonra ödevlerinizi görebilirsiniz.
        </Alert>
      ) : assignments.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Bu sınıf için henüz ödev tanımlanmamış.
        </Alert>
      ) : (
        <Box 
          borderWidth="1px"
          borderRadius="lg"
          bg={cardBg}
          p={6}
          borderColor={borderColor}
          mb={6}
        >
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Başlık</Th>
                  <Th>Son Teslim Tarihi</Th>
                  <Th>Durum</Th>
                  <Th isNumeric>İşlemler</Th>
                </Tr>
              </Thead>
              <Tbody>
                {assignments.map((assignment) => {
                  const status = getStatusBadge(assignment);
                  const isLate = isOverdue(assignment.due_date) && !assignment.student_assignment;
                  
                  return (
                    <Tr key={assignment.id}>
                      <Td fontWeight="medium">{assignment.title}</Td>
                      <Td>
                        {formatDate(assignment.due_date)}
                        {isLate && (
                          <Badge colorScheme="red" ml={2}>Gecikmiş</Badge>
                        )}
                      </Td>
                      <Td>
                        <Flex align="center">
                          <Icon as={status.icon} mr={2} />
                          <Badge colorScheme={status.color}>{status.label}</Badge>
                        </Flex>
                      </Td>
                      <Td isNumeric>
                        <HStack justify="flex-end" spacing={2}>
                          {assignment.student_assignment ? (
                            <button className="stylish-button blue small"
                              onClick={() => openViewModal(assignment)}>
                              <span className="shadow"></span>
                              <span className="edge"></span>
                              <span className="front text">
                                <Flex align="center">
                                  <FaFile style={{ marginRight: '8px' }} />
                                  Görüntüle
                                </Flex>
                              </span>
                            </button>
                          ) : (
                            <button className="stylish-button green small"
                              onClick={() => openSubmitModal(assignment)}
                              disabled={isOverdue(assignment.due_date)}>
                              <span className="shadow"></span>
                              <span className="edge"></span>
                              <span className="front text">
                                <Flex align="center">
                                  <FaUpload style={{ marginRight: '8px' }} />
                                  Teslim Et
                                </Flex>
                              </span>
                            </button>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Ödev Teslim Modal */}
      <Modal isOpen={isSubmitModalOpen} onClose={onSubmitModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ödev Teslimi</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4}>
              <strong>{selectedAssignment?.title}</strong> ödevini teslim ediyorsunuz.
            </Text>
            
            <Text mb={4} fontSize="sm" color="gray.600">
              Son Teslim Tarihi: {selectedAssignment && formatDate(selectedAssignment.due_date)}
            </Text>
            
            <FormControl isRequired>
              <FormLabel>Ödev Fotoğrafları</FormLabel>
              <FileUploader 
                onFileSelect={handleFileSelect}
                onFilesSelect={handleFilesSelect}
                accept="image/*"
                id="assignment-file-upload"
                compact={true}
                multiple={true}
                maxFiles={10}
              />
              <Text mt={1} fontSize="xs" color="gray.500">
                Birden fazla sayfa yükleyebilirsiniz (maksimum 10 fotoğraf)
              </Text>
            </FormControl>
            
            {isSubmitting && (
              <Box mt={4}>
                <Text mb={2} fontSize="sm">Yükleniyor...</Text>
                <Progress value={uploadProgress} size="sm" colorScheme="blue" borderRadius="md" />
              </Box>
            )}
          </ModalBody>

          <ModalFooter>
            <button className="stylish-button blue"
              onClick={handleSubmitAssignment}
              disabled={isSubmitting || photos.length === 0}
              style={{ marginRight: '12px' }}>
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front text">
                {isSubmitting ? 'Yükleniyor...' : 'Teslim Et'}
              </span>
            </button>
            <button className="stylish-button gray" onClick={onSubmitModalClose}>
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front text">İptal</span>
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Ödev Görüntüleme Modal */}
      <Modal isOpen={isViewModalOpen} onClose={onViewModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedAssignment?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold">Teslim Tarihi:</Text>
                <Text>
                  {selectedAssignment?.student_assignment?.submission_date
                    ? formatDate(selectedAssignment.student_assignment.submission_date)
                    : 'Bilinmiyor'}
                </Text>
              </Box>

              {selectedAssignment?.student_assignment?.grade !== undefined && (
                <Box>
                  <Text fontWeight="bold">Çözülen Soru Sayısı:</Text>
                  <Text>{selectedAssignment.student_assignment.grade}</Text>
                </Box>
              )}

              {selectedAssignment?.student_assignment?.teacher_comment && (
                <Box>
                  <Text fontWeight="bold">Öğretmen Yorumu:</Text>
                  <Text>{selectedAssignment.student_assignment.teacher_comment}</Text>
                </Box>
              )}

              <Box>
                <Text fontWeight="bold" mb={2}>Yüklenen Fotoğraflar:</Text>
                {selectedAssignment?.student_assignment?.photo_url ? (
                  <Box borderWidth="1px" borderRadius="md" overflow="hidden">
                    {selectedAssignment?.student_assignment?.photo_url && 
                     Array.isArray(selectedAssignment.student_assignment.photo_url) ? (
                      // Çoklu fotoğraf durumu
                      selectedAssignment.student_assignment.photo_url.map((url, index) => (
                        <Box key={index} p={2} borderBottomWidth={
                          index < (
                            Array.isArray(selectedAssignment?.student_assignment?.photo_url) 
                              ? selectedAssignment.student_assignment.photo_url.length - 1 
                              : 0
                          ) ? "1px" : "0"
                        }>
                          <Text fontSize="sm" mb={1} color="gray.500">Sayfa {index + 1}</Text>
                          <Flex justify="center">
                            <img 
                              src={typeof url === 'string' && url.startsWith('data:') ? url : url as string} 
                              alt={`Ödev teslimi sayfa ${index + 1}`}
                              style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                            />
                          </Flex>
                        </Box>
                      ))
                    ) : (
                      // Tek fotoğraf durumu (geriye dönük uyumluluk için)
                      <Flex justify="center" p={2}>
                        <img 
                          src={typeof selectedAssignment?.student_assignment?.photo_url === 'string' && 
                            selectedAssignment.student_assignment.photo_url.startsWith('data:') 
                              ? selectedAssignment.student_assignment.photo_url  // Base64 formatında
                              : selectedAssignment.student_assignment.photo_url as string  // URL formatında
                          } 
                          alt="Ödev teslimi" 
                          style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                        />
                      </Flex>
                    )}
                  </Box>
                ) : (
                  <Text color="gray.500">Fotoğraf bulunamadı</Text>
                )}
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <button className="stylish-button gray" onClick={onViewModalClose}>
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front text">Kapat</span>
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 