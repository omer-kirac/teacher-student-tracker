import React, { useState, useRef } from 'react';
import {
  Box,
  FormControl,
  Textarea,
  Input,
  Flex,
  Text,
  IconButton,
  useToast,
  Button,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Image,
  CloseButton,
} from '@chakra-ui/react';
import { supabase } from '@/lib/supabase';
import { FaLink, FaPaperclip, FaFileAlt } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import CustomButton from './CustomButton';

interface CreateWallPostFormProps {
  classId: string;
  currentUserId: string;
  refreshPosts: () => void;
  isMuted?: boolean;
}

const CreateWallPostForm: React.FC<CreateWallPostFormProps> = ({
  classId,
  currentUserId,
  refreshPosts,
  isMuted = false
}) => {
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  
  // Dosya seçme işlemi
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Dosya önizlemesi oluştur
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };
  
  // Dosya yükleme işlemi
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      // Benzersiz dosya adı oluştur
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Dosyayı yükle
      const { data, error } = await supabase.storage
        .from('wall-post-files')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Dosya URL'ini oluştur
      const { data: urlData } = supabase.storage
        .from('wall-post-files')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      return null;
    }
  };
  
  // Gönderi oluşturma
  const handleSubmit = async () => {
    if (!content.trim() || isMuted) return;
    
    setIsSubmitting(true);
    try {
      let fileUrl = null;
      
      // Dosya varsa yükle
      if (file) {
        fileUrl = await uploadFile(file);
        if (!fileUrl) {
          throw new Error('Dosya yüklenemedi');
        }
      }

      // Yazarın adını ve öğretmen olup olmadığını al
      let authorName = '';
      let authorIsTeacher = false;

      // Önce öğretmen tablosunda kontrol et
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('full_name')
        .eq('id', currentUserId)
        .maybeSingle();

      if (!teacherError && teacherData) {
        authorName = teacherData.full_name || 'Öğretmen';
        authorIsTeacher = true;
      } else {
        // Öğrenci olarak kontrol et
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('name')
          .eq('id', currentUserId)
          .maybeSingle();

        if (!studentError && studentData) {
          authorName = studentData.name;
          authorIsTeacher = false;
        } else {
          authorName = 'Kullanıcı';
          authorIsTeacher = false;
        }
      }
      
      // Gönderiyi oluştur
      const { data, error } = await supabase
        .from('wall_posts')
        .insert([{
          class_id: classId,
          author_id: currentUserId,
          author_name: authorName,
          author_is_teacher: authorIsTeacher,
          content: content.trim(),
          link: link.trim() || null,
          file_url: fileUrl
        }])
        .select();
      
      if (error) throw error;
      
      // Formu sıfırla
      setContent('');
      setLink('');
      setShowLinkInput(false);
      setFile(null);
      setFilePreview(null);
      
      // Başarı mesajı
      toast({
        title: 'Gönderi oluşturuldu.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Gönderileri yenile
      refreshPosts();
    } catch (error) {
      console.error('Gönderi oluşturma hatası:', error);
      toast({
        title: 'Gönderi oluşturulamadı.',
        description: 'Lütfen daha sonra tekrar deneyin.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Dosya bilgisi
  const getFileInfo = () => {
    if (!file) return null;
    
    const fileSize = file.size / 1024 < 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    
    return `${file.name} (${fileSize})`;
  };
  
  return (
    <Box 
      mb={6} 
      p={4} 
      borderWidth="1px" 
      borderRadius="lg" 
      borderColor={borderColor} 
      bg={cardBg}
    >
      <FormControl mb={3} isDisabled={isMuted}>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Sınıf duvarına bir şeyler yazın..."
          minHeight="100px"
          resize="vertical"
          disabled={isMuted}
        />
      </FormControl>
      
      {showLinkInput && (
        <FormControl mb={3} isDisabled={isMuted}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FaLink color="gray.300" />
            </InputLeftElement>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Bağlantı ekleyin..."
              disabled={isMuted}
            />
          </InputGroup>
        </FormControl>
      )}
      
      {/* Dosya önizleme */}
      {file && (
        <Box 
          mb={4} 
          p={3} 
          borderWidth="1px" 
          borderRadius="md" 
          borderColor={borderColor}
          position="relative"
        >
          <CloseButton 
            position="absolute" 
            right="8px" 
            top="8px" 
            onClick={() => {
              setFile(null);
              setFilePreview(null);
            }}
            bg="gray.100"
            _hover={{ bg: 'gray.200' }}
          />
          
          {filePreview ? (
            <Image 
              src={filePreview} 
              alt="Dosya önizleme" 
              maxH="150px" 
              objectFit="contain" 
              my={2} 
            />
          ) : (
            <Flex align="center" p={2}>
              <FaFileAlt size={24} style={{ marginRight: 12 }} />
              <Text fontSize="sm">{getFileInfo()}</Text>
            </Flex>
          )}
        </Box>
      )}
      
      <Flex justify="space-between" align="center">
        <Flex>
          <IconButton
            aria-label="Bağlantı ekle"
            icon={<FaLink />}
            variant="ghost"
            mr={2}
            onClick={() => setShowLinkInput(!showLinkInput)}
            isDisabled={isMuted}
          />
          
          <IconButton
            aria-label="Dosya ekle"
            icon={<FaPaperclip />}
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            isDisabled={isMuted}
          />
          
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept="image/*, application/pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt"
          />
        </Flex>
        
        <CustomButton
          onClick={handleSubmit}
          _loading={isSubmitting}
          isDisabled={!content.trim() || isMuted}
          buttonColor="#e50041"
        >
          Paylaş
        </CustomButton>
      </Flex>
      
      {isMuted && (
        <Text fontSize="sm" color="red.500" mt={2}>
          Öğretmen tarafından susturuldunuz. Gönderi paylaşamazsınız.
        </Text>
      )}
    </Box>
  );
};

export default CreateWallPostForm; 