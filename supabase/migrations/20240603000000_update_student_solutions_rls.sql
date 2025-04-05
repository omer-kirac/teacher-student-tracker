-- Öğretmenlerin sınıflarındaki öğrenciler için çözüm ekleyebilmesini sağla
CREATE POLICY "Teachers can add solutions for their students" ON student_solutions
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = student_solutions.class_id
    )
  );

-- Öğretmenlerin sınıflarındaki öğrencilerin çözümlerini güncelleyebilmesini sağla
CREATE POLICY "Teachers can update solutions for their students" ON student_solutions
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = student_solutions.class_id
    )
  );

-- Öğretmenlerin sınıflarındaki öğrencilerin çözümlerini görüntüleyebilmesini sağla
CREATE POLICY "Teachers can view solutions for their students" ON student_solutions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = student_solutions.class_id
    )
  ); 