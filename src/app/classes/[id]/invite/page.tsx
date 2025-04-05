'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Switch,
  Text,
  VStack,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useClipboard,
  useColorModeValue,
  InputGroup,
  InputRightElement,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { FaClipboard, FaCheck, FaLink, FaTrash, FaTimes, FaPlus } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { ClassInvitation, Class } from '@/types';

export default function ClassInvitePage() {
  const [loading, setLoading] = useState(true);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [invitations, setInvitations] = useState<ClassInvitation[]>([]);
  const [classDetails, setClassDetails] = useState<Class | null>(null);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [hasMaxUses, setHasMaxUses] = useState(false);
  const [maxUses, setMaxUses] = useState(10);
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;
  const toast = useToast();

  // Renk ayarları
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchClassDetails();
    fetchInvitations();
  }, [classId]);

  const fetchClassDetails = async () => {
    try {
      // Kullanıcının oturum bilgilerini kontrol et
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        router.push('/login');
        return;
      }

      // Sınıf bilgilerini getir
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (error) throw error;
      
      setClassDetails(data);
    } catch (error) {
      console.error('Sınıf detayları yüklenirken hata:', error);
      toast({
        title: 'Hata',
        description: 'Sınıf bilgileri yüklenemedi',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('class_invitations')
        .select(`
          *,
          classes (
            id,
            name
          )
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvitations(data || []);
    } catch (error) {
      console.error('Davetiyeler yüklenirken hata:', error);
      toast({
        title: 'Hata',
        description: 'Davetiyeler yüklenemedi',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const createInvitation = async () => {
    try {
      setCreatingInvite(true);

      // Oturum kontrolü
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Rastgele davet kodu oluşturmak için Supabase fonksiyonunu çağır
      const { data: invCode, error: invCodeError } = await supabase.rpc('generate_invitation_code');
      
      if (invCodeError) throw invCodeError;

      // Davetiyeyi oluştur
      const newInvitation = {
        class_id: classId,
        invitation_code: invCode,
        created_by: session.user.id,
        is_active: true,
        current_uses: 0,
        expires_at: hasExpiry ? new Date(expiryDate).toISOString() : null,
        max_uses: hasMaxUses ? maxUses : null,
      };

      const { data, error } = await supabase
        .from('class_invitations')
        .insert([newInvitation])
        .select();

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Davetiye oluşturuldu',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Yeni davetiyeyi ekle
      await fetchInvitations();

      // Form alanlarını sıfırla
      setHasExpiry(false);
      setExpiryDate('');
      setHasMaxUses(false);
      setMaxUses(10);
    } catch (error) {
      console.error('Davetiye oluşturulurken hata:', error);
      toast({
        title: 'Hata',
        description: 'Davetiye oluşturulamadı',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCreatingInvite(false);
    }
  };

  const toggleInvitationStatus = async (invitation: ClassInvitation) => {
    try {
      const { error } = await supabase
        .from('class_invitations')
        .update({ is_active: !invitation.is_active })
        .eq('id', invitation.id);

      if (error) throw error;

      // Davetiye listesini güncelle
      fetchInvitations();

      toast({
        title: 'Başarılı',
        description: `Davetiye ${invitation.is_active ? 'devre dışı bırakıldı' : 'etkinleştirildi'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Davetiye durumu güncellenirken hata:', error);
      toast({
        title: 'Hata',
        description: 'Davetiye durumu güncellenemedi',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const deleteInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('class_invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Davetiye listesini güncelle
      fetchInvitations();

      toast({
        title: 'Başarılı',
        description: 'Davetiye silindi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Davetiye silinirken hata:', error);
      toast({
        title: 'Hata',
        description: 'Davetiye silinemedi',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Davet linkini oluştur
  const generateInviteLink = (invitationCode: string) => {
    return `${window.location.origin}/join?code=${invitationCode}`;
  };

  // Davet linki kopyalama
  const InvitationLink = ({ invitationCode }: { invitationCode: string }) => {
    const inviteLink = generateInviteLink(invitationCode);
    const { hasCopied, onCopy } = useClipboard(inviteLink);
  
    return (
      <InputGroup size="sm">
        <Input value={inviteLink} isReadOnly pr="4.5rem" />
        <InputRightElement width="4.5rem">
          <IconButton
            h="1.75rem"
            size="sm"
            icon={hasCopied ? <FaCheck /> : <FaClipboard />}
            aria-label="Kopyala"
            onClick={onCopy}
            colorScheme={hasCopied ? 'green' : 'blue'}
          />
        </InputRightElement>
      </InputGroup>
    );
  };

  // Davetiye durumunu belirle
  const getInvitationStatus = (invitation: ClassInvitation) => {
    if (!invitation.is_active) {
      return { label: 'Pasif', color: 'gray' };
    }
    
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return { label: 'Süresi Dolmuş', color: 'red' };
    }
    
    if (invitation.max_uses && invitation.current_uses >= invitation.max_uses) {
      return { label: 'Limit Dolmuş', color: 'orange' };
    }
    
    return { label: 'Aktif', color: 'green' };
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">
          {classDetails?.name || 'Sınıf'} - Davet Linkleri
        </Heading>
        <Button 
          onClick={() => router.push(`/classes/${classId}`)} 
          colorScheme="blue" 
          variant="outline"
        >
          Sınıfa Dön
        </Button>
      </Flex>

      <Box 
        mb={8} 
        p={6} 
        borderWidth="1px" 
        borderRadius="lg" 
        bg={cardBg}
        borderColor={borderColor}
      >
        <Heading size="md" mb={4}>Yeni Davet Linki Oluştur</Heading>
        <VStack spacing={4} align="stretch">
          <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="has-expiry" mb="0">
                Son Kullanma Tarihi
              </FormLabel>
              <Switch 
                id="has-expiry" 
                isChecked={hasExpiry} 
                onChange={(e) => setHasExpiry(e.target.checked)} 
              />
            </FormControl>

            {hasExpiry && (
              <FormControl>
                <FormLabel>Tarih Seçin</FormLabel>
                <Input 
                  type="datetime-local" 
                  value={expiryDate} 
                  onChange={(e) => setExpiryDate(e.target.value)} 
                />
              </FormControl>
            )}
          </Flex>

          <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="has-max-uses" mb="0">
                Maksimum Kullanım Sayısı
              </FormLabel>
              <Switch 
                id="has-max-uses" 
                isChecked={hasMaxUses} 
                onChange={(e) => setHasMaxUses(e.target.checked)} 
              />
            </FormControl>

            {hasMaxUses && (
              <FormControl>
                <FormLabel>Kullanım Sayısı</FormLabel>
                <NumberInput 
                  min={1} 
                  max={100} 
                  value={maxUses} 
                  onChange={(valueString) => setMaxUses(parseInt(valueString))}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            )}
          </Flex>

          <Button 
            leftIcon={<FaPlus />}
            colorScheme="green" 
            onClick={createInvitation} 
            isLoading={creatingInvite}
            alignSelf="flex-end"
          >
            Davet Linki Oluştur
          </Button>
        </VStack>
      </Box>

      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
        <CardHeader>
          <Heading size="md">Mevcut Davet Linkleri</Heading>
        </CardHeader>
        <CardBody>
          {invitations.length === 0 ? (
            <Text textAlign="center" color="gray.500">Henüz davet linki oluşturulmamış</Text>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Davet Kodu</Th>
                  <Th>Davet Linki</Th>
                  <Th>Durum</Th>
                  <Th>Kullanım</Th>
                  <Th>Son Kullanım</Th>
                  <Th>İşlemler</Th>
                </Tr>
              </Thead>
              <Tbody>
                {invitations.map((invitation) => {
                  const status = getInvitationStatus(invitation);
                  
                  return (
                    <Tr key={invitation.id}>
                      <Td fontFamily="monospace" fontWeight="bold">
                        {invitation.invitation_code}
                      </Td>
                      <Td>
                        <InvitationLink invitationCode={invitation.invitation_code} />
                      </Td>
                      <Td>
                        <Badge colorScheme={status.color}>{status.label}</Badge>
                      </Td>
                      <Td>
                        {invitation.current_uses}
                        {invitation.max_uses && ` / ${invitation.max_uses}`}
                      </Td>
                      <Td>
                        {invitation.expires_at 
                          ? new Date(invitation.expires_at).toLocaleString() 
                          : 'Süresiz'}
                      </Td>
                      <Td>
                        <Flex gap={2}>
                          <IconButton
                            icon={invitation.is_active ? <FaTimes /> : <FaCheck />}
                            aria-label={invitation.is_active ? 'Devre Dışı Bırak' : 'Etkinleştir'}
                            size="sm"
                            colorScheme={invitation.is_active ? 'red' : 'green'}
                            onClick={() => toggleInvitationStatus(invitation)}
                          />
                          <IconButton
                            icon={<FaTrash />}
                            aria-label="Sil"
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => deleteInvitation(invitation.id)}
                          />
                        </Flex>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </Container>
  );
} 