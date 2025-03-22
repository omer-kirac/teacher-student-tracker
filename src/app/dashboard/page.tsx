'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Text,
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
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { supabase } from '@/lib/supabase';
import React from 'react';

interface Class {
  id: string;
  name: string;
  created_at: string;
}

export default function Dashboard() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newClassName, setNewClassName] = useState('');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [className, setClassName] = useState('');
  
  const { 
    isOpen, 
    onOpen, 
    onClose 
  } = useDisclosure();

  const { 
    isOpen: isDeleteDialogOpen, 
    onOpen: onDeleteDialogOpen, 
    onClose: onDeleteDialogClose 
  } = useDisclosure();

  const { 
    isOpen: isEditClassModalOpen, 
    onOpen: onEditClassModalOpen, 
    onClose: onEditClassModalClose 
  } = useDisclosure();

  const router = useRouter();
  const toast = useToast();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      setUser(session.user);
      fetchClasses(session.user.id);
    };

    checkSession();
  }, [router]);

  const fetchClasses = async (teacherId: string) => {
    try {
      console.log('Fetching classes for teacher ID:', teacherId);
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      console.error('Error fetching classes:', error.message);
      toast({
        title: 'Hata!',
        description: 'Sınıflar yüklenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      toast({
        title: 'Hata!',
        description: 'Sınıf adı boş olamaz',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!user || !user.id) {
      toast({
        title: 'Hata!',
        description: 'Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      console.log('Creating class with teacher ID:', user.id);
      
      // Önce öğretmen tablosunun kontrolü
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (teacherError) {
        console.error('Teacher not found error:', teacherError);
        
        // Öğretmen bulunamadıysa, otomatik oluştur
        const { error: insertError } = await supabase
          .from('teachers')
          .insert([{ 
            id: user.id, 
            email: user.email,
            full_name: user.user_metadata?.full_name || 'Öğretmen',
            password_hash: 'secure_placeholder'
          }]);
          
        if (insertError) {
          console.error('Teacher insert error:', insertError);
          throw insertError;
        }
      }
      
      // Sınıf oluştur
      const { data, error } = await supabase
        .from('classes')
        .insert([
          { 
            name: newClassName,
            teacher_id: user.id 
          }
        ])
        .select();

      if (error) {
        console.error('Class insert error:', error);
        throw error;
      }

      toast({
        title: 'Başarılı!',
        description: 'Yeni sınıf oluşturuldu',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Yeni sınıfı listeye ekle
      if (data) {
        setClasses([...data, ...classes]);
      }
      setNewClassName('');
      onClose();
    } catch (error: any) {
      toast({
        title: 'Hata!',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', selectedClass.id);

      if (error) throw error;

      toast({
        title: 'Başarılı!',
        description: 'Sınıf silindi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Sınıf listesini güncelle
      setClasses(classes.filter(cls => cls.id !== selectedClass.id));
      onDeleteDialogClose();
    } catch (error: any) {
      toast({
        title: 'Hata!',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditClass = (cls: Class) => {
    setEditingClass(cls);
    setClassName(cls.name);
    onEditClassModalOpen();
  };

  const handleUpdateClass = async () => {
    if (!editingClass || !className.trim()) return;

    try {
      const { error } = await supabase
        .from('classes')
        .update({ name: className })
        .eq('id', editingClass.id);

      if (error) throw error;

      toast({
        title: 'Başarılı!',
        description: 'Sınıf bilgileri güncellendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Sınıf listesini güncelle
      setClasses(
        classes.map(cls => 
          cls.id === editingClass.id 
            ? { ...cls, name: className } 
            : cls
        )
      );
      
      setClassName('');
      setEditingClass(null);
      onEditClassModalClose();
    } catch (error: any) {
      toast({
        title: 'Hata!',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleClassClick = (classId: string) => {
    router.push(`/classes/${classId}`);
  };

  if (loading) {
    return (
      <Container centerContent py={10}>
        <Text>Yükleniyor...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={10}>
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        <Heading>Sınıflarım</Heading>
        <Flex gap={4}>
          <Button colorScheme="blue" onClick={onOpen}>
            Yeni Sınıf Ekle
          </Button>
          <Button colorScheme="red" variant="outline" onClick={handleLogout}>
            Çıkış Yap
          </Button>
        </Flex>
      </Flex>

      {classes.length === 0 ? (
        <Box p={10} textAlign="center" borderWidth={1} borderRadius="md">
          <Text mb={4}>Henüz hiç sınıfınız yok.</Text>
          <Button colorScheme="blue" onClick={onOpen}>
            İlk Sınıfınızı Oluşturun
          </Button>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {classes.map((cls) => (
            <Box
              key={cls.id}
              p={5}
              borderWidth={1}
              borderRadius="md"
              _hover={{ shadow: 'md', borderColor: 'blue.400' }}
              position="relative"
            >
              <Flex justifyContent="space-between" alignItems="center" mb={2}>
                <Heading 
                  size="md" 
                  cursor="pointer" 
                  onClick={() => handleClassClick(cls.id)}
                >
                  {cls.name}
                </Heading>
                <Flex>
                  <Button 
                    size="sm" 
                    mr={2}
                    colorScheme="blue"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClass(cls);
                    }}
                  >
                    Düzenle
                  </Button>
                  <Button 
                    size="sm" 
                    colorScheme="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClass(cls);
                      onDeleteDialogOpen();
                    }}
                  >
                    Sil
                  </Button>
                </Flex>
              </Flex>
              <Text 
                fontSize="sm" 
                color="gray.500"
                cursor="pointer" 
                onClick={() => handleClassClick(cls.id)}
              >
                {new Date(cls.created_at).toLocaleDateString()}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Yeni Sınıf Oluştur</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Sınıf Adı</FormLabel>
              <Input
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Örn: 5-A Sınıfı"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              İptal
            </Button>
            <Button colorScheme="blue" onClick={handleCreateClass}>
              Oluştur
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Sınıf Düzenleme Modal */}
      <Modal isOpen={isEditClassModalOpen} onClose={onEditClassModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sınıf Düzenle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Sınıf Adı</FormLabel>
              <Input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Örn: 5-A Sınıfı"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClassModalClose}>
              İptal
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateClass}>
              Güncelle
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Sınıf Silme Onay Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteDialogClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Sınıfı Sil
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text>
                <strong>{selectedClass?.name}</strong> isimli sınıfı silmek istediğinize emin misiniz?
              </Text>
              <Text mt={2} fontWeight="bold" color="red.500">
                Bu işlem geri alınamaz ve sınıfa ait tüm öğrenciler ve çözümler de silinecektir.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteDialogClose}>
                İptal
              </Button>
              <Button colorScheme="red" onClick={handleDeleteClass} ml={3}>
                Sil
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
} 