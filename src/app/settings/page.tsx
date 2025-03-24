'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Text,
  useToast,
  Flex,
  Avatar,
  Divider,
  Badge,
  Spinner,
  useColorModeValue,
  FormHelperText,
  InputGroup,
  InputRightElement,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState({
    email: '',
    full_name: '',
    profile_picture: null as File | null,
    profile_picture_url: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');

  // Kullanıcı oturumunu kontrol et
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }
        
        setUser(session.user);
        
        // Kullanıcı bilgilerini getir
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (teacherError) {
          console.error('Öğretmen bilgileri alınamadı:', teacherError);
          throw teacherError;
        }
        
        // Form verilerini ayarla
        if (teacherData) {
          setProfileData({
            email: session.user.email || '',
            full_name: teacherData.full_name || '',
            profile_picture: null,
            profile_picture_url: teacherData.profile_picture_url || '',
          });
        }
        
      } catch (error) {
        console.error('Kullanıcı bilgileri alınamadı:', error);
        toast({
          title: 'Hata',
          description: 'Kullanıcı bilgileri alınamadı.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router, toast]);

  // Profil bilgilerini güncelle
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setSavingProfile(true);
    
    try {
      // Önce Supabase Auth'da email güncelle
      if (user.email !== profileData.email) {
        const { error: updateEmailError } = await supabase.auth.updateUser({
          email: profileData.email,
        });
        
        if (updateEmailError) throw updateEmailError;
        
        toast({
          title: 'E-posta değişikliği',
          description: 'E-posta adresinizi doğrulamak için yeni adresinize bir bağlantı gönderildi.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Profil fotoğrafını yükle
      let profile_picture_url = profileData.profile_picture_url;
      
      if (profileData.profile_picture) {
        const fileExt = profileData.profile_picture.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, profileData.profile_picture);
        
        if (uploadError) throw uploadError;
        
        profile_picture_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-pictures/${fileName}`;
      }
      
      // Teachers tablosundaki bilgileri güncelle
      const { error: updateError } = await supabase
        .from('teachers')
        .update({
          full_name: profileData.full_name,
          profile_picture_url: profile_picture_url,
        })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: 'Profil güncellendi',
        description: 'Profil bilgileriniz başarıyla güncellendi.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Profil fotoğrafı URL'sini güncelle
      setProfileData({
        ...profileData,
        profile_picture: null,
        profile_picture_url: profile_picture_url,
      });
      
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Profil güncellenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSavingProfile(false);
    }
  };
  
  // Şifre değiştir
  const handleUpdatePassword = async () => {
    if (!user) return;
    
    // Şifre doğrulama
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: 'Hata',
        description: 'Yeni şifreler eşleşmiyor.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (passwordData.new_password.length < 6) {
      toast({
        title: 'Hata',
        description: 'Şifre en az 6 karakter olmalıdır.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setSavingPassword(true);
    
    try {
      // Önce mevcut şifreyi doğrula
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.current_password,
      });
      
      if (signInError) {
        toast({
          title: 'Hata',
          description: 'Mevcut şifre yanlış.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setSavingPassword(false);
        return;
      }
      
      // Şifreyi güncelle
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.new_password,
      });
      
      if (updateError) throw updateError;
      
      toast({
        title: 'Şifre güncellendi',
        description: 'Şifreniz başarıyla güncellendi.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Şifre alanlarını temizle
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Şifre güncellenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSavingPassword(false);
    }
  };
  
  // Profil fotoğrafı yükleme
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Dosya çok büyük',
          description: 'Profil fotoğrafı 2MB\'dan küçük olmalıdır.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setProfileData({
        ...profileData,
        profile_picture: file,
      });
    }
  };
  
  // Inputlardaki değişiklikleri izleme
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="calc(100vh - 60px)">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <Heading mb={6} size="xl" textAlign="center">Hesap Ayarları</Heading>
      
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList mb="1em">
          <Tab>Profil</Tab>
          <Tab>Şifre</Tab>
        </TabList>
        
        <TabPanels>
          {/* Profil Bilgileri Paneli */}
          <TabPanel>
            <Box bg={formBg} p={6} borderRadius="md" boxShadow="md">
              <Flex direction={{ base: 'column', md: 'row' }} mb={6} align="center">
                <Box mr={{ base: 0, md: 6 }} mb={{ base: 4, md: 0 }} textAlign="center">
                  <Avatar 
                    size="xl" 
                    src={profileData.profile_picture 
                      ? URL.createObjectURL(profileData.profile_picture) 
                      : profileData.profile_picture_url || undefined} 
                    name={profileData.full_name} 
                    mb={3}
                  />
                  <Button 
                    size="sm" 
                    colorScheme="blue" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Fotoğraf Değiştir
                  </Button>
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    display="none"
                    onChange={handleFileChange}
                  />
                </Box>
                
                <VStack spacing={4} align="stretch" flex="1">
                  <FormControl>
                    <FormLabel>Ad Soyad</FormLabel>
                    <Input 
                      name="full_name"
                      value={profileData.full_name}
                      onChange={handleProfileChange}
                      placeholder="Ad Soyad"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>E-posta</FormLabel>
                    <Input 
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      placeholder="E-posta"
                      type="email"
                    />
                    <FormHelperText>
                      E-posta değişikliği için doğrulama gerekir.
                    </FormHelperText>
                  </FormControl>
                </VStack>
              </Flex>
              
              <Flex justify="flex-end">
                <Button
                  colorScheme="blue"
                  isLoading={savingProfile}
                  onClick={handleUpdateProfile}
                >
                  Profili Güncelle
                </Button>
              </Flex>
            </Box>
          </TabPanel>
          
          {/* Şifre Değiştirme Paneli */}
          <TabPanel>
            <Box bg={formBg} p={6} borderRadius="md" boxShadow="md">
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Mevcut Şifre</FormLabel>
                  <InputGroup>
                    <Input 
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      placeholder="Mevcut Şifre"
                      type={showCurrentPassword ? 'text' : 'password'}
                    />
                    <InputRightElement>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        aria-label={showCurrentPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                        icon={showCurrentPassword ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Yeni Şifre</FormLabel>
                  <InputGroup>
                    <Input 
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      placeholder="Yeni Şifre"
                      type={showNewPassword ? 'text' : 'password'}
                    />
                    <InputRightElement>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        aria-label={showNewPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                        icon={showNewPassword ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormHelperText>
                    Şifre en az 6 karakter olmalıdır.
                  </FormHelperText>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Yeni Şifre (Tekrar)</FormLabel>
                  <InputGroup>
                    <Input 
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      placeholder="Yeni Şifre (Tekrar)"
                      type={showConfirmPassword ? 'text' : 'password'}
                    />
                    <InputRightElement>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        aria-label={showConfirmPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                        icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                
                <Flex justify="flex-end" mt={2}>
                  <Button
                    colorScheme="blue"
                    isLoading={savingPassword}
                    onClick={handleUpdatePassword}
                  >
                    Şifreyi Güncelle
                  </Button>
                </Flex>
              </VStack>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
} 