CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  class_id UUID REFERENCES classes(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Policy
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Tüm kullanıcıların sadece kendi kayıtlarını görmelerine izin ver
CREATE POLICY "Users can view their own student profile" ON students 
  FOR SELECT USING (auth.uid() = id);

-- Öğretmenler sınıflarındaki öğrencileri görebilir
CREATE POLICY "Teachers can view students in their classes" ON students
  FOR SELECT USING (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = students.class_id
    )
  );

-- Öğrencilerin kendi profillerini güncellemelerine izin ver
CREATE POLICY "Students can update own profile" ON students
  FOR UPDATE USING (auth.uid() = id);

-- Öğretmenler öğrencileri sınıflarına ekleyebilir
CREATE POLICY "Teachers can insert students to their classes" ON students
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = class_id
    )
  ); 