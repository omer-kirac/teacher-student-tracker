import nodemailer from 'nodemailer';
import { Assignment, Student, Teacher } from '@/types';

// Mail göndermek için kullanılacak transporter 
// Not: Gerçek uygulama için bu yapılandırmaları .env dosyasından almak daha güvenli olacaktır
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465');
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  
  if (!user || !pass) {
    console.warn('⚠️ SMTP kullanıcı adı veya şifresi tanımlanmamış!');
    console.warn('⚠️ Lütfen .env dosyasında SMTP_USER ve SMTP_PASS değerlerini tanımlayın.');
  }
  
  if (!host) {
    console.warn('⚠️ SMTP sunucu adresi tanımlanmamış!');
    console.warn('⚠️ Lütfen .env dosyasında SMTP_HOST değerini tanımlayın.');
  }
  
  console.log(`📧 SMTP yapılandırması: ${host}:${port} (secure: ${secure})`);
  console.log(`📧 SMTP kullanıcı: ${user}`);
  
  // Gmail için SSL modunda (port 465) yapılandırma 
  if (host.includes('gmail.com') && port === 465) {
    console.log('📧 Gmail SSL modu kullanılıyor (port 465)');
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL için true
      auth: {
        user,
        pass,
      },
      debug: true, // Debug modunu açık tut
    });
  }
  
  // Gmail için TLS modunda (port 587) yapılandırma
  if (host.includes('gmail.com') && port === 587) {
    console.log('📧 Gmail TLS modu kullanılıyor (port 587)');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true,
    });
  }
  
  // En son çare - direct transport
  if (user && pass && host.includes('gmail.com')) {
    // Daha basit Gmail yapılandırması (son çare)
    console.log('📧 Basit Gmail yöntemi deneniyor (son çare)');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
      debug: true,
    });
  }
  
  // Diğer SMTP sunucuları için genel ayarlar
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true,
  });
};

/**
 * Mail gönderim işlemi
 * Hata durumlarını düzgün şekilde yakalar ve raporlar
 */
const sendMail = async (mailOptions: nodemailer.SendMailOptions): Promise<boolean> => {
  try {
    // Transporter oluştur
    const transporter = createTransporter();
    
    // SMTP bağlantısını doğrula (güvenli mod - bağlantı doğrulamasını atla)
    try {
      await transporter.verify();
      console.log('📧 SMTP sunucusu ile bağlantı başarılı.');
    } catch (verifyError: any) {
      console.error('❌ SMTP sunucusu ile bağlantı kurulamadı:', verifyError.message);
      console.error('❌ Hata kodu:', verifyError.code);
      console.error('❌ Hata detayları:', verifyError);
      
      // Bazı durumlarda bağlantı doğrulama hatasını atlayıp devam etmeyi deneyebiliriz
      console.log('⚠️ Bağlantı doğrulama hatası atlanarak e-posta gönderimi denenecek...');
    }
    
    // E-posta gönder
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 E-posta gönderildi: ${info.messageId}`);
      console.log(`📧 Alıcı: ${mailOptions.to}`);
      return true;
    } catch (mailError: any) {
      console.error('❌ E-posta gönderimi başarısız:', mailError.message);
      console.error('❌ Hata kodu:', mailError.code);
      console.error('❌ Hata detayları:', mailError);
      throw mailError;
    }
  } catch (error: any) {
    console.error('❌ E-posta gönderilirken hata oluştu:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('❌ Kimlik doğrulama hatası: Kullanıcı adı veya şifre yanlış.');
      console.error('❌ Gmail kullanıyorsanız, "Daha az güvenli uygulama erişimi" ayarını etkinleştirin veya uygulama şifresi kullanın.');
    } else if (error.code === 'ESOCKET') {
      console.error('❌ Bağlantı hatası: SMTP sunucusuna bağlanılamadı.');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('❌ Zaman aşımı: SMTP sunucusu yanıt vermedi.');
    } else if (error.code === 'EENVELOPE') {
      console.error('❌ Zarf hatası: E-posta adresleri geçerli değil.');
    }
    
    throw error;
  }
};

// Öğretmen yeni ödev oluşturduğunda öğrencilere bildirim gönder
export async function sendAssignmentNotification(
  teacher: Teacher,
  students: Student[],
  assignment: Assignment
) {
  if (!teacher.email) {
    throw new Error('Öğretmenin e-posta adresi bulunamadı.');
  }
  
  if (students.length === 0) {
    throw new Error('Bildirim gönderilecek öğrenci bulunamadı.');
  }
  
  const dueDate = new Date(assignment.due_date).toLocaleDateString('tr-TR');
  console.log(`📧 "${assignment.title}" ödevi için bildirim gönderimi başlatılıyor...`);
  
  // Tüm öğrencilere e-posta gönder
  for (const student of students) {
    try {
      if (!student.email) {
        console.warn(`⚠️ ${student.name} öğrencisinin e-posta adresi yok, atlanıyor...`);
        continue;
      }
      
      console.log(`📧 E-posta gönderiliyor: ${student.email}`);
      
      // E-posta gönder
      await sendMail({
        from: `"${teacher.full_name}" <${teacher.email}>`,
        to: student.email,
        subject: `Yeni Ödev: ${assignment.title}`,
        text: `${teacher.full_name} öğretmeni "${assignment.title}" ödevini tanımladı. Son teslim tarihi: ${dueDate}`,
        html: `
          <h2>Yeni Ödev Bildirim</h2>
          <p><strong>${teacher.full_name}</strong> öğretmeni <strong>"${assignment.title}"</strong> adlı yeni bir ödev tanımladı.</p>
          <p>Son teslim tarihi: <strong>${dueDate}</strong></p>
          ${assignment.description ? `<p>Açıklama: ${assignment.description}</p>` : ''}
          <p>Ödevi zamanında teslim etmeyi unutmayınız.</p>
        `,
      });
      
      console.log(`✅ Bildirim gönderildi: ${student.email}`);
    } catch (error: any) {
      console.error(`❌ ${student.email} adresine bildirim gönderilemedi:`, error.message);
      // Bir öğrenciye gönderimde hata olsa bile diğer öğrencilere devam edelim
    }
  }
}

// Öğrenci ödevi teslim ettiğinde öğretmene bildirim gönder
export async function sendSubmissionNotification(
  teacher: Teacher,
  student: Student, 
  assignment: Assignment
) {
  if (!teacher.email) {
    throw new Error('Öğretmenin e-posta adresi bulunamadı.');
  }
  
  console.log(`📧 "${assignment.title}" ödevinin teslim bildirimi gönderiliyor...`);
  console.log(`📧 Öğrenci: ${student.name}`);
  console.log(`📧 Öğretmen: ${teacher.full_name} (${teacher.email})`);
  
  // E-posta gönder
  return await sendMail({
    from: `"Ödev Sistemi" <${process.env.SMTP_USER}>`,
    to: teacher.email,
    subject: `Ödev Teslimi: ${assignment.title}`,
    text: `${student.name} adlı öğrenci "${assignment.title}" ödevini teslim etti.`,
    html: `
      <h2>Ödev Teslim Bildirimi</h2>
      <p><strong>${student.name}</strong> adlı öğrenci <strong>"${assignment.title}"</strong> adlı ödevi teslim etti.</p>
      <p>Değerlendirmek için ödev sistemine giriş yapabilirsiniz.</p>
    `,
  });
}

// Teslim tarihi geçmiş ödevler için öğrencilere hatırlatma
export async function sendMissingSubmissionReminder(
  teacher: Teacher,
  student: Student,
  assignment: Assignment
) {
  if (!student.email) {
    throw new Error(`${student.name} öğrencisinin e-posta adresi bulunamadı.`);
  }
  
  console.log(`📧 "${assignment.title}" ödevi için gecikme hatırlatması gönderiliyor...`);
  console.log(`📧 Öğrenci: ${student.name} (${student.email})`);
  
  // E-posta gönder
  return await sendMail({
    from: `"${teacher.full_name}" <${teacher.email || process.env.SMTP_USER}>`,
    to: student.email,
    subject: `Gecikmiş Ödev Hatırlatması: ${assignment.title}`,
    text: `${assignment.title} adlı ödevin teslim tarihi geçti ve henüz teslim etmediniz.`,
    html: `
      <h2>Gecikmiş Ödev Hatırlatması</h2>
      <p><strong>"${assignment.title}"</strong> adlı ödevin teslim tarihi geçti ve henüz teslim etmediniz.</p>
      <p>Lütfen en kısa sürede ödevinizi teslim ediniz.</p>
    `,
  });
} 