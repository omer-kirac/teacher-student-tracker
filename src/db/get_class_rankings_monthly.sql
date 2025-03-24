CREATE OR REPLACE FUNCTION get_class_rankings_monthly(teacher_id_input UUID)
RETURNS TABLE (
  class_id UUID,
  class_name TEXT,
  student_count BIGINT,
  total_solved_questions BIGINT,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id::UUID AS class_id,
    c.name::TEXT AS class_name,
    COUNT(DISTINCT s.id)::BIGINT AS student_count,
    COALESCE(SUM(ss.solved_questions), 0)::BIGINT AS total_solved_questions,
    c.created_at::TIMESTAMPTZ
  FROM 
    classes c
  LEFT JOIN 
    students s ON s.class_id = c.id
  LEFT JOIN 
    student_solutions ss ON ss.student_id = s.id AND ss.date >= (CURRENT_DATE - INTERVAL '30 days')
  WHERE 
    c.teacher_id = teacher_id_input
  GROUP BY 
    c.id, c.name
  ORDER BY 
    total_solved_questions DESC;
END;
$$; 