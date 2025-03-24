-- Bir öğretmenin tüm sınıflarındaki öğrencileri toplam çözdükleri soru sayısıyla listeleyen fonksiyon
CREATE OR REPLACE FUNCTION get_all_students_with_stats(teacher_class_ids UUID[])
RETURNS TABLE (
  student_id UUID,
  student_name VARCHAR,
  class_id UUID,
  class_name VARCHAR,
  created_at TIMESTAMPTZ,
  photo_url TEXT,
  total_solved_questions BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as student_id,
    s.name as student_name,
    c.id as class_id,
    c.name as class_name,
    s.created_at,
    s.photo_url,
    COALESCE(SUM(ss.solved_questions), 0)::BIGINT as total_solved_questions
  FROM 
    students s
  JOIN 
    classes c ON s.class_id = c.id
  LEFT JOIN 
    student_solutions ss ON s.id = ss.student_id
  WHERE 
    c.id = ANY(teacher_class_ids)
  GROUP BY 
    s.id, s.name, c.id, c.name, s.created_at, s.photo_url
  ORDER BY 
    total_solved_questions DESC;
END;
$$; 