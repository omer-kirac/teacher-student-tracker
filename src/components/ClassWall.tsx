import React, { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
  Select,
  HStack,
  Avatar,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaUsers, FaUserSlash, FaUserCheck } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { WallPost, Student, MutedStudent } from '@/types';
import ClassWallPost from './ClassWallPost';
import CreateWallPostForm from './CreateWallPostForm';
import EmptyStateIllustration from './EmptyStateIllustration';
import CustomButton from './CustomButton';
import { FocusableElement } from '@chakra-ui/utils';

interface ClassWallProps {
  classId: string;
}

const ClassWall: React.FC<ClassWallProps> = ({ classId }) => {
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [mutedStudents, setMutedStudents] = useState<MutedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isTeacher, setIsTeacher] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [muteDuration, setMuteDuration] = useState<string>('1');
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const { 
    isOpen: isManageStudentsOpen, 
    onOpen: onManageStudentsOpen, 
    onClose: onManageStudentsClose 
  } = useDisclosure();
  
  const { 
    isOpen: isMuteDialogOpen, 
    onOpen: onMuteDialogOpen, 
    onClose: onMuteDialogClose 
  } = useDisclosure();
  
  const cancelRef = React.useRef<HTMLButtonElement>(null) as React.RefObject<HTMLButtonElement>;
  
  useEffect(() => {
    const fetchSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const userId = sessionData.session.user.id;
        setCurrentUserId(userId);
        
        // Kullanıcı öğretmen mi?
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', userId)
          .single();
        
        setIsTeacher(!!teacherData);
        
        // Öğrenci susturulmuş mu?
        if (!teacherData) {
          const { data: mutedData } = await supabase
            .from('muted_students')
            .select('*')
            .eq('class_id', classId)
            .eq('student_id', userId)
            .maybeSingle();
          
          setIsMuted(!!mutedData && (!mutedData.muted_until || new Date(mutedData.muted_until) > new Date()));
        }
      }
    };
    
    fetchSession();
    fetchPosts();
    fetchStudents();
    fetchMutedStudents();
  }, [classId]);
  
  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Sınıf duvarı gönderilerini getir
      const { data, error } = await supabase
        .from('wall_posts')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Her gönderi için ek bilgileri getir
      const postsWithDetails = await Promise.all(
        (data || []).map(async (post) => {
          // Eğer yazar adı doldurulmamışsa, doldurulmaya çalışılsın
          if (!post.author_name) {
            let authorName = 'Kullanıcı';
            let isTeacher = false;
            
            // Yazar öğretmen mi?
            const { data: teacherData } = await supabase
              .from('teachers')
              .select('full_name')
              .eq('id', post.author_id)
              .single();
            
            if (teacherData) {
              authorName = teacherData.full_name || 'Öğretmen';
              isTeacher = true;
            } else {
              // Öğrenci bilgileri
              const { data: studentData } = await supabase
                .from('students')
                .select('name')
                .eq('id', post.author_id)
                .single();
              
              if (studentData) {
                authorName = studentData.name;
              }
            }
            
            // Yazar bilgisini güncelle
            await supabase
              .from('wall_posts')
              .update({
                author_name: authorName,
                author_is_teacher: isTeacher
              })
              .eq('id', post.id);
              
            post.author_name = authorName;
            post.author_is_teacher = isTeacher;
          }
          
          // Profil fotoğrafını al (öğretmen veya öğrenci)
          let authorPhoto = null;
          if (post.author_is_teacher) {
            const { data: teacherData } = await supabase
              .from('teachers')
              .select('photo_url')
              .eq('id', post.author_id)
              .single();
            
            authorPhoto = teacherData?.photo_url;
          } else {
            const { data: studentData } = await supabase
              .from('students')
              .select('photo_url')
              .eq('id', post.author_id)
              .single();
            
            authorPhoto = studentData?.photo_url;
          }
          
          // Yorum sayısını al
          const { count: commentsCount } = await supabase
            .from('wall_post_comments')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id);
          
          return {
            ...post,
            author_photo: authorPhoto,
            is_teacher: post.author_is_teacher,  // Uyumluluk için is_teacher de ekleyelim
            comments_count: commentsCount
          };
        })
      );
      
      setPosts(postsWithDetails);
    } catch (error) {
      console.error('Gönderi yükleme hatası:', error);
      toast({
        title: 'Gönderiler yüklenirken hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId);
      
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Öğrenci yükleme hatası:', error);
    }
  };
  
  const fetchMutedStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('muted_students')
        .select('*')
        .eq('class_id', classId);
      
      if (error) throw error;
      setMutedStudents(data || []);
    } catch (error) {
      console.error('Susturulmuş öğrenci yükleme hatası:', error);
    }
  };
  
  const isStudentMuted = (studentId: string) => {
    const mutedStudent = mutedStudents.find(ms => ms.student_id === studentId);
    if (!mutedStudent) return false;
    
    // Süre kontrolü
    if (!mutedStudent.muted_until) return true; // Süresiz susturma
    return new Date(mutedStudent.muted_until) > new Date();
  };
  
  const getMuteExpirationText = (mutedUntil?: string) => {
    if (!mutedUntil) return 'Süresiz';
    
    const expDate = new Date(mutedUntil);
    const now = new Date();
    
    if (expDate <= now) return 'Süresi dolmuş';
    
    // Kalan süreyi hesapla
    const diffMs = expDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} gün ${diffHours} saat kaldı`;
    } else {
      return `${diffHours} saat kaldı`;
    }
  };
  
  const handleMuteStudent = async () => {
    if (!selectedStudent) return;
    
    try {
      let muteUntil = null;
      
      // Susturma süresini hesapla
      if (muteDuration !== 'infinity') {
        const days = parseInt(muteDuration);
        const date = new Date();
        date.setDate(date.getDate() + days);
        muteUntil = date.toISOString();
      }
      
      // Önceden susturulmuş mu kontrol et
      const { data: existingMute } = await supabase
        .from('muted_students')
        .select('id')
        .eq('class_id', classId)
        .eq('student_id', selectedStudent.id)
        .maybeSingle();
      
      if (existingMute) {
        // Güncelle
        const { error } = await supabase
          .from('muted_students')
          .update({
            muted_until: muteUntil,
            muted_by: currentUserId
          })
          .eq('id', existingMute.id);
        
        if (error) throw error;
      } else {
        // Yeni kayıt
        const { error } = await supabase
          .from('muted_students')
          .insert({
            class_id: classId,
            student_id: selectedStudent.id,
            muted_by: currentUserId,
            muted_until: muteUntil
          });
        
        if (error) throw error;
      }
      
      // Başarı mesajı
      toast({
        title: `${selectedStudent.name} susturuldu.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Listeyi güncelle
      fetchMutedStudents();
      onMuteDialogClose();
    } catch (error) {
      console.error('Öğrenci susturma hatası:', error);
      toast({
        title: 'Öğrenci susturulamadı.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleUnmuteStudent = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('muted_students')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      // Başarı mesajı
      const student = students.find(s => s.id === studentId);
      toast({
        title: `${student?.name || 'Öğrenci'} konuşma izni verildi.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Listeyi güncelle
      fetchMutedStudents();
    } catch (error) {
      console.error('Öğrenci konuşma izni hatası:', error);
      toast({
        title: 'İşlem yapılamadı.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  return (
    <Box>
      {isTeacher && (
        <Flex justify="flex-end" mb={4}>
          <CustomButton
            leftIcon={<FaUsers />}
            variant="outline"
            buttonColorOutline="#1a52cb"
            onClick={onManageStudentsOpen}
          >
            Öğrencileri Yönet
          </CustomButton>
        </Flex>
      )}
      
      {/* Gönderi Oluşturma Formu */}
      <CreateWallPostForm 
        classId={classId} 
        currentUserId={currentUserId} 
        refreshPosts={fetchPosts}
        isMuted={isMuted}
      />
      
      {/* Gönderiler Listesi */}
      {loading ? (
        <Flex justify="center" align="center" height="200px">
          <Spinner size="lg" />
        </Flex>
      ) : posts.length === 0 ? (
        <Flex direction="column" align="center" justify="center" py={10}>
          <Box mb={4}>
            <EmptyStateIllustration 
              title="Henüz Gönderi Yok" 
              message="Sınıf duvarında henüz gönderi paylaşılmamış." 
              icon={<FaUsers />} 
            />
          </Box>
          <Text fontSize="lg" color="gray.500" textAlign="center" mb={4}>
            İlk gönderiyi siz paylaşın!
          </Text>
        </Flex>
      ) : (
        <Box>
          {posts.map(post => (
            <ClassWallPost
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              isTeacher={isTeacher}
              refreshPosts={fetchPosts}
              classId={classId}
              isMuted={isMuted}
            />
          ))}
        </Box>
      )}
      
      {/* Öğrenci Yönetim Modalı */}
      <Modal 
        isOpen={isManageStudentsOpen} 
        onClose={onManageStudentsClose}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Öğrencileri Yönet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {students.length === 0 ? (
              <Text textAlign="center" py={6}>Bu sınıfta henüz öğrenci bulunmuyor.</Text>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Öğrenci</Th>
                    <Th>Durum</Th>
                    <Th>İşlem</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {students.map(student => {
                    const isMuted = isStudentMuted(student.id);
                    const mutedStudent = mutedStudents.find(ms => ms.student_id === student.id);
                    
                    return (
                      <Tr key={student.id}>
                        <Td>
                          <Flex align="center">
                            <Avatar 
                              size="sm" 
                              name={student.name} 
                              src={student.photo_url} 
                              mr={3}
                            />
                            <Text>{student.name}</Text>
                          </Flex>
                        </Td>
                        <Td>
                          {isMuted ? (
                            <Badge colorScheme="red">
                              Susturuldu - {getMuteExpirationText(mutedStudent?.muted_until)}
                            </Badge>
                          ) : (
                            <Badge colorScheme="green">Aktif</Badge>
                          )}
                        </Td>
                        <Td>
                          {isMuted ? (
                            <IconButton
                              aria-label="Konuşma izni ver"
                              icon={<FaUserCheck />}
                              colorScheme="green"
                              size="sm"
                              onClick={() => handleUnmuteStudent(student.id)}
                            />
                          ) : (
                            <IconButton
                              aria-label="Öğrenciyi sustur"
                              icon={<FaUserSlash />}
                              colorScheme="red"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(student);
                                onMuteDialogOpen();
                              }}
                            />
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onManageStudentsClose}>Kapat</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Susturma Onay Diyaloğu */}
      <AlertDialog
        isOpen={isMuteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onMuteDialogClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Öğrenciyi Sustur
            </AlertDialogHeader>
            <AlertDialogBody>
              <Text mb={4}>
                {selectedStudent?.name} adlı öğrenciyi susturmak istediğinize emin misiniz?
                Susturulan öğrenci sınıf duvarına gönderi paylaşamaz ve yorum yapamaz.
              </Text>
              
              <Box mb={4}>
                <Text fontWeight="bold" mb={2}>Susturma Süresi:</Text>
                <Select 
                  value={muteDuration} 
                  onChange={(e) => setMuteDuration(e.target.value)}
                >
                  <option value="1">1 gün</option>
                  <option value="3">3 gün</option>
                  <option value="7">1 hafta</option>
                  <option value="30">1 ay</option>
                  <option value="infinity">Süresiz</option>
                </Select>
              </Box>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onMuteDialogClose}>
                İptal
              </Button>
              <CustomButton
                buttonColor="#e50041"
                onClick={handleMuteStudent}
                ml={3}
              >
                Sustur
              </CustomButton>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ClassWall; 