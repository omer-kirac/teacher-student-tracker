CREATE TABLE IF NOT EXISTS student_solutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) NOT NULL,
  class_id UUID REFERENCES classes(id) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  solved_questions INT4 DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Policy
ALTER TABLE student_solutions ENABLE ROW LEVEL SECURITY;

-- Öğrenciler kendi çözümlerini görebilir
CREATE POLICY "Students can view their own solutions" ON student_solutions
  FOR SELECT USING (auth.uid() = student_id);

-- Öğretmenler sınıflarındaki öğrenci çözümlerini görebilir
CREATE POLICY "Teachers can view solutions for their classes" ON student_solutions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = student_solutions.class_id
    )
  );

-- Öğrenciler kendi çözümlerini ekleyebilir
CREATE POLICY "Students can add their own solutions" ON student_solutions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Öğrenciler kendi çözümlerini güncelleyebilir
CREATE POLICY "Students can update their own solutions" ON student_solutions
  FOR UPDATE USING (auth.uid() = student_id); 