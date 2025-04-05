'use client';

import {
  Box,
  Flex,
  Text,
  IconButton,
  Stack,
  Collapse,
  Icon,
  Link,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorModeValue,
  useDisclosure,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  Container,
  HStack,
  Image,
  Tooltip,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import {
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BellIcon,
  SettingsIcon,
} from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import NextLink from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FiUsers, FiBook, FiBarChart2 } from 'react-icons/fi';

// Create a motion flex component for animation
const MotionFlex = motion(Flex);
const MotionBox = motion(Box);

export default function Navbar() {
  const { isOpen, onToggle } = useDisclosure();
  const bgColor = useColorModeValue('white', 'gray.900');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Kullanıcı profilini getir
          const { data: profileData, error } = await supabase
            .from('teachers')
            .select('full_name, profile_picture_url')
            .eq('id', session.user.id)
            .single();
            
          if (!error && profileData) {
            setUserProfile(profileData);
          }
        }
      } catch (error) {
        console.error('Kullanıcı bilgileri alınırken hata:', error);
      }
    };
    
    checkUser();
  }, []);
  
  const handleLogout = async () => {
    try {
      // Önce oturumu kapat, sonra diğer state'leri temizle
      await supabase.auth.signOut();
      
      // State'leri temizle
      setUser(null);
      setUserProfile(null);
      
      // Tarayıcıdaki localStorage/sessionStorage verilerini temizle
      localStorage.clear();
      sessionStorage.clear();
      
      // Tema sınıflarını manuel olarak temizle
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      document.body.classList.remove('dark-mode');
      if (document.querySelector('main')) {
        document.querySelector('main')?.classList.remove('dark-mode');
        document.querySelector('main')?.removeAttribute('data-theme');
      }
      
      // CSS değişkenlerini sıfırla ve açık tema değerlerini ayarla
      document.documentElement.style.setProperty('--background', '#ffffff');
      document.documentElement.style.setProperty('--foreground', '#171717');
      document.body.style.backgroundColor = '#ffffff';
      
      // Sayfa yenilenirse, kullanıcı bilgileri tamamen silinmiş olacaktır
      window.location.href = '/login';
    } catch (error) {
      console.error('Çıkış yapılırken bir hata oluştu:', error);
      // Hata durumunda da yönlendirme yap
      window.location.href = '/login'; 
    }
  };

  // Add a second useEffect hook to check if we should hide the navbar
  useEffect(() => {
    // This useEffect doesn't do anything except maintain hook order
  }, []);

  return (
    <Box position="sticky" top={0} zIndex={100}>
      <MotionFlex
        bg={bgColor}
        color={textColor}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={borderColor}
        align={'center'}
        boxShadow="sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center" width="full">
            <HStack spacing={{ base: 2, md: 4 }}>
              <Flex
                flex={{ base: 1, md: 'auto' }}
                display={{ base: 'flex', md: 'none' }}>
                <IconButton
                  onClick={onToggle}
                  icon={
                    isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
                  }
                  variant={'ghost'}
                  aria-label={'Toggle Navigation'}
                  size="sm"
                />
              </Flex>
              
              <MotionFlex
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                whileHover={{ scale: 1.05 }}
                align="center"
              >
                <Text
                  fontFamily={'heading'}
                  fontWeight="bold"
                  fontSize={{ base: 'md', md: 'lg' }}
                  color={useColorModeValue('blue.600', 'blue.300')}
                  mr={4}
                  display={{ base: 'none', md: 'block' }}
                >
                  Öğrenci Takip
                </Text>
              </MotionFlex>
              
              {/* Desktop Navigation */}
              <Flex display={{ base: 'none', md: 'flex' }}>
                <DesktopNav />
              </Flex>
            </HStack>
            
            {/* User section */}
            <HStack spacing={3}>
              <Box display="flex" alignItems="center" mr={1}>
                <ThemeSwitcher />
              </Box>
              
              {/* Notification Icon */}
              <Tooltip label="Bildirimler" hasArrow placement="bottom">
                <IconButton
                  aria-label="Notifications"
                  icon={<BellIcon />}
                  variant="ghost"
                  borderRadius="full"
                  size="sm"
                />
              </Tooltip>
              
              {/* User Menu - Always visible with fallback */}
              <Menu>
                <MenuButton
                  as={Button}
                  rounded={'full'}
                  variant={'link'}
                  cursor={'pointer'}
                  minW={0}
                >
                  <Avatar
                    size={'sm'}
                    src={userProfile?.profile_picture_url}
                    name={userProfile?.full_name || (user ? user.email : 'Kullanıcı')}
                    boxShadow="md"
                    border="2px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.700')}
                  />
                </MenuButton>
                <MenuList zIndex={1001} shadow="lg" borderRadius="xl" py={2}>
                  <VStack align="start" px={3} py={2} borderBottomWidth="1px" borderColor={borderColor} mb={1}>
                    <Text fontWeight="bold">{userProfile?.full_name || (user ? user.email : 'Kullanıcı')}</Text>
                    {user && <Text fontSize="xs" color="gray.500">{user.email}</Text>}
                  </VStack>
                  <MenuItem as={NextLink} href="/settings" icon={<SettingsIcon />} fontSize="sm">
                    Hesap Ayarları
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem fontSize="sm" onClick={handleLogout} icon={<Icon as={CloseIcon} />}>
                    Çıkış Yap
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </Container>
      </MotionFlex>

      <Collapse in={isOpen} animateOpacity>
        <MobileNav />
      </Collapse>
    </Box>
  );
}

const DesktopNav = () => {
  const linkColor = useColorModeValue('gray.600', 'gray.300');
  const linkHoverColor = useColorModeValue('gray.800', 'white');
  const popoverContentBgColor = useColorModeValue('white', 'gray.900');
  const activeColor = useColorModeValue('blue.500', 'blue.300');
  const pathname = usePathname();

  return (
    <Stack direction={'row'} spacing={4}>
      {NAV_ITEMS.map((navItem) => {
        const isActive = pathname?.startsWith(navItem.href || '#');
        
        return (
          <Box key={navItem.label}>
            <Popover trigger={'hover'} placement={'bottom-start'}>
              <PopoverTrigger>
                <Link
                  p={2}
                  href={navItem.href ?? '#'}
                  fontSize={'sm'}
                  fontWeight={500}
                  color={isActive ? activeColor : linkColor}
                  borderBottom={isActive ? '2px solid' : 'none'}
                  borderColor={activeColor}
                  _hover={{
                    textDecoration: 'none',
                    color: linkHoverColor,
                  }}>
                  {navItem.label}
                </Link>
              </PopoverTrigger>

              {navItem.children && (
                <PopoverContent
                  border={0}
                  boxShadow={'xl'}
                  bg={popoverContentBgColor}
                  p={4}
                  rounded={'xl'}
                  minW={'sm'}>
                  <Stack>
                    {navItem.children.map((child) => (
                      <DesktopSubNav key={child.label} {...child} />
                    ))}
                  </Stack>
                </PopoverContent>
              )}
            </Popover>
          </Box>
        );
      })}
    </Stack>
  );
};

const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
  return (
    <Link
      href={href}
      role={'group'}
      display={'block'}
      p={2}
      rounded={'md'}
      _hover={{ bg: useColorModeValue('blue.50', 'gray.900') }}>
      <Stack direction={'row'} align={'center'}>
        <Box>
          <Text
            transition={'all .3s ease'}
            _groupHover={{ color: 'blue.400' }}
            fontWeight={500}>
            {label}
          </Text>
          <Text fontSize={'sm'}>{subLabel}</Text>
        </Box>
        <Flex
          transition={'all .3s ease'}
          transform={'translateX(-10px)'}
          opacity={0}
          _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
          justify={'flex-end'}
          align={'center'}
          flex={1}>
          <Icon color={'blue.400'} w={5} h={5} as={ChevronRightIcon} />
        </Flex>
      </Stack>
    </Link>
  );
};

const MobileNav = () => {
  const bgColor = useColorModeValue('white', 'gray.900');
  
  return (
    <Stack
      bg={bgColor}
      p={4}
      display={{ md: 'none' }}
      borderBottomWidth={1}
      borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      boxShadow="md">
      {NAV_ITEMS.map((navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} />
      ))}
    </Stack>
  );
};

const MobileNavItem = ({ label, children, href }: NavItem) => {
  const { isOpen, onToggle } = useDisclosure();
  const pathname = usePathname();
  const isActive = pathname?.startsWith(href || '#');
  const activeColor = useColorModeValue('blue.500', 'blue.300');
  const textColor = useColorModeValue('gray.600', 'gray.200');

  return (
    <Stack spacing={4} onClick={children && onToggle}>
      <Flex
        py={2}
        as={Link}
        href={href ?? '#'}
        justify={'space-between'}
        align={'center'}
        _hover={{
          textDecoration: 'none',
        }}>
        <Text
          fontWeight={600}
          color={isActive ? activeColor : textColor}>
          {label}
        </Text>
        {children && (
          <Icon
            as={ChevronDownIcon}
            transition={'all .25s ease-in-out'}
            transform={isOpen ? 'rotate(180deg)' : ''}
            w={6}
            h={6}
          />
        )}
      </Flex>

      <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
        <Stack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          align={'start'}>
          {children &&
            children.map((child) => (
              <Link key={child.label} py={2} href={child.href}>
                {child.label}
              </Link>
            ))}
        </Stack>
      </Collapse>
    </Stack>
  );
};

interface NavItem {
  label: string;
  subLabel?: string;
  children?: Array<NavItem>;
  href?: string;
}

const NAV_ITEMS: Array<NavItem> = [
  {
    label: 'Panel',
    href: '/dashboard',
  },
  {
    label: 'Sınıflar',
    children: [
      {
        label: 'Tüm Sınıflarım',
        subLabel: 'Tüm sınıflarınızı görüntüleyin',
        href: '/classes-all',
      },
      {
        label: 'Sınıf Sıralaması',
        subLabel: 'Sınıfların performans karşılaştırması',
        href: '/classes-ranking',
      },
    ],
  },
  {
    label: 'Öğrenciler',
    children: [
      {
        label: 'Öğrenci Listesi',
        subLabel: 'Tüm öğrencileri görüntüle',
        href: '/students',
      },
      {
        label: 'Performans Analizi',
        subLabel: 'Öğrenci performansını incele',
        href: '/performance',
      },
    ],
  },
]; 