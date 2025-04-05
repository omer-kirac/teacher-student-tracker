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
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { supabase } from '@/lib/supabase';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { Assignment, Class, Teacher, Student } from '@/types';
import CustomLoader from '@/components/CustomLoader';

export default function AssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [classData, setClassData] = useState<Class | null>(null);
  const [teacherData, setTeacherData] = useState<Teacher | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;
  const toast = useToast();
  
  const { 
    isOpen: isCreateModalOpen, 
    onOpen: onCreateModalOpen, 
    onClose: onCreateModalClose 
  } = useDisclosure();
  
  const { 
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose
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

        // Öğretmen bilgilerini getir
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', userId)
          .single();

        if (teacherError || !teacherData) {
          router.push('/login');
          return;
        }

        setTeacherData(teacherData);

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
          router.push('/dashboard');
          return;
        }

        setClassData(classData);

        // Ödevleri getir
        await fetchAssignments();
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        toast({
          title: 'Veri yükleme hatası',
          description: 'Ödev bilgileri yüklenirken bir hata oluştu',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchData();
    }
  }, [classId, router, toast]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('class_id', classId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error: any) {
      console.error('Ödevler yüklenirken hata:', error.message);
      toast({
        title: 'Hata',
        description: 'Ödevler yüklenemedi',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCreateAssignment = async () => {
    if (!title.trim() || !dueDate) {
      toast({
        title: 'Hata',
        description: 'Başlık ve son teslim tarihi gereklidir',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      // 1. Önce ödevi oluştur
      const { data, error } = await supabase
        .from('assignments')
        .insert([
          {
            class_id: classId,
            title,
            description,
            due_date: dueDate,
            created_by: teacherData?.id
          }
        ])
        .select();

      if (error) throw error;

      // Başarılı mesajı göster
      toast({
        title: 'Başarılı',
        description: 'Yeni ödev oluşturuldu',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Ödev listesini güncelle
      if (data) {
        setAssignments([...assignments, ...data]);
        
        // Yeni oluşturulan ödev için bildirim gönderme API'sini çağır
        try {
          const createdAssignment = data[0];
          
          console.log(`Ödev bildirim API'si çağrılıyor: Ödev ID: ${createdAssignment.id}`);
          
          // Bildirim API'sini çağır
          const response = await fetch('/api/assignments/notify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              assignmentId: createdAssignment.id
            }),
          });
          
          const result = await response.json();
          
          if (response.ok) {
            // Bildirim sonuçlarını göster
            if (result.results.success > 0) {
              toast({
                title: 'Bildirim Gönderildi',
                description: `${result.results.success} öğrenciye WhatsApp mesajı gönderildi.`,
                status: 'success',
                duration: 5000,
                isClosable: true,
              });
            }
            
            if (result.results.failed > 0 || result.results.skipped > 0) {
              toast({
                title: 'Bazı Bildirimler Gönderilemedi',
                description: `${result.results.failed + result.results.skipped} öğrenciye WhatsApp mesajı gönderilemedi.`,
                status: 'warning',
                duration: 5000,
                isClosable: true,
              });
              
              // Hata detayını konsola log'la
              if (result.failedStudents && result.failedStudents.length > 0) {
                console.error('Bildirim gönderilemeyen öğrenciler:', result.failedStudents.join(', '));
              }
            }
          } else {
            // API hatası
            console.error('Bildirim API hatası:', result.error);
            toast({
              title: 'Bildirim Gönderilemedi',
              description: 'Ödev oluşturuldu ancak bildirimler gönderilemedi',
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
          }
        } catch (notifyError: any) {
          console.error('Bildirim API çağrısı hatası:', notifyError.message);
          toast({
            title: 'Bildirim Hatası',
            description: 'Ödev oluşturuldu ancak bildirim gönderilirken hata oluştu',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        }
      }

      resetForm();
      onCreateModalClose();
    } catch (error: any) {
      console.error('Ödev oluşturma hatası:', error.message);
      toast({
        title: 'Hata',
        description: 'Ödev oluşturulamadı',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAssignment = async () => {
    if (!selectedAssignment || !title.trim() || !dueDate) {
      toast({
        title: 'Hata',
        description: 'Başlık ve son teslim tarihi gereklidir',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('assignments')
        .update({
          title,
          description,
          due_date: dueDate
        })
        .eq('id', selectedAssignment.id);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Ödev güncellendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Ödev listesini güncelle
      await fetchAssignments();
      resetForm();
      onEditModalClose();
    } catch (error: any) {
      console.error('Ödev güncelleme hatası:', error.message);
      toast({
        title: 'Hata',
        description: 'Ödev güncellenemedi',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      setIsSubmitting(true);

      // 1. Önce ödevle ilgili tüm teslimleri alıp medyaları temizle
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('student_assignments')
        .select('*')
        .eq('assignment_id', selectedAssignment.id);

      if (submissionsError) {
        console.error('Ödev teslimleri alınamadı:', submissionsError);
        throw submissionsError;
      }

      // 2. Tüm teslimleri sil
      if (submissionsData && submissionsData.length > 0) {
        const { error: deleteSubmissionsError } = await supabase
          .from('student_assignments')
          .delete()
          .eq('assignment_id', selectedAssignment.id);

        if (deleteSubmissionsError) {
          console.error('Ödev teslimleri silinemedi:', deleteSubmissionsError);
          throw deleteSubmissionsError;
        }
      }

      // 3. Ödevi sil
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', selectedAssignment.id);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Ödev ve ilgili tüm teslimler silindi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Ödev listesini güncelle
      setAssignments(assignments.filter(a => a.id !== selectedAssignment.id));
      onDeleteModalClose();
    } catch (error: any) {
      console.error('Ödev silme hatası:', error.message);
      toast({
        title: 'Hata',
        description: 'Ödev silinemedi: ' + error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setSelectedAssignment(null);
  };

  const openEditModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setTitle(assignment.title);
    setDescription(assignment.description || '');
    setDueDate(new Date(assignment.due_date).toISOString().split('T')[0]);
    onEditModalOpen();
  };

  const openDeleteModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    onDeleteModalOpen();
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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const viewSubmissions = (assignmentId: string) => {
    router.push(`/classes/${classId}/assignments/${assignmentId}/submissions`);
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
            {classData?.name || 'Sınıf'} - Ödevler
          </Heading>
          <Text color="gray.600">
            Öğretmen: {teacherData?.full_name || 'Bilinmiyor'}
          </Text>
        </Box>
        <Flex gap={3} mt={{ base: 4, md: 0 }}>
          <button className="stylish-button blue" onClick={() => {
              resetForm();
              onCreateModalOpen();
            }}>
            <span className="shadow"></span>
            <span className="edge"></span>
            <span className="front text">
              <Flex align="center">
                <FaPlus style={{ marginRight: '8px' }} />
                Yeni Ödev
              </Flex>
            </span>
          </button>
          <button className="stylish-button gray" onClick={() => router.push(`/classes/${classId}`)}>
            <span className="shadow"></span>
            <span className="edge"></span>
            <span className="front text">Sınıfa Dön</span>
          </button>
        </Flex>
      </Flex>

      {assignments.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Bu sınıf için henüz ödev tanımlanmamış. Yeni ödev eklemek için "Yeni Ödev" butonunu kullanabilirsiniz.
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
                  <Th>Açıklama</Th>
                  <Th>Son Teslim Tarihi</Th>
                  <Th>Durum</Th>
                  <Th isNumeric>İşlemler</Th>
                </Tr>
              </Thead>
              <Tbody>
                {assignments.map((assignment) => (
                  <Tr key={assignment.id}>
                    <Td fontWeight="medium">{assignment.title}</Td>
                    <Td>
                      {assignment.description ? (
                        assignment.description.length > 100 
                          ? `${assignment.description.substring(0, 100)}...` 
                          : assignment.description
                      ) : (
                        <Text color="gray.500" fontSize="sm">Açıklama yok</Text>
                      )}
                    </Td>
                    <Td>{formatDate(assignment.due_date)}</Td>
                    <Td>
                      <Badge colorScheme={isOverdue(assignment.due_date) ? 'red' : 'green'}>
                        {isOverdue(assignment.due_date) ? 'Süresi Doldu' : 'Aktif'}
                      </Badge>
                    </Td>
                    <Td isNumeric>
                      <Flex justify="flex-end" gap={2}>
                        <button className="stylish-button blue small icon-button" 
                          onClick={() => viewSubmissions(assignment.id)}
                          title="Teslimleri Görüntüle">
                          <span className="shadow"></span>
                          <span className="edge"></span>
                          <span className="front text">
                            <FaEye />
                          </span>
                        </button>
                        <button className="stylish-button yellow small icon-button" 
                          onClick={() => openEditModal(assignment)}
                          title="Düzenle">
                          <span className="shadow"></span>
                          <span className="edge"></span>
                          <span className="front text">
                            <FaEdit />
                          </span>
                        </button>
                        <button className="stylish-button small icon-button" 
                          onClick={() => openDeleteModal(assignment)}
                          title="Sil">
                          <span className="shadow"></span>
                          <span className="edge"></span>
                          <span className="front text">
                            <FaTrash />
                          </span>
                        </button>
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Yeni Ödev Oluşturma Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={onCreateModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Yeni Ödev Oluştur</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl isRequired>
              <FormLabel>Başlık</FormLabel>
              <Input
                placeholder="Ödev başlığı"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Açıklama</FormLabel>
              <Textarea
                placeholder="Ödev açıklaması"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </FormControl>

            <FormControl mt={4} isRequired>
              <FormLabel>Son Teslim Tarihi</FormLabel>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <button className="stylish-button blue"
              onClick={handleCreateAssignment}
              disabled={isSubmitting}
              style={{ marginRight: '12px' }}>
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front text">
                {isSubmitting ? 'İşleniyor...' : 'Oluştur'}
              </span>
            </button>
            <button className="stylish-button gray" onClick={onCreateModalClose}>
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front text">İptal</span>
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Ödev Düzenleme Modal */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ödevi Düzenle</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl isRequired>
              <FormLabel>Başlık</FormLabel>
              <Input
                placeholder="Ödev başlığı"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Açıklama</FormLabel>
              <Textarea
                placeholder="Ödev açıklaması"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </FormControl>

            <FormControl mt={4} isRequired>
              <FormLabel>Son Teslim Tarihi</FormLabel>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <button className="stylish-button blue"
              onClick={handleEditAssignment}
              disabled={isSubmitting}
              style={{ marginRight: '12px' }}>
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front text">
                {isSubmitting ? 'İşleniyor...' : 'Güncelle'}
              </span>
            </button>
            <button className="stylish-button gray" onClick={onEditModalClose}>
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front text">İptal</span>
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Ödev Silme Onay Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ödevi Sil</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              "{selectedAssignment?.title}" başlıklı ödevi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </Text>
          </ModalBody>

          <ModalFooter>
            <button className="stylish-button"
              onClick={handleDeleteAssignment}
              disabled={isSubmitting}
              style={{ marginRight: '12px' }}>
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front text">
                {isSubmitting ? 'İşleniyor...' : 'Evet, Sil'}
              </span>
            </button>
            <button className="stylish-button gray" onClick={onDeleteModalClose}>
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front text">Vazgeç</span>
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 