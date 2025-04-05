import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * E-posta gönderimi test API'si
 * Bu API, e-posta gönderim yapılandırmasını test etmek için kullanılır
 */
export async function GET(request: NextRequest) {
  // URL'den test parametrelerini al
  const url = new URL(request.url);
  const to = url.searchParams.get('to') || process.env.SMTP_USER;
  const subject = url.searchParams.get('subject') || 'Test E-postası';

  try {
    console.log('📧 E-posta gönderim testi başlatılıyor...');
    console.log(`📧 Alıcı: ${to}`);
    console.log(`📧 Konu: ${subject}`);

    // SMTP yapılandırması
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465');
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    if (!user || !pass) {
      return NextResponse.json({
        success: false,
        error: 'SMTP kullanıcı adı veya şifresi tanımlanmamış',
        message: 'Lütfen .env dosyasında SMTP_USER ve SMTP_PASS değerlerini tanımlayın'
      }, { status: 500 });
    }

    console.log(`📧 SMTP yapılandırması: ${host}:${port} (secure: ${secure})`);
    console.log(`📧 SMTP kullanıcı: ${user}`);

    // Transporter oluştur
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      debug: true,
    });

    try {
      // SMTP bağlantısını doğrula
      const verifyResult = await transporter.verify();
      console.log('📧 SMTP sunucusu ile bağlantı başarılı:', verifyResult);
    } catch (verifyError: any) {
      console.error('❌ SMTP sunucusu ile bağlantı kurulamadı:', verifyError.message);
      console.error('❌ Hata kodu:', verifyError.code);
      console.error('❌ Hata detayları:', verifyError);
      
      return NextResponse.json({
        success: false,
        error: 'SMTP sunucusu ile bağlantı kurulamadı',
        details: {
          message: verifyError.message,
          code: verifyError.code
        }
      }, { status: 500 });
    }

    // Test e-postası gönder
    try {
      const info = await transporter.sendMail({
        from: `"Ödev Sistemi Test" <${user}>`,
        to,
        subject,
        text: 'Bu bir test e-postasıdır. E-posta gönderimi başarılı!',
        html: `
          <h2>E-posta Gönderim Testi</h2>
          <p>Bu bir test e-postasıdır.</p>
          <p>E-posta gönderimi <strong>başarılı</strong>!</p>
          <p>Tarih/Saat: ${new Date().toLocaleString('tr-TR')}</p>
          <p>SMTP Ayarları: ${host}:${port} (secure: ${secure ? 'evet' : 'hayır'})</p>
        `,
      });

      console.log(`✅ Test e-postası gönderildi:`, info);
      console.log(`✅ Mesaj ID: ${info.messageId}`);

      return NextResponse.json({
        success: true,
        message: 'Test e-postası başarıyla gönderildi',
        details: {
          messageId: info.messageId,
          to,
          subject
        }
      });
    } catch (mailError: any) {
      console.error('❌ Test e-postası gönderilirken hata oluştu:', mailError.message);
      console.error('❌ Hata kodu:', mailError.code);
      console.error('❌ Hata detayları:', mailError);

      return NextResponse.json({
        success: false,
        error: 'Test e-postası gönderilemedi',
        details: {
          message: mailError.message,
          code: mailError.code
        }
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ Test işlemi sırasında genel hata:', error.message);
    
    return NextResponse.json({
      success: false,
      error: `E-posta testi başarısız: ${error.message}`,
      message: 'İşlem sırasında beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    }, { status: 500 });
  }
} 