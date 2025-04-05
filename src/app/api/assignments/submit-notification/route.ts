import { NextRequest, NextResponse } from 'next/server';
import { sendSubmissionNotification } from '@/lib/utils/mail';
import { createClient } from '@supabase/supabase-js';
import { Student, Teacher, Assignment } from '@/types';

// Supabase istemcisini oluştur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Servis rolü anahtarını doğrula
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY tanımlanmamış! RLS politikaları nedeniyle sorunlar çıkabilir.');
  console.warn('⚠️ .env dosyasına SUPABASE_SERVICE_ROLE_KEY ekleyin ve daha fazla izin verin.');
}

/**
 * Ödev teslim edildiğinde öğretmene bildirim gönderen API
 * İstek parametreleri:
 * - studentId: Öğrenci ID'si
 * - assignmentId: Ödev ID'si
 */
export async function POST(request: NextRequest) {
  try {
    // İstek gövdesini al
    const requestBody = await request.json();
    const { studentId, assignmentId } = requestBody;
    
    // Zorunlu parametreleri kontrol et
    if (!studentId || !assignmentId) {
      return NextResponse.json({ 
        success: false,
        error: 'Öğrenci ID ve Ödev ID parametreleri gereklidir' 
      }, { status: 400 });
    }
    
    // UUID formatını kontrol et
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(assignmentId) || !uuidRegex.test(studentId)) {
      return NextResponse.json({ 
        success: false,
        error: 'Geçersiz ID formatı. Öğrenci ID ve Ödev ID, UUID formatında olmalıdır.'
      }, { status: 400 });
    }
    
    console.log(`📋 Ödev teslim bildirimi işleniyor: Öğrenci ID: ${studentId}, Ödev ID: ${assignmentId}`);

    // 1. Ödev bilgilerini getir
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();
    
    if (assignmentError || !assignment) {
      console.error('❌ Ödev bulunamadı:', assignmentError);
      return NextResponse.json({ 
        success: false,
        error: 'Ödev bulunamadı',
        details: assignmentError,
        message: 'Belirtilen ID ile ödev bulunamadı. Lütfen geçerli bir ödev ID\'si kullandığınızdan emin olun.',
        providedId: assignmentId
      }, { status: 404 });
    }
    
    console.log(`✅ Ödev bulundu: "${assignment.title}"`);
    
    // 2. Öğrenci bilgilerini getir
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    
    if (studentError || !student) {
      console.error('❌ Öğrenci bulunamadı:', studentError);
      return NextResponse.json({ 
        success: false,
        error: 'Öğrenci bulunamadı',
        message: 'Belirtilen ID ile öğrenci bulunamadı.'
      }, { status: 404 });
    }
    
    console.log(`✅ Öğrenci bulundu: ${student.name}`);
    
    // 3. Öğretmen bilgilerini getir
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', assignment.created_by)
      .single();
    
    if (teacherError || !teacher) {
      console.error('❌ Öğretmen bulunamadı:', teacherError);
      return NextResponse.json({ 
        success: false,
        error: 'Öğretmen bulunamadı',
        message: 'Ödev sahibi öğretmen bulunamadı.' 
      }, { status: 404 });
    }
    
    console.log(`✅ Öğretmen bulundu: ${teacher.full_name} (${teacher.email})`);
    
    // Öğretmenin e-posta adresi yoksa uyarı ver
    if (!teacher.email) {
      console.warn('⚠️ Öğretmenin e-posta adresi bulunmamaktadır.');
      return NextResponse.json({
        success: true,
        message: 'Ödev teslimi kaydedildi ancak öğretmenin e-posta adresi olmadığı için bildirim gönderilemedi.'
      });
    }
    
    // 4. Öğretmene e-posta gönder
    console.log(`📧 E-posta bildirimi gönderiliyor...`);
    console.log(`📧 Gönderen: Ödev Sistemi`);
    console.log(`📧 Alıcı: ${teacher.full_name} (${teacher.email})`);
    console.log(`📧 Konu: ${student.name} - ${assignment.title}`);
    
    try {
      await sendSubmissionNotification(
        teacher as Teacher,
        student as Student,
        assignment as Assignment
      );
      console.log(`✅ Öğretmene e-posta bildirimi başarıyla gönderildi.`);
      
      // 5. Sonucu döndür
      return NextResponse.json({
        success: true,
        message: `Ödev teslimi kaydedildi ve ${teacher.full_name} öğretmene bildirim gönderildi.`
      });
    } catch (error: any) {
      console.error('❌ E-posta gönderilirken hata oluştu:', error);
      console.error('❌ Hata detayları:', error.message);
      
      return NextResponse.json({
        success: true, // Ödev teslimi başarılı olduğu için true dönüyoruz
        message: 'Ödev teslimi kaydedildi ancak öğretmene bildirim gönderilemedi.',
        error: error.message
      });
    }
  } catch (error: any) {
    console.error('❌ Ödev teslim bildirimi gönderilirken genel hata:', error);
    return NextResponse.json({
      success: false,
      error: `Bildirim gönderilemedi: ${error.message}`,
      message: 'İşlem sırasında beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    }, { status: 500 });
  }
} 