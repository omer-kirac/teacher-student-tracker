'use client';

import React, { useRef, useState, ChangeEvent } from 'react';
import { Box, Text, HStack, VStack, Button, Flex, CloseButton } from '@chakra-ui/react';
import { useColorModeValue } from '@chakra-ui/react';

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  onFilesSelect?: (files: File[]) => void;
  accept?: string;
  id?: string;
  height?: string;
  width?: string;
  compact?: boolean;
  multiple?: boolean;
  maxFiles?: number;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFileSelect, 
  onFilesSelect,
  accept = 'image/*', 
  id = 'file-upload',
  height = '300px',
  width = '300px',
  compact = false,
  multiple = false,
  maxFiles = 10
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('Dosya seçilmedi');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (multiple) {
      // Çoklu dosya seçimi
      const filesArray = Array.from(files);
      
      // Dosya sayısı kontrolü
      if (selectedFiles.length + filesArray.length > maxFiles) {
        alert(`En fazla ${maxFiles} dosya yükleyebilirsiniz.`);
        return;
      }
      
      setSelectedFiles(prevFiles => [...prevFiles, ...filesArray]);
      setFileName(`${selectedFiles.length + filesArray.length} dosya seçildi`);
      
      if (onFilesSelect) {
        onFilesSelect([...selectedFiles, ...filesArray]);
      }
    } else {
      // Tekli dosya seçimi
      const file = files[0];
      setFileName(file.name);
      setSelectedFile(file);
      onFileSelect(file);
    }
  };
  
  const handleClearFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (multiple) {
      // Tüm dosyaları temizle
      setSelectedFiles([]);
      setFileName('Dosya seçilmedi');
      
      if (onFilesSelect) {
        onFilesSelect([]);
      }
    } else {
      // Tek dosyayı temizle
      setFileName('Dosya seçilmedi');
      setSelectedFile(null);
      onFileSelect(null);
    }
    
    // Input değerini sıfırla
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const removeFile = (index: number) => {
    if (multiple) {
      const newFiles = [...selectedFiles];
      newFiles.splice(index, 1);
      setSelectedFiles(newFiles);
      
      if (newFiles.length === 0) {
        setFileName('Dosya seçilmedi');
      } else {
        setFileName(`${newFiles.length} dosya seçildi`);
      }
      
      if (onFilesSelect) {
        onFilesSelect(newFiles);
      }
    }
  };

  const bgColor = useColorModeValue('rgba(0, 110, 255, 0.041)', 'rgba(0, 110, 255, 0.1)');
  const bgFooter = useColorModeValue('rgba(0, 110, 255, 0.075)', 'rgba(0, 110, 255, 0.15)');
  const borderColor = useColorModeValue('royalblue', '#4287f5');
  const iconColor = useColorModeValue('royalblue', '#60a5fa');
  const textColor = useColorModeValue('black', 'white');
  const iconBgColor = useColorModeValue('rgba(70, 66, 66, 0.103)', 'rgba(70, 66, 66, 0.3)');

  // Kompakt mod için stiller
  const compactStyles = compact ? {
    height: '150px',
    width: '100%',
    iconSize: '60px',
    footerHeight: '36px',
    fontSize: '0.85rem'
  } : {
    height: height,
    width: width,
    iconSize: '100px',
    footerHeight: '40px',
    fontSize: '1rem'
  };

  return (
    <Box 
      sx={{
        '.file-uploader': {
          height: multiple && selectedFiles.length > 0 ? 'auto' : compactStyles.height,
          width: compactStyles.width,
          borderRadius: '10px',
          boxShadow: '4px 4px 30px rgba(0, 0, 0, .2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px',
          gap: '5px',
          backgroundColor: bgColor,
        },
        '.header': {
          flex: '1',
          width: '100%',
          border: `2px dashed ${borderColor}`,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          minHeight: multiple && selectedFiles.length > 0 ? '100px' : 'auto',
        },
        '.header svg': {
          height: compactStyles.iconSize,
          width: 'auto',
          stroke: iconColor,
        },
        '.header p': {
          textAlign: 'center',
          color: textColor,
          marginTop: '10px',
          fontSize: compactStyles.fontSize,
        },
        '.footer': {
          backgroundColor: bgFooter,
          width: '100%',
          height: compactStyles.footerHeight,
          padding: '8px',
          borderRadius: '10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          color: textColor,
          border: 'none',
          fontSize: compactStyles.fontSize,
        },
        '.footer svg.file-icon': {
          height: '130%',
          fill: iconColor,
          backgroundColor: iconBgColor,
          borderRadius: '50%',
          padding: '2px',
          cursor: 'pointer',
          boxShadow: '0 2px 30px rgba(0, 0, 0, 0.205)',
        },
        '.footer svg.trash-icon': {
          height: '130%',
          stroke: iconColor,
          backgroundColor: iconBgColor,
          borderRadius: '50%',
          padding: '2px',
          cursor: 'pointer',
          boxShadow: '0 2px 30px rgba(0, 0, 0, 0.205)',
        },
        '.footer p': {
          flex: '1',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
        '.clear-button': {
          cursor: 'pointer',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        },
        '#file-upload': {
          display: 'none',
        },
        '.file-list': {
          width: '100%',
          marginTop: '10px',
        },
        '.file-item': {
          backgroundColor: 'rgba(0, 110, 255, 0.05)',
          borderRadius: '6px',
          padding: '5px 10px',
          marginBottom: '5px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }
      }}
    >
      <div className="file-uploader">
        <div className="header" onClick={() => fileInputRef.current?.click()}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <path d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            </g>
          </svg>
          <p>{compact ? (multiple ? 'Dosyaları Seç' : 'Dosya Seç') : (multiple ? 'Yüklenecek dosyaları seçmek için tıklayın!' : 'Yüklenecek dosyayı seçmek için tıklayın!')}</p>
        </div>
        
        {multiple && selectedFiles.length > 0 && (
          <div className="file-list">
            {selectedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <Text fontSize="sm" isTruncated maxW="80%">{file.name}</Text>
                <CloseButton size="sm" onClick={() => removeFile(index)} />
              </div>
            ))}
          </div>
        )}
        
        <label htmlFor={id} className="footer">
          <svg className="file-icon" fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <path d="M15.331 6H8.5v20h15V14.154h-8.169z"></path>
              <path d="M18.153 6h-.009v5.342H23.5v-.002z"></path>
            </g>
          </svg>
          <p>{fileName}</p>
          <div className="clear-button" onClick={handleClearFile} title="Dosyayı temizle">
            <svg className="trash-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z" stroke="currentColor" strokeWidth="2"></path>
                <path d="M19.5 5H4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                <path d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z" stroke="currentColor" strokeWidth="2"></path>
              </g>
            </svg>
          </div>
        </label>
        <input
          id={id}
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
          style={{ display: 'none' }}
        />
      </div>
    </Box>
  );
};

export default FileUploader; 