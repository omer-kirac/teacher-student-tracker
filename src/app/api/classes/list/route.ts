import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase istemcisini oluştur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Sınıfları listeleyen API
 */
export async function GET(request: NextRequest) {
  try {
    // URL parametrelerini al
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') || '10') : 10;
    const teacherId = url.searchParams.get('teacherId');
    
    // Başlangıç sorgusu
    let query = supabase
      .from('classes')
      .select('*, teachers(*)');
    
    // Öğretmen ID'si ile filtreleme
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    
    // Son eklenenleri sırala ve limitini belirle
    query = query.order('created_at', { ascending: false }).limit(limit);
    
    // Sorguyu çalıştır
    const { data: classes, error } = await query;
    
    if (error) {
      console.error('❌ Sınıflar getirilemedi:', error);
      return NextResponse.json({
        success: false,
        error: 'Sınıflar getirilemedi',
        details: error
      }, { status: 500 });
    }
    
    // Test için kullanılacak bilgiler
    const testInfo: {
      apiEndpoints: {
        getTeachers: string;
        getClasses: string;
      };
      testCommands?: {
        createTestAssignment: string;
        testMail: string;
      };
    } = {
      apiEndpoints: {
        getTeachers: `${url.origin}/api/teachers/list`,
        getClasses: `${url.origin}/api/classes/list`
      }
    };
    
    if (classes && classes.length > 0) {
      const sampleClass = classes[0];
      const sampleTeacherId = sampleClass.teacher_id;
      
      testInfo.testCommands = {
        createTestAssignment: `${url.origin}/api/assignments/create-test?classId=${sampleClass.id}&teacherId=${sampleTeacherId}&notify=true`,
        testMail: `${url.origin}/api/assignments/test-mail`
      };
    }
    
    return NextResponse.json({
      success: true,
      classes: classes || [],
      count: classes?.length || 0,
      params: {
        teacherId: teacherId || null,
        limit
      },
      testInfo
    });
  } catch (error: any) {
    console.error('❌ Sınıf listesi alınırken hata:', error);
    return NextResponse.json({
      success: false,
      error: `Sınıf listesi alınamadı: ${error.message}`,
      message: 'İşlem sırasında beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    }, { status: 500 });
  }
} 