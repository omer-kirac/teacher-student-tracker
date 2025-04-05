import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();

    // Endpoint fonksiyonları
    const handlers = {
      'add-student-solution': addStudentSolution,
      'update-student-solution': updateStudentSolution,
    };

    const handler = handlers[body.action];
    if (!handler) {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await handler(supabaseClient, user, body);
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Öğrenci adına çözüm ekleme
async function addStudentSolution(supabaseClient, user, body) {
  const { student_id, class_id, solved_questions } = body;

  // Önce öğretmenin yetkisini kontrol et
  const { data: classData, error: classError } = await supabaseClient
    .from('classes')
    .select('teacher_id')
    .eq('id', class_id)
    .single();

  if (classError) {
    throw new Error(`Class not found: ${classError.message}`);
  }

  if (classData.teacher_id !== user.id) {
    throw new Error('You are not authorized to add solutions for this class');
  }

  // Bugünün tarihi
  const today = new Date().toISOString().split('T')[0];

  // Mevcut çözüm kaydı var mı kontrol et
  const { data: existingData, error: checkError } = await supabaseClient
    .from('student_solutions')
    .select('id, solved_questions')
    .eq('student_id', student_id)
    .eq('class_id', class_id)
    .eq('date', today)
    .maybeSingle();

  // Servis rolü kullanarak RLS politikalarını bypass et
  const { data: serviceClient } = await supabaseClient.auth.getUser();
  const adminAuthHeader = { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` };

  if (!checkError && existingData) {
    // Mevcut kaydı güncelle
    const { data: updateData, error: updateError } = await supabaseClient
      .from('student_solutions')
      .update({
        solved_questions: existingData.solved_questions + solved_questions
      })
      .eq('id', existingData.id)
      .select()
      .single()
      .headers(adminAuthHeader);

    if (updateError) {
      throw new Error(`Failed to update solution: ${updateError.message}`);
    }

    return { success: true, data: updateData };
  } else {
    // Yeni kayıt oluştur
    const { data: insertData, error: insertError } = await supabaseClient
      .from('student_solutions')
      .insert({
        student_id,
        class_id,
        date: today,
        solved_questions
      })
      .select()
      .single()
      .headers(adminAuthHeader);

    if (insertError) {
      throw new Error(`Failed to insert solution: ${insertError.message}`);
    }

    return { success: true, data: insertData };
  }
}

// Öğrenci adına çözüm güncelleme
async function updateStudentSolution(supabaseClient, user, body) {
  const { student_solution_id, student_id, class_id, solved_questions } = body;

  // Önce öğretmenin yetkisini kontrol et
  const { data: classData, error: classError } = await supabaseClient
    .from('classes')
    .select('teacher_id')
    .eq('id', class_id)
    .single();

  if (classError) {
    throw new Error(`Class not found: ${classError.message}`);
  }

  if (classData.teacher_id !== user.id) {
    throw new Error('You are not authorized to update solutions for this class');
  }

  // Servis rolü kullanarak RLS politikalarını bypass et
  const adminAuthHeader = { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` };

  // Çözüm kaydını güncelle
  const { data: updateData, error: updateError } = await supabaseClient
    .from('student_solutions')
    .update({
      solved_questions
    })
    .eq('id', student_solution_id)
    .eq('student_id', student_id)
    .select()
    .single()
    .headers(adminAuthHeader);

  if (updateError) {
    throw new Error(`Failed to update solution: ${updateError.message}`);
  }

  return { success: true, data: updateData };
} 