import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
 * Tüm ödevleri listeleyen API
 * İstek parametreleri (opsiyonel):
 * - classId: Belirli bir sınıfın ödevlerini filtrelemek için
 */
export async function GET(request: NextRequest) {
  try {
    // URL parametrelerini al
    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') || '10') : 10;
    const debugQuery = url.searchParams.get('debug') === 'true';
    
    // Başlangıç sorgusu
    let query = supabase
      .from('assignments')
      .select('id, title, description, due_date, created_by, created_at, class_id, classes(name)');
    
    // Sınıf ID'si ile filtreleme
    if (classId) {
      query = query.eq('class_id', classId);
    }
    
    // Son eklenenleri sırala ve limitini belirle
    query = query.order('created_at', { ascending: false }).limit(limit);
    
    // Sorguyu çalıştır
    const { data: assignments, error } = await query;
    
    if (error) {
      console.error('❌ Ödevler getirilemedi:', error);
      return NextResponse.json({
        success: false,
        error: 'Ödevler getirilemedi',
        details: error
      }, { status: 500 });
    }
    
    // Debug modu aktifse, test için kullanılacak örnek bir istek URL'si oluştur
    let debugInfo = null;
    if (debugQuery && assignments && assignments.length > 0) {
      const sampleAssignment = assignments[0];
      debugInfo = {
        sampleAssignmentId: sampleAssignment.id,
        notifyUrl: `/api/assignments/notify?assignmentId=${sampleAssignment.id}`,
        sampleRequestBody: { assignmentId: sampleAssignment.id },
        testCommand: `curl -X POST -H "Content-Type: application/json" -d '{"assignmentId": "${sampleAssignment.id}"}' http://localhost:3000/api/assignments/notify`
      };
    }
    
    return NextResponse.json({
      success: true,
      assignments: assignments || [],
      count: assignments?.length || 0,
      params: {
        classId: classId || null,
        limit
      },
      debugInfo
    });
  } catch (error: any) {
    console.error('❌ Ödev listesi alınırken hata:', error);
    return NextResponse.json({
      success: false,
      error: `Ödev listesi alınamadı: ${error.message}`,
      message: 'İşlem sırasında beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    }, { status: 500 });
  }
} 