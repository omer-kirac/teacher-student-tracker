import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase istemcisini oluştur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Servis rolü anahtarını kullan (RLS politikalarını atlamak için)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Servis rolü anahtarını doğrula
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY tanımlanmamış! RLS politikaları nedeniyle ödev oluşturma hataları olabilir.');
  console.warn('⚠️ .env dosyasına SUPABASE_SERVICE_ROLE_KEY ekleyin ve daha fazla izin verin.');
}

/**
 * Yeni ödev oluşturan API
 * İstek parametreleri:
 * - title: Ödev başlığı
 * - description: Ödev açıklaması
 * - classId: Sınıf ID'si
 * - dueDate: Son teslim tarihi
 * - createdBy: Oluşturan öğretmen ID'si
 */
export async function POST(request: NextRequest) {
  try {
    // İstek gövdesini al
    const requestBody = await request.json();
    const { title, description, classId, dueDate, createdBy } = requestBody;
    
    // Zorunlu parametreleri kontrol et
    if (!title || !classId || !createdBy) {
      return NextResponse.json({ 
        success: false,
        error: 'Başlık, sınıf ID ve öğretmen ID parametreleri gereklidir' 
      }, { status: 400 });
    }
    
    // UUID formatını kontrol et
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(classId) || !uuidRegex.test(createdBy)) {
      return NextResponse.json({ 
        success: false,
        error: 'Geçersiz ID formatı. Sınıf ID ve öğretmen ID, UUID formatında olmalıdır.'
      }, { status: 400 });
    }
    
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
    
    // Öğretmeni kontrol et
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', createdBy)
      .single();
    
    if (teacherError || !teacherData) {
      console.error('❌ Öğretmen bulunamadı:', teacherError);
      return NextResponse.json({
        success: false,
        error: 'Öğretmen bulunamadı',
        details: teacherError
      }, { status: 404 });
    }
    
    // Ödev verisini oluştur
    const assignmentData = {
      title,
      description: description || '',
      class_id: classId,
      created_by: createdBy,
      due_date: dueDate || null
    };
    
    // Ödevi oluştur
    console.log('📝 Ödev oluşturuluyor:', assignmentData);
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert(assignmentData)
      .select()
      .single();
    
    if (assignmentError) {
      console.error('❌ Ödev oluşturma hatası:', assignmentError);
      return NextResponse.json({ 
        success: false, 
        error: assignmentError.message,
        debug: {
          useServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          assignmentData
        }
      }, { status: 500 });
    }
    
    // Bildirim API'si için URL oluştur
    const url = new URL(request.url);
    const notifyUrl = `${url.origin}/api/assignments/notify`;
    
    // Başarılı yanıt
    return NextResponse.json({
      success: true,
      message: 'Ödev başarıyla oluşturuldu',
      assignment,
      links: {
        notification: notifyUrl,
        notifyBody: { assignmentId: assignment.id }
      }
    });
  } catch (error: any) {
    console.error('❌ Ödev oluşturulurken hata:', error);
    return NextResponse.json({
      success: false,
      error: `Ödev oluşturulamadı: ${error.message}`,
      message: 'İşlem sırasında beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    }, { status: 500 });
  }
} 