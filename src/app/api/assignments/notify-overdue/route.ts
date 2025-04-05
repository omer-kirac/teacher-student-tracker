import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMissingSubmissionReminder } from '@/lib/utils/mail';
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
 * Son teslim tarihi geçen ancak teslim edilmeyen ödevler için öğrencilere bildirim gönderen API
 * Bu API bir zamanlanmış görev (cron job) tarafından çalıştırılmalıdır
 * Örneğin, her gün saat 10:00'da çalıştırılabilir
 */
export async function POST(request: NextRequest) {
  try {
    // API key kontrolü (isteğe bağlı - ekstra güvenlik için)
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.ASSIGNMENT_NOTIFY_API_KEY;
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      console.error('❌ Geçersiz API anahtarı');
      return NextResponse.json({ 
        success: false, 
        error: 'Yetkisiz erişim' 
      }, { status: 401 });
    }

    // İşlem logları
    console.log('📋 Son teslim tarihi geçmiş ödevler için bildirim gönderiliyor...');
    
    // Bugünün tarihini al (tarih kısmını kullanacağız)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Son teslim tarihi dün olan ödevleri getir
    // Not: Saatler UTC'de olduğu için, dün tarihi kullanmak daha güvenlidir
    const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD formatı
    
    console.log(`🔍 ${yesterdayStr} tarihli ödevler kontrol ediliyor...`);

    // 1. Dün son teslim tarihi olan ödevleri getir
    const { data: overdueAssignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id, title, class_id, due_date, created_by')
      .lt('due_date', today.toISOString())
      .gte('due_date', `${yesterdayStr}T00:00:00Z`);
    
    if (assignmentsError) {
      console.error('❌ Ödevler getirilemedi:', assignmentsError);
      return NextResponse.json({ 
        success: false, 
        error: 'Ödevler getirilemedi',
        message: 'Veritabanından ödevler getirilemedi. Lütfen daha sonra tekrar deneyin.'
      }, { status: 500 });
    }
    
    console.log(`✅ ${overdueAssignments?.length || 0} son teslim tarihi geçmiş ödev bulundu`);
    
    if (!overdueAssignments || overdueAssignments.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'Son teslim tarihi geçmiş ödev bulunamadı' 
      });
    }

    // Her ödev için:
    let totalEmailReminded = 0;
    let totalFailed = 0;
    let skippedAssignments = [];
    let processedAssignments = [];
    
    // Öğrenci ve teslim bilgilerini toplu şekilde getir
    for (const assignment of overdueAssignments) {
      try {
        console.log(`🔍 Ödev işleniyor: "${assignment.title}" (ID: ${assignment.id})`);
        
        // ID formatını kontrol et
        if (!assignment.id || !assignment.created_by || !assignment.class_id) {
          console.error(`❌ Ödev bilgileri eksik veya hatalı: ${JSON.stringify(assignment)}`);
          skippedAssignments.push({
            id: assignment.id,
            title: assignment.title,
            error: 'Eksik ödev bilgileri'
          });
          continue;
        }
        
        // 2. Bu ödevin öğretmenini getir
        const { data: teacher, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', assignment.created_by)
          .single();
        
        if (teacherError || !teacher) {
          console.error('❌ Öğretmen bulunamadı:', teacherError);
          skippedAssignments.push({
            id: assignment.id,
            title: assignment.title,
            error: 'Öğretmen bulunamadı'
          });
          continue;
        }
        
        console.log(`✅ Öğretmen bulundu: ${teacher.full_name}`);
        
        // 3. Bu sınıftaki tüm öğrencileri getir
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', assignment.class_id);
        
        if (studentsError) {
          console.error(`❌ Öğrenciler getirilemedi (Sınıf ID: ${assignment.class_id}):`, studentsError);
          skippedAssignments.push({
            id: assignment.id,
            title: assignment.title,
            error: 'Öğrenciler getirilemedi'
          });
          continue;
        }
        
        console.log(`✅ ${students?.length || 0} öğrenci bulundu`);
        
        // 4. Bu ödevi teslim eden öğrencileri getir
        const { data: submissions, error: submissionsError } = await supabase
          .from('student_assignments')
          .select('student_id')
          .eq('assignment_id', assignment.id);
        
        if (submissionsError) {
          console.error(`❌ Ödev teslimleri getirilemedi (Ödev ID: ${assignment.id}):`, submissionsError);
          skippedAssignments.push({
            id: assignment.id,
            title: assignment.title,
            error: 'Teslimler getirilemedi'
          });
          continue;
        }
        
        // 5. Teslim eden öğrencilerin ID'lerini bir set'e ekle
        const submittedStudentIds = new Set((submissions || []).map(sub => sub.student_id));
        
        // 6. Teslim etmeyen öğrencilere mesaj gönder
        const studentsToNotify = students?.filter(student => !submittedStudentIds.has(student.id)) || [];
        
        console.log(`📬 ${studentsToNotify.length} öğrenciye bildirim gönderilecek...`);
        
        if (studentsToNotify.length === 0) {
          console.log(`ℹ️ Tüm öğrenciler ödevi teslim etmiş.`);
          processedAssignments.push({
            id: assignment.id,
            title: assignment.title,
            status: 'Tüm öğrenciler teslim etmiş'
          });
          continue;
        }
        
        // E-posta adresi olan öğrencileri filtrele
        const emailStudents = studentsToNotify.filter(student => student.email);
        if (emailStudents.length === 0) {
          console.warn(`⚠️ Bildirim gönderilecek öğrencilerin hiçbirinin e-posta adresi yok.`);
          processedAssignments.push({
            id: assignment.id,
            title: assignment.title,
            status: 'E-posta adresi olmayan öğrenciler'
          });
          continue;
        }
        
        // E-posta bildirimi gönder
        console.log(`📧 ${emailStudents.length} öğrenciye e-posta hatırlatması gönderiliyor...`);
        
        let assignmentSuccess = 0;
        let assignmentFailed = 0;
        
        // Her öğrenciye ödev teslim edilmedi hatırlatması gönder
        for (const student of emailStudents) {
          try {
            await sendMissingSubmissionReminder(
              teacher as Teacher,
              student as Student,
              assignment as Assignment
            );
            console.log(`✅ ${student.name} öğrencisine e-posta hatırlatması gönderildi.`);
            totalEmailReminded++;
            assignmentSuccess++;
          } catch (error: any) {
            console.error(`❌ ${student.name} öğrencisine e-posta hatırlatması gönderilemedi:`, error.message);
            totalFailed++;
            assignmentFailed++;
          }
        }
        
        // Bu ödev için istatistikleri kaydet
        processedAssignments.push({
          id: assignment.id,
          title: assignment.title,
          success: assignmentSuccess,
          failed: assignmentFailed,
          total: emailStudents.length
        });
      } catch (error: any) {
        console.error(`❌ Ödev işlenirken hata: ${error.message}`);
        totalFailed++;
        skippedAssignments.push({
          id: assignment.id,
          title: assignment.title || 'Bilinmeyen ödev',
          error: error.message
        });
      }
    }
    
    // Özet bilgileri
    console.log(`📊 İşlem özeti:`);
    console.log(`📊 İşlenen ödev sayısı: ${overdueAssignments.length}`);
    console.log(`📊 Gönderilen e-posta sayısı: ${totalEmailReminded}`);
    console.log(`📊 Başarısız e-posta sayısı: ${totalFailed}`);
    
    // Sonuçları gönder
    return NextResponse.json({
      success: true,
      message: 'Son teslim tarihi geçmiş ödevler için bildirimler tamamlandı',
      summary: {
        totalAssignments: overdueAssignments.length,
        totalEmailReminded,
        totalFailed
      },
      processedAssignments,
      skippedAssignments: skippedAssignments.length > 0 ? skippedAssignments : undefined
    });
  } catch (error: any) {
    console.error('❌ Hatırlatma bildirimleri gönderilirken hata:', error);
    return NextResponse.json({
      success: false,
      error: `Hatırlatma bildirimleri gönderilemedi: ${error.message}`,
      message: 'İşlem sırasında beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    }, { status: 500 });
  }
} 