'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Link,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Flex,
  keyframes,
} from '@chakra-ui/react';
import { supabase } from '@/lib/supabase';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useTheme } from '@/lib/theme';

// Keyframes for animations
const wiggle = keyframes`
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
`;

const handMove = keyframes`
  from { transform: translateY(30px) rotate(-10deg); }
  to { transform: translateY(0) rotate(20deg); }
`;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [shake, setShake] = useState(false);
  const [formActive, setFormActive] = useState(false);
  const [bearLookPosition, setBearLookPosition] = useState(0);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const toast = useToast();
  const { setTheme } = useTheme();

  // Trigger animation when component mounts
  useEffect(() => {
    setTimeout(() => {
      setFormActive(true);
    }, 300);
  }, []);

  // Ensure light theme on login page
  useEffect(() => {
    // Doğru tema ayarını yap
    setTheme('light');
    
    // Sınıfları temizle
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('dark-mode');
    if (document.querySelector('main')) {
      document.querySelector('main')?.classList.remove('dark-mode');
      document.querySelector('main')?.removeAttribute('data-theme');
    }
    
    // CSS değişkenlerini ayarla
    document.documentElement.style.setProperty('--background', '#ffffff');
    document.documentElement.style.setProperty('--foreground', '#171717');
    document.body.style.backgroundColor = '#ffffff';
  }, [setTheme]);

  // Track email input cursor position for bear head tracking
  useEffect(() => {
    if (isEmailFocused && emailInputRef.current) {
      const inputLength = email.length;
      const maxTilt = 12; // Maximum tilt in either direction
      
      // Calculate position based on text length (0 to 1 range)
      const position = Math.min(inputLength / 20, 1); 
      // Convert to tilt range (-maxTilt to maxTilt)
      const tilt = (position * 2 * maxTilt) - maxTilt;
      
      setBearLookPosition(tilt);
    } else {
      setBearLookPosition(0);
    }
  }, [email, isEmailFocused]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Kullanıcının tipini kontrol et (öğretmen mi öğrenci mi)
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('id', data.user?.id)
        .single();
      
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('id', data.user?.id)
        .single();

      if (teacherData) {
        // Öğretmen ise dashboard'a yönlendir
        router.push('/dashboard');
      } else if (studentData) {
        // Öğrenci ise öğrenci dashboardına yönlendir
        router.push('/students/dashboard');
      } else {
        // Tip belirsiz ise genel dashboard'a yönlendir
        router.push('/dashboard');
      }
      
    } catch (error: any) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      
      toast({
        title: 'Giriş Hatası',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      maxW="sm" 
      mx="auto" 
      mt={8} 
      p={6} 
      borderWidth={1} 
      borderRadius="xl" 
      boxShadow="lg"
      bg="white" 
      color="gray.800"
      className="login-form"
      opacity={formActive ? 1 : 0}
      transform={formActive ? "none" : "translateY(20px)"}
      transition="all 0.5s ease"
      animation={shake ? `${wiggle} 0.5s ease` : "none"}
      sx={{
        "& input, & button": {
          bg: "#FFF3E0",
          color: "gray.800",
        }
      }}
    >
      <VStack spacing={6} align="center">
        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          <VStack spacing={4} align="center">
            <Box 
              position="relative" 
              w="120px" 
              h="120px"
              mb={4}
              animation={`${float} 4s ease-in-out infinite`}
              transform={`rotate(${bearLookPosition}deg)`}
              transition="transform 0.3s ease"
            >
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                borderRadius="full"
                bg="#FFDCBC"
              />
              <Box 
                position="relative" 
                width="100%" 
                height="100%"
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                {/* Bear Face Container */}
                <Box position="relative" width="85px" height="85px">
                  {/* Improved Bear Ears - now attached to the head better */}
                  <Box 
                    position="absolute" 
                    top="-12px" 
                    left="-6px" 
                    width="28px" 
                    height="26px" 
                    borderRadius="50% 50% 50% 50%" 
                    bg="#A67C52"
                    border="4px solid #A67C52"
                    transition="all 0.3s ease"
                    transform={isFocused ? "scale(0.95) rotate(-5deg)" : "scale(1)"}
                    zIndex="1"
                    _before={{
                      content: '""',
                      position: 'absolute',
                      top: '8px',
                      left: '6px',
                      width: '10px',
                      height: '10px',
                      borderRadius: 'full',
                      bg: '#8B5A2B',
                      opacity: 0.6
                    }}
                  />
                  <Box 
                    position="absolute" 
                    top="-12px" 
                    right="-6px" 
                    width="28px" 
                    height="26px" 
                    borderRadius="50% 50% 50% 50%" 
                    bg="#A67C52"
                    border="4px solid #A67C52"
                    transition="all 0.3s ease"
                    transform={isFocused ? "scale(0.95) rotate(5deg)" : "scale(1)"}
                    zIndex="1"
                    _before={{
                      content: '""',
                      position: 'absolute',
                      top: '8px',
                      right: '6px',
                      width: '10px',
                      height: '10px',
                      borderRadius: 'full',
                      bg: '#8B5A2B',
                      opacity: 0.6
                    }}
                  />
                  
                  {/* Bear Face - Improved with better shading and shape */}
                  <Box 
                    width="85px" 
                    height="85px" 
                    borderRadius="full" 
                    bg="#A67C52"
                    boxShadow="inset -5px -5px 10px rgba(0,0,0,0.1), inset 5px 5px 10px rgba(255,255,255,0.1)"
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    position="relative"
                    transition="all 0.3s ease"
                    transform={isFocused ? "scale(1.05)" : "scale(1)"}
                  >
                    {/* Bear Eyes */}
                    <Flex mt="8px" mb="5px" justifyContent="space-around" width="55px" position="relative" zIndex="1">
                      <Box 
                        width="12px" 
                        height={isFocused && !showPassword ? "2px" : "12px"} 
                        borderRadius={isFocused && !showPassword ? "0" : "full"} 
                        bg="#333"
                        boxShadow={isFocused && !showPassword ? "none" : "0 2px 3px rgba(0,0,0,0.1)"}
                        transition="all 0.3s ease"
                        transform={isEmailFocused ? `translateX(${bearLookPosition/2}px)` : "none"}
                      />
                      <Box 
                        width="12px" 
                        height={isFocused && !showPassword ? "2px" : "12px"} 
                        borderRadius={isFocused && !showPassword ? "0" : "full"} 
                        bg="#333"
                        boxShadow={isFocused && !showPassword ? "none" : "0 2px 3px rgba(0,0,0,0.1)"}
                        transition="all 0.3s ease"
                        transform={isEmailFocused ? `translateX(${bearLookPosition/2}px)` : "none"}
                      />
                    </Flex>
                    
                    {/* Bear Hands (covering eyes when password focused and hidden) */}
                    {isFocused && !showPassword && (
                      <>
                        {/* Left Hand */}
                        <Box 
                          position="absolute" 
                          top="22px" 
                          left="15px" 
                          width="24px" 
                          height="18px" 
                          borderRadius="12px 6px 12px 10px"
                          bg="#8B5A2B"
                          transform="rotate(20deg)"
                          zIndex="2"
                          transition="all 0.3s"
                          animation={`${handMove} 0.4s ease-out`}
                          boxShadow="1px 1px 3px rgba(0,0,0,0.2)"
                          _before={{
                            content: '""',
                            position: 'absolute',
                            bottom: '-3px',
                            left: '2px',
                            width: '6px',
                            height: '6px',
                            borderRadius: 'full',
                            bg: '#8B5A2B',
                          }}
                        />
                        {/* Right Hand */}
                        <Box 
                          position="absolute" 
                          top="22px" 
                          right="15px" 
                          width="24px" 
                          height="18px" 
                          borderRadius="6px 12px 10px 12px"
                          bg="#8B5A2B"
                          transform="rotate(-20deg)"
                          zIndex="2"
                          transition="all 0.3s"
                          animation={`${handMove} 0.4s ease-out`}
                          boxShadow="1px 1px 3px rgba(0,0,0,0.2)"
                          _before={{
                            content: '""',
                            position: 'absolute',
                            bottom: '-3px',
                            right: '2px',
                            width: '6px',
                            height: '6px',
                            borderRadius: 'full',
                            bg: '#8B5A2B',
                          }}
                        />
                      </>
                    )}
                    
                    {/* Bear Hands at rest position when not covering eyes */}
                    {(!isFocused || (isFocused && showPassword)) && (
                      <>
                        {/* Left Hand */}
                        <Box 
                          position="absolute" 
                          bottom="4px" 
                          left="-5px" 
                          width="22px" 
                          height="17px" 
                          borderRadius="12px 8px 10px 10px"
                          bg="#8B5A2B"
                          transform="rotate(-10deg)"
                          transition="all 0.3s"
                          boxShadow="1px 1px 3px rgba(0,0,0,0.2)"
                          _before={{
                            content: '""',
                            position: 'absolute',
                            bottom: '-3px',
                            left: '4px',
                            width: '6px',
                            height: '6px',
                            borderRadius: 'full',
                            bg: '#8B5A2B',
                          }}
                        />
                        {/* Right Hand */}
                        <Box 
                          position="absolute" 
                          bottom="4px" 
                          right="-5px" 
                          width="22px" 
                          height="17px" 
                          borderRadius="8px 12px 10px 10px"
                          bg="#8B5A2B"
                          transform="rotate(10deg)"
                          transition="all 0.3s"
                          boxShadow="1px 1px 3px rgba(0,0,0,0.2)"
                          _before={{
                            content: '""',
                            position: 'absolute',
                            bottom: '-3px',
                            right: '4px',
                            width: '6px',
                            height: '6px',
                            borderRadius: 'full',
                            bg: '#8B5A2B',
                          }}
                        />
                      </>
                    )}
                    
                    {/* Bear Nose - Improved with shading */}
                    <Box 
                      width="16px" 
                      height="12px" 
                      borderRadius="50%" 
                      bg="#4A3214"
                      boxShadow="inset -2px -2px 4px rgba(0,0,0,0.2), inset 2px 2px 4px rgba(255,255,255,0.1)"
                      zIndex="1"
                    />
                    
                    {/* Bear Mouth - Improved with better shape */}
                    <Box 
                      width="22px" 
                      height="8px" 
                      mt="5px"
                      borderBottomLeftRadius="12px"
                      borderBottomRightRadius="12px"
                      border="2px solid #4A3214"
                      borderTop="none"
                      zIndex="1"
                      transform={isFocused ? "scaleX(0.8)" : "scaleX(1)"}
                      transition="all 0.3s ease"
                    />
                    
                    {/* Cheeks */}
                    <Box
                      position="absolute"
                      bottom="32px"
                      left="12px"
                      width="12px"
                      height="8px"
                      borderRadius="50%"
                      bg="#C6866C"
                      opacity="0.6"
                      transform={isFocused ? "scale(1.2)" : "scale(1)"}
                      transition="all 0.3s ease"
                    />
                    <Box
                      position="absolute"
                      bottom="32px"
                      right="12px"
                      width="12px"
                      height="8px"
                      borderRadius="50%"
                      bg="#C6866C"
                      opacity="0.6"
                      transform={isFocused ? "scale(1.2)" : "scale(1)"}
                      transition="all 0.3s ease"
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
            
            <FormControl 
              isRequired
              opacity={formActive ? 1 : 0}
              transform={formActive ? "none" : "translateY(20px)"}
              transition="all 0.5s ease 0.1s"
            >
              <FormLabel fontSize="sm" color="gray.600">Email</FormLabel>
              <Input
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                bg="#FFF3E0"
                border="none"
                placeholder="info@qclay.design"
                _placeholder={{ color: 'gray.400' }}
                borderRadius="md"
                _focus={{
                  boxShadow: "0 0 0 2px rgba(166, 124, 82, 0.4)",
                  transform: "translateY(-2px)"
                }}
                transition="all 0.3s ease"
              />
            </FormControl>
            
            <FormControl 
              isRequired
              opacity={formActive ? 1 : 0}
              transform={formActive ? "none" : "translateY(20px)"}
              transition="all 0.5s ease 0.2s"
            >
              <FormLabel fontSize="sm" color="gray.600">Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => {
                    setIsFocused(true);
                    setIsEmailFocused(false);
                  }}
                  onBlur={() => setIsFocused(false)}
                  bg="#FFF3E0"
                  border="none"
                  borderRadius="md"
                  _focus={{
                    boxShadow: "0 0 0 2px rgba(166, 124, 82, 0.4)",
                    transform: "translateY(-2px)"
                  }}
                  transition="all 0.3s ease"
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={() => setShowPassword(!showPassword)}
                    variant="ghost"
                    size="sm"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
            
            <Text 
              fontSize="sm" 
              color="gray.500"
              alignSelf="flex-end"
              opacity={formActive ? 1 : 0}
              transform={formActive ? "none" : "translateY(20px)"}
              transition="all 0.5s ease 0.4s"
            >
              <Link 
                href="/forgot-password" 
                color="gray.500"
                _hover={{ color: "blue.500", textDecoration: "underline" }}
                transition="color 0.2s ease"
              >
                Forgot password?
              </Link>
            </Text>
            
            <Button
              type="submit"
              bg="black"
              color="white"
              width="100%"
              isLoading={loading}
              _hover={{ bg: "gray.800", transform: "translateY(-2px)" }}
              _active={{ bg: "gray.700", transform: "translateY(0)" }}
              borderRadius="md"
              mt={2}
              opacity={formActive ? 1 : 0}
              transform={formActive ? "none" : "translateY(20px)"}
              transition="all 0.5s ease 0.3s, transform 0.2s ease, background 0.2s ease"
              boxShadow="0px 4px 10px rgba(0, 0, 0, 0.1)"
            >
              Log In
            </Button>
            
            <Button
              as={Link}
              href="/register"
              bg="black"
              color="white"
              width="100%"
              _hover={{ bg: "gray.800", transform: "translateY(-2px)" }}
              _active={{ bg: "gray.700", transform: "translateY(0)" }}
              borderRadius="md"
              mt={1}
              opacity={formActive ? 1 : 0}
              transform={formActive ? "none" : "translateY(20px)"}
              transition="all 0.5s ease 0.3s, transform 0.2s ease, background 0.2s ease"
              boxShadow="0px 4px 10px rgba(0, 0, 0, 0.1)"
            >
              Kayıt Ol
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
} 