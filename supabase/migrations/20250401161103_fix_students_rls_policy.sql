-- Önce mevcut politikayı kaldıralım
DROP POLICY IF EXISTS "Teachers can insert students to their classes" ON public.students;

-- Yeni bir kullanıcı ekleme politikası oluşturalım
CREATE POLICY "Anyone can insert students" ON public.students
  FOR INSERT WITH CHECK (true);

-- Öğrencilerin, kendi sınıfı olmasa bile kayıt yapabilmesi için
-- class_id sütununu NULL değer olarak kabul edecek şekilde değiştirelim
ALTER TABLE public.students ALTER COLUMN class_id DROP NOT NULL; 