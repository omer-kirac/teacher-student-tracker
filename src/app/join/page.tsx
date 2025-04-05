'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  useToast,
  Card,
  CardBody,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaUserPlus, FaSchool, FaUserCheck } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { ClassInvitation, Student, Class } from '@/types';
import CustomLoader from '@/components/CustomLoader';
import BlurText from '@/components/MotionWrapper';

export default function JoinClassPage() {
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [invitation, setInvitation] = useState<ClassInvitation | null>(null);
  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationCode = searchParams?.get('code');
  const toast = useToast();
  
  // Renk ayarları
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    if (!invitationCode) {
      setError('Davet kodu bulunamadı');
      setLoading(false);
      return;
    }

    checkInvitation();
  }, [invitationCode]);

  const checkInvitation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Önce kullanıcı oturum bilgisini kontrol et
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        router.push(`/login?redirect=join&code=${invitationCode}`);
        return;
      }

      const userId = sessionData.session.user.id;

      // Öğrenci bilgisini getir
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', userId)
        .single();

      if (studentError) {
        if (studentError.code === 'PGRST116') {
          // Öğrenci kaydı bulunamadı, kullanıcı bir öğretmen olabilir
          setError('Bu işlemi gerçekleştirmek için öğrenci hesabına ihtiyacınız var.');
          setLoading(false);
          return;
        }
        throw studentError;
      }

      setStudent(studentData);

      // Davet kodunu kontrol et
      const { data: invitationData, error: invitationError } = await supabase
        .from('class_invitations')
        .select(`
          *,
          classes (
            id,
            name,
            teacher_id,
            teachers (
              id,
              full_name
            )
          )
        `)
        .eq('invitation_code', invitationCode)
        .single();

      if (invitationError) {
        if (invitationError.code === 'PGRST116') {
          setError('Geçersiz davet kodu. Lütfen doğru bir davet kodu kullanın.');
        } else {
          throw invitationError;
        }
        return;
      }

      setInvitation(invitationData);
      setClassInfo(invitationData.classes as unknown as Class);

      // Davet kodunun geçerliliğini kontrol et
      if (!invitationData.is_active) {
        setError('Bu davet kodu devre dışı bırakılmış.');
        return;
      }

      if (invitationData.expires_at && new Date(invitationData.expires_at) < new Date()) {
        setError('Bu davet kodunun süresi dolmuş.');
        return;
      }

      if (invitationData.max_uses && invitationData.current_uses >= invitationData.max_uses) {
        setError('Bu davet kodu maksimum kullanım limitine ulaşmış.');
        return;
      }

      // Öğrencinin zaten sınıfa kayıtlı olup olmadığını kontrol et
      if (studentData.class_id === invitationData.class_id) {
        setError('Zaten bu sınıfa kayıtlısınız.');
        return;
      }
    } catch (error) {
      console.error('Davetiye kontrol edilirken hata:', error);
      setError('Davetiye bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const joinClass = async () => {
    try {
      setJoining(true);
      
      if (!invitation || !student) {
        throw new Error('Davet veya öğrenci bilgisi eksik');
      }

      // Öğrenciyi sınıfa ekle
      const { error: updateError } = await supabase
        .from('students')
        .update({ class_id: invitation.class_id })
        .eq('id', student.id);

      if (updateError) throw updateError;
      
      // Davet kullanım sayısını arttır
      const { error: inviteUpdateError } = await supabase
        .from('class_invitations')
        .update({ 
          current_uses: invitation.current_uses + 1 
        })
        .eq('id', invitation.id);

      if (inviteUpdateError) throw inviteUpdateError;

      setSuccess(true);
      
      toast({
        title: 'Başarılı',
        description: 'Sınıfa başarıyla katıldınız',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // 3 saniye sonra öğrenci anasayfasına yönlendir
      setTimeout(() => {
        router.push('/students/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Sınıfa katılırken hata:', error);
      toast({
        title: 'Hata',
        description: 'Sınıfa katılırken bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <Flex direction="column" justify="center" align="center" height="80vh">
        <Text mb={6} fontSize="lg" fontWeight="medium">Yükleniyor...</Text>
        <CustomLoader />
      </Flex>
    );
  }

  return (
    <Container maxW="container.md" py={10}>
      <Card 
        bg={cardBg} 
        borderWidth="1px" 
        borderRadius="xl" 
        boxShadow="lg"
        borderColor={borderColor}
        overflow="hidden"
      >
        <CardBody p={8}>
          <VStack spacing={6} align="stretch">
            <Heading textAlign="center" size="lg" mb={2}>
              <BlurText text="Sınıfa Katılım" tag="span" />
            </Heading>

            {error ? (
              <Alert status="error" borderRadius="lg">
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle>Hata</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Box>
              </Alert>
            ) : success ? (
              <Alert status="success" borderRadius="lg">
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle>Başarılı</AlertTitle>
                  <AlertDescription>
                    Sınıfa başarıyla katıldınız. Ana sayfaya yönlendiriliyorsunuz...
                  </AlertDescription>
                </Box>
              </Alert>
            ) : (
              <>
                <Box p={5} borderWidth="1px" borderRadius="lg" borderColor={borderColor}>
                  <Flex align="center" mb={4}>
                    <Box
                      bg="blue.500"
                      color="white"
                      borderRadius="full"
                      p={3}
                      mr={4}
                    >
                      <FaSchool size={24} />
                    </Box>
                    <Box>
                      <Text fontWeight="bold" fontSize="lg">
                        {classInfo?.name || 'Sınıf'}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Öğretmen: {classInfo?.teachers?.full_name || 'Bilinmiyor'}
                      </Text>
                    </Box>
                  </Flex>

                  <Flex align="center">
                    <Box
                      bg="green.500"
                      color="white"
                      borderRadius="full"
                      p={3}
                      mr={4}
                    >
                      <FaUserCheck size={24} />
                    </Box>
                    <Box>
                      <Text fontWeight="bold" fontSize="lg">
                        {student?.name || 'Öğrenci'}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {student?.email || ''}
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                <Text textAlign="center">
                  <b>{classInfo?.name}</b> sınıfına katılmak üzeresiniz. Onaylıyor musunuz?
                </Text>

                <Flex justify="center">
                  <Button
                    colorScheme="green"
                    size="lg"
                    leftIcon={<FaUserPlus />}
                    onClick={joinClass}
                    isLoading={joining}
                    loadingText="Katılınıyor..."
                    px={10}
                  >
                    Sınıfa Katıl
                  </Button>
                </Flex>
              </>
            )}

            <Flex justify="center" mt={4}>
              <Button
                variant="outline"
                onClick={() => router.push('/students/dashboard')}
              >
                Ana Sayfaya Dön
              </Button>
            </Flex>
          </VStack>
        </CardBody>
      </Card>
    </Container>
  );
} 