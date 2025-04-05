-- Öğrenci tablosuna telefon numarası alanı ekle
ALTER TABLE public.students ADD COLUMN phone_number VARCHAR(20);

-- Bir index ekle
CREATE INDEX idx_students_phone_number ON public.students(phone_number);

-- Herhangi bir öğrencinin telefon numarası ile aranabilmesi için politika
CREATE POLICY "Teachers can search students by phone number" ON students
  FOR SELECT USING (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = students.class_id
    )
  ); 