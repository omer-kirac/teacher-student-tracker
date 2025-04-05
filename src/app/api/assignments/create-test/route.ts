import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
 * Test ödevi oluşturan API
 * Bu API, test amaçlı olarak ödev oluşturur ve bildirim API'sine yönlendirir
 */
export async function GET(request: NextRequest) {
  try {
    // URL'den parametreleri al
    const url = new URL(request.url);
    const title = url.searchParams.get('title') || `Test Ödevi - ${new Date().toLocaleString('tr-TR')}`;
    const classId = url.searchParams.get('classId');
    const teacherId = url.searchParams.get('teacherId');
    const withNotify = url.searchParams.get('notify') === 'true';
    
    if (!classId) {
      return NextResponse.json({
        success: false,
        error: 'Sınıf ID\'si gereklidir',
        help: 'URL\'de `?classId=...` parametresi ile sınıf ID\'si belirtilmelidir'
      }, { status: 400 });
    }
    
    if (!teacherId) {
      return NextResponse.json({
        success: false,
        error: 'Öğretmen ID\'si gereklidir',
        help: 'URL\'de `?teacherId=...` parametresi ile öğretmen ID\'si belirtilmelidir'
      }, { status: 400 });
    }
    
    console.log(`📋 Test ödevi oluşturuluyor...`);
    console.log(`📋 Başlık: ${title}`);
    console.log(`📋 Sınıf ID: ${classId}`);
    console.log(`📋 Öğretmen ID: ${teacherId}`);
    
    // Sınıfı kontrol et
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();
    
    if (classError || !classData) {
      console.error('❌ Sınıf bulunamadı:', classError);
      return NextResponse.json({
        success: false,
        error: 'Sınıf bulunamadı',
        details: classError
      }, { status: 404 });
    }
    
    console.log(`✅ Sınıf bulundu: ${classData.name}`);
    
    // Öğretmeni kontrol et
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', teacherId)
      .single();
    
    if (teacherError || !teacherData) {
      console.error('❌ Öğretmen bulunamadı:', teacherError);
      return NextResponse.json({
        success: false,
        error: 'Öğretmen bulunamadı',
        details: teacherError
      }, { status: 404 });
    }
    
    console.log(`✅ Öğretmen bulundu: ${teacherData.full_name}`);
    
    // Test ödevi oluştur
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 1 hafta sonra
    
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        title,
        description: `Bu otomatik oluşturulmuş bir test ödevidir. (${new Date().toLocaleString('tr-TR')})`,
        class_id: classId,
        created_by: teacherId,
        due_date: dueDate.toISOString()
      })
      .select()
      .single();
    
    if (assignmentError || !assignment) {
      console.error('❌ Ödev oluşturulamadı:', assignmentError);
      return NextResponse.json({
        success: false,
        error: 'Ödev oluşturulamadı',
        details: assignmentError
      }, { status: 500 });
    }
    
    console.log(`✅ Test ödevi oluşturuldu: ID: ${assignment.id}`);
    
    // Bildirim gönderme seçeneği etkinse
    let notifyResult = null;
    if (withNotify) {
      console.log(`📧 Bildirim gönderme isteği yapılıyor...`);
      
      try {
        const notifyResponse = await fetch(`${url.origin}/api/assignments/notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ assignmentId: assignment.id })
        });
        
        notifyResult = await notifyResponse.json();
        console.log(`📧 Bildirim yanıtı:`, notifyResult);
      } catch (notifyError: any) {
        console.error('❌ Bildirim gönderilirken hata:', notifyError.message);
        notifyResult = {
          success: false,
          error: notifyError.message
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test ödevi başarıyla oluşturuldu',
      assignment,
      notifyResult,
      testCommands: {
        getAssignment: `${url.origin}/api/assignments/list?debug=true`,
        sendNotification: `${url.origin}/api/assignments/notify?assignmentId=${assignment.id}`,
        testMail: `${url.origin}/api/assignments/test-mail`
      }
    });
  } catch (error: any) {
    console.error('❌ Test ödevi oluşturulurken genel hata:', error.message);
    
    return NextResponse.json({
      success: false,
      error: `Test ödevi oluşturulamadı: ${error.message}`,
      message: 'İşlem sırasında beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    }, { status: 500 });
  }
} 