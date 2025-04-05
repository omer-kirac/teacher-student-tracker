import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAssignmentNotification } from '@/lib/utils/mail';
import { Student, Teacher, Assignment } from '@/types';

// Supabase istemcisini oluştur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Servis rolü anahtarını veya anon anahtarını kullan
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
 * Yeni oluşturulan ödevler için öğrencilere bildirim gönderen API
 * İstek parametreleri:
 * - assignmentId: Ödev ID'si
 */
export async function POST(request: NextRequest) {
  try {
    // İstek gövdesini al
    const requestBody = await request.json();
    const { assignmentId } = requestBody;
    
    // URL'den parametre alın (debug için alternatif)
    const url = new URL(request.url);
    const urlAssignmentId = url.searchParams.get('assignmentId');
    
    // Öncelikle istek gövdesindeki, yoksa URL'deki ID'yi kullan
    const finalAssignmentId = assignmentId || urlAssignmentId;
    
    if (!finalAssignmentId) {
      return NextResponse.json({ 
        success: false,
        error: 'Ödev ID\'si gereklidir',
        help: 'ID\'yi istek gövdesinde `assignmentId` anahtarı ile veya URL\'de `?assignmentId=...` şeklinde gönderebilirsiniz.' 
      }, { status: 400 });
    }
    
    // UUID formatını kontrol et (çok basit bir kontrol)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(finalAssignmentId)) {
      return NextResponse.json({ 
        success: false,
        error: 'Geçersiz Ödev ID formatı. UUID formatında bir ID gönderilmelidir.'
      }, { status: 400 });
    }
    
    console.log(`📋 Ödev ID: ${finalAssignmentId} için bildirim gönderme işlemi başlatılıyor...`);
    
    // 1. Ödev bilgilerini getir
    console.log(`🔍 Sorgu: from('assignments').select('*, classes(*)').eq('id', ${finalAssignmentId}).single()`);
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*, classes(*)')
      .eq('id', finalAssignmentId)
      .single();
    
    if (assignmentError || !assignment) {
      console.error('❌ Ödev bulunamadı:', assignmentError);
      
      // Sorgunun sonucunu debug et
      console.log('🐞 Debug: Tüm ödevleri kontrol edelim...');
      const { data: allAssignments, error: allError } = await supabase
        .from('assignments')
        .select('id, title')
        .limit(5);
      
      if (allError) {
        console.error('❌ Ödevler listelenirken hata:', allError);
      } else {
        console.log(`🐞 Bulunan ödevler (${allAssignments?.length || 0}):`);
        console.log(allAssignments);
      }
      
      return NextResponse.json({ 
        success: false,
        error: 'Ödev bulunamadı',
        details: assignmentError,
        message: 'Belirtilen ID ile ödev bulunamadı. Lütfen geçerli bir ödev ID\'si kullandığınızdan emin olun.',
        providedId: finalAssignmentId,
        debugInfo: {
          supabaseUrl,
          useServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      }, { status: 404 });
    }
    
    console.log(`✅ Ödev bulundu: "${assignment.title}"`);
    
    // 2. Öğretmen bilgilerini getir
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
        message: 'Ödev sahibi öğretmen bulunamadı. Lütfen daha sonra tekrar deneyin.'
      }, { status: 404 });
    }
    
    console.log(`✅ Öğretmen bulundu: ${teacher.full_name} (${teacher.email})`);
    
    // 3. Sınıftaki tüm öğrencileri getir
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', assignment.class_id);
    
    if (studentsError) {
      console.error('❌ Öğrenciler getirilemedi:', studentsError);
      return NextResponse.json({ 
        success: false,
        error: 'Öğrenciler getirilemedi',
        message: 'Sınıftaki öğrenciler getirilemedi. Lütfen daha sonra tekrar deneyin.'
      }, { status: 500 });
    }
    
    console.log(`✅ ${students?.length || 0} öğrenci bulundu`);
    
    // 4. Bildirimleri işle
    const results = {
      total: students?.length || 0,
      success: 0,
      skipped: 0,
      hasEmailAddresses: students?.filter(student => student.email)?.length || 0
    };
    
    const skippedStudents: string[] = [];
    
    // Hiç öğrenci bulunamazsa uyarı ver
    if (!students || students.length === 0) {
      console.warn('⚠️ Bu sınıfta öğrenci bulunmamaktadır.');
      return NextResponse.json({
        success: true,
        message: 'Ödev kaydedildi ancak sınıfta öğrenci bulunmadığı için bildirim gönderilmedi.',
        results: {
          total: 0,
          success: 0,
          skipped: 0
        }
      });
    }
    
    // E-posta adresi olan öğrenci yoksa uyarı ver
    if (results.hasEmailAddresses === 0) {
      console.warn('⚠️ Bu sınıftaki hiçbir öğrencinin e-posta adresi bulunmamaktadır.');
      return NextResponse.json({
        success: true,
        message: 'Ödev kaydedildi ancak öğrencilerin e-posta adresleri olmadığı için bildirim gönderilemedi.',
        results: {
          total: results.total,
          success: 0,
          skipped: results.total
        }
      });
    }
    
    // E-posta bildirimi için gerekli bilgileri hazırla
    console.log(`📧 E-posta bildirimi gönderiliyor: "${assignment.title}"`);
    console.log(`📧 Gönderen: ${teacher.full_name} (${teacher.email})`);
    console.log(`📧 Alıcı sayısı: ${results.hasEmailAddresses} öğrenci`);
    
    try {
      // E-posta gönder
      const emailStudents = students.filter(student => student.email) as Student[];
      
      if (emailStudents.length > 0) {
        await sendAssignmentNotification(
          teacher as Teacher,
          emailStudents,
          assignment as Assignment
        );
        
        // Başarılı bildirimleri güncelle
        results.success = emailStudents.length;
        results.skipped = students.length - emailStudents.length;
        
        // E-posta adresi olmayan öğrencileri listele
        skippedStudents.push(...students
          .filter(student => !student.email)
          .map(student => `${student.name} (e-posta adresi yok)`)
        );
        
        console.log(`✅ ${results.success} öğrenciye e-posta bildirimi gönderildi`);
        if (results.skipped > 0) {
          console.log(`⚠️ ${results.skipped} öğrenci e-posta adresi olmadığı için atlandı`);
        }
      }
    } catch (error: any) {
      console.error('❌ E-posta gönderilirken hata oluştu:', error);
      console.error('❌ Hata detayları:', error.message);
      
      return NextResponse.json({ 
        success: false,
        error: 'E-posta bildirimleri gönderilemedi',
        message: 'Ödev kaydedildi ancak e-posta bildirimleri gönderilemedi. Lütfen SMTP ayarlarınızı kontrol edin.',
        errorDetails: error.message
      }, { status: 500 });
    }
    
    // 5. Sonuçları gönder
    return NextResponse.json({
      success: true,
      message: results.success > 0 
        ? `Ödev kaydedildi ve ${results.success} öğrenciye bildirim gönderildi.` 
        : 'Ödev kaydedildi ancak bildirim gönderilemedi.',
      results,
      skippedStudents: skippedStudents.length > 0 ? skippedStudents : undefined
    });
  } catch (error: any) {
    console.error('❌ Ödev bildirimleri gönderilirken genel hata:', error);
    return NextResponse.json({
      success: false,
      error: `Ödev bildirimleri işlenemedi: ${error.message}`,
      message: 'İşlem sırasında beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    }, { status: 500 });
  }
} 