import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase istemcisini oluştur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Öğretmenleri listeleyen API
 */
export async function GET(request: NextRequest) {
  try {
    // URL parametrelerini al
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') || '10') : 10;
    
    // Öğretmenleri getir
    const { data: teachers, error } = await supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('❌ Öğretmenler getirilemedi:', error);
      return NextResponse.json({
        success: false,
        error: 'Öğretmenler getirilemedi',
        details: error
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      teachers: teachers || [],
      count: teachers?.length || 0
    });
  } catch (error: any) {
    console.error('❌ Öğretmen listesi alınırken hata:', error);
    return NextResponse.json({
      success: false,
      error: `Öğretmen listesi alınamadı: ${error.message}`,
      message: 'İşlem sırasında beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    }, { status: 500 });
  }
} 