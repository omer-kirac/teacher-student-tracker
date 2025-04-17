import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Avatar,
  Button,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Input,
  FormControl,
  useToast,
  Link,
  Image,
  Card,
  CardBody,
  Divider,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  HStack,
  VStack,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaDownload, FaLink, FaTrash, FaCommentAlt, FaFileAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { WallPost, WallPostComment } from '@/types';
import { supabase } from '@/lib/supabase';
import CustomButton from './CustomButton';
import { FocusableElement } from '@chakra-ui/utils';

interface ClassWallPostProps {
  post: WallPost;
  currentUserId: string;
  isTeacher: boolean;
  refreshPosts: () => void;
  classId: string;
  isMuted?: boolean;
}

const ClassWallPost: React.FC<ClassWallPostProps> = ({
  post,
  currentUserId,
  isTeacher,
  refreshPosts,
  classId,
  isMuted = false
}) => {
  const [comments, setComments] = useState<WallPostComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const { 
    isOpen: isCommentsOpen, 
    onOpen: onCommentsOpen, 
    onClose: onCommentsClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteDialogOpen, 
    onOpen: onDeleteDialogOpen, 
    onClose: onDeleteDialogClose 
  } = useDisclosure();
  
  const cancelRef = React.useRef<HTMLButtonElement>(null) as React.RefObject<HTMLButtonElement>;

  // Dosya Adını URL'den Parse Et
  const getFileName = (fileUrl: string): string => {
    try {
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      return decodeURIComponent(pathParts[pathParts.length - 1]);
    } catch {
      return fileUrl.split('/').pop() || 'Dosya';
    }
  };

  // Yorumları Yükle
  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('wall_post_comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Yazar bilgilerini ekle
      const commentsWithAuthor = await Promise.all(
        (data || []).map(async (comment) => {
          let authorName = 'Kullanıcı';
          let authorPhoto = null;
          let isTeacher = false;

          // Öğretmen mi kontrol et
          const { data: teacherData } = await supabase
            .from('teachers')
            .select('full_name, photo_url')
            .eq('id', comment.author_id)
            .single();

          if (teacherData) {
            authorName = teacherData.full_name || 'Öğretmen';
            authorPhoto = teacherData.photo_url;
            isTeacher = true;
          } else {
            // Öğrenci bilgilerini al
            const { data: studentData } = await supabase
              .from('students')
              .select('name, photo_url')
              .eq('id', comment.author_id)
              .single();

            if (studentData) {
              authorName = studentData.name;
              authorPhoto = studentData.photo_url;
            }
          }

          return {
            ...comment,
            author_name: authorName,
            author_photo: authorPhoto,
            is_teacher: isTeacher
          };
        })
      );
      
      setComments(commentsWithAuthor);
    } catch (error) {
      console.error('Yorumlar yüklenirken hata:', error);
      toast({
        title: 'Yorumlar yüklenemedi.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingComments(false);
    }
  };

  // Yorum Ekle
  const handleAddComment = async () => {
    if (!newComment.trim() || isMuted) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('wall_post_comments')
        .insert([{
          post_id: post.id,
          author_id: currentUserId,
          content: newComment.trim()
        }])
        .select();

      if (error) throw error;
      
      setNewComment('');
      toast({
        title: 'Yorum eklendi.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Yorumları yeniden yükle
      loadComments();
    } catch (error) {
      console.error('Yorum eklenirken hata:', error);
      toast({
        title: 'Yorum eklenemedi.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Yorum Sil
  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('wall_post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      
      // Yorumları güncelle
      setComments(comments.filter(comment => comment.id !== commentId));
      
      toast({
        title: 'Yorum silindi.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Yorum silinirken hata:', error);
      toast({
        title: 'Yorum silinemedi.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Gönderi Sil
  const handleDeletePost = async () => {
    try {
      const { error } = await supabase
        .from('wall_posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;
      
      onDeleteDialogClose();
      refreshPosts();
      
      toast({
        title: 'Gönderi silindi.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Gönderi silinirken hata:', error);
      toast({
        title: 'Gönderi silinemedi.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Modal'ı açtığımızda yorumları yükle
  const handleOpenComments = () => {
    onCommentsOpen();
    loadComments();
  };

  const formattedDate = format(
    new Date(post.created_at), 
    'd MMMM yyyy, HH:mm', 
    { locale: tr }
  );

  return (
    <Card mb={4} borderRadius="lg" boxShadow="sm" bg={cardBg} borderColor={borderColor} borderWidth="1px">
      <CardBody>
        <Flex justify="space-between" mb={2}>
          <Flex align="center">
            <Avatar 
              size="md" 
              name={post.author_name || 'Kullanıcı'} 
              src={post.author_photo} 
              mr={3} 
            />
            <Box>
              <Flex align="center">
                <Text fontWeight="bold" mr={2}>{post.author_name || 'Kullanıcı'}</Text>
                {post.author_is_teacher && (
                  <Badge colorScheme="blue" fontSize="xs" mr={2}>
                    Öğretmen
                  </Badge>
                )}
              </Flex>
              <Text fontSize="sm" color="gray.500">{formattedDate}</Text>
            </Box>
          </Flex>
          
          {(isTeacher || post.author_id === currentUserId) && (
            <IconButton
              aria-label="Gönderiyi sil"
              icon={<FaTrash />}
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={onDeleteDialogOpen}
            />
          )}
        </Flex>
        
        <Text mt={2} mb={post.file_url || post.link ? 3 : 0} whiteSpace="pre-wrap">
          {post.content}
        </Text>
        
        {post.link && (
          <Link href={post.link} isExternal color="blue.500" display="flex" alignItems="center" mt={2} mb={2}>
            <FaLink style={{ marginRight: 8 }} />
            {post.link}
          </Link>
        )}
        
        {post.file_url && (
          <Box mt={2} mb={2} p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
            {post.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <Box>
                <Image 
                  src={post.file_url} 
                  alt="Ek dosya" 
                  borderRadius="md" 
                  maxH="200px"
                  objectFit="contain"
                  mb={2}
                />
                <Link href={post.file_url} isExternal download>
                  <Button size="sm" leftIcon={<FaDownload />} colorScheme="blue" variant="outline">
                    İndir
                  </Button>
                </Link>
              </Box>
            ) : (
              <Flex align="center">
                <FaFileAlt size={24} style={{ marginRight: 12 }} />
                <Box flex="1">
                  <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                    {getFileName(post.file_url)}
                  </Text>
                </Box>
                <Link href={post.file_url} isExternal download>
                  <Button size="sm" leftIcon={<FaDownload />} colorScheme="blue" variant="outline">
                    İndir
                  </Button>
                </Link>
              </Flex>
            )}
          </Box>
        )}
        
        <Box mt={3}>
          <Button 
            variant="ghost" 
            size="sm" 
            leftIcon={<FaCommentAlt />} 
            onClick={handleOpenComments}
          >
            {post.comments_count || comments.length ? `Yorumlar (${post.comments_count || comments.length})` : 'Yorum Yap'}
          </Button>
        </Box>
      </CardBody>
      
      {/* Yorumlar Modal */}
      <Modal isOpen={isCommentsOpen} onClose={onCommentsClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Yorumlar</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {loadingComments ? (
              <Flex justify="center" p={6}>
                <Text>Yorumlar yükleniyor...</Text>
              </Flex>
            ) : comments.length === 0 ? (
              <Flex justify="center" p={6}>
                <Text>Henüz yorum yok</Text>
              </Flex>
            ) : (
              <VStack spacing={4} align="stretch" mb={6}>
                {comments.map((comment) => (
                  <Box 
                    key={comment.id} 
                    p={3} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    borderColor={borderColor}
                  >
                    <Flex justify="space-between">
                      <Flex align="center" mb={2}>
                        <Avatar 
                          size="xs" 
                          name={comment.author_name} 
                          src={comment.author_photo} 
                          mr={2} 
                        />
                        <Flex align="center">
                          <Text fontWeight="bold" fontSize="sm" mr={1}>
                            {comment.author_name}
                          </Text>
                          {comment.is_teacher && (
                            <Badge colorScheme="blue" fontSize="2xs" variant="outline">
                              Öğretmen
                            </Badge>
                          )}
                        </Flex>
                      </Flex>
                      
                      {(isTeacher || comment.author_id === currentUserId) && (
                        <IconButton
                          aria-label="Yorumu sil"
                          icon={<FaTrash />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDeleteComment(comment.id)}
                        />
                      )}
                    </Flex>
                    <Text fontSize="sm">{comment.content}</Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {format(new Date(comment.created_at), 'd MMM yyyy, HH:mm', { locale: tr })}
                    </Text>
                  </Box>
                ))}
              </VStack>
            )}
            
            {!isMuted && (
              <FormControl>
                <Flex>
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Yorum yaz..."
                    mr={2}
                  />
                  <CustomButton
                    onClick={handleAddComment}
                    _loading={isSubmitting}
                    isDisabled={!newComment.trim() || isMuted}
                    buttonColor="#e50041"
                  >
                    Gönder
                  </CustomButton>
                </Flex>
              </FormControl>
            )}
            
            {isMuted && (
              <Text fontSize="sm" color="red.500" textAlign="center" mt={2}>
                Öğretmen tarafından susturuldunuz. Yorum yapamazsınız.
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" onClick={onCommentsClose}>
              Kapat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Gönderi Silme Onayı */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteDialogClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Gönderiyi Sil
            </AlertDialogHeader>
            <AlertDialogBody>
              Bu gönderiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteDialogClose}>
                İptal
              </Button>
              <CustomButton
                buttonColor="#e50041"
                onClick={handleDeletePost}
                ml={3}
              >
                Sil
              </CustomButton>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Card>
  );
};

export default ClassWallPost; 