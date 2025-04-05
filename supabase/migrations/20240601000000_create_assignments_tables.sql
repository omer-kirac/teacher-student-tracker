-- Ödev (assignments) tablosu oluştur
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Policy
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Öğretmenler kendi sınıfları için ödevi görebilir
CREATE POLICY "Teachers can view assignments for their classes" ON assignments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = class_id
    )
  );

-- Öğrenciler kayıtlı oldukları sınıfların ödevlerini görebilir
CREATE POLICY "Students can view assignments for their enrolled classes" ON assignments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM students WHERE class_id = assignments.class_id
    )
  );

-- Öğretmenler kendi sınıfları için ödev oluşturabilir
CREATE POLICY "Teachers can create assignments for their classes" ON assignments
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = class_id
    )
  );

-- Öğretmenler kendi oluşturdukları ödevleri güncelleyebilir
CREATE POLICY "Teachers can update assignments they created" ON assignments
  FOR UPDATE USING (auth.uid() = created_by);

-- Öğretmenler kendi oluşturdukları ödevleri silebilir
CREATE POLICY "Teachers can delete assignments they created" ON assignments
  FOR DELETE USING (auth.uid() = created_by);

-- Öğrenci Ödevleri (student_assignments) tablosu oluştur
CREATE TABLE IF NOT EXISTS student_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) NOT NULL,
  assignment_id UUID REFERENCES assignments(id) NOT NULL,
  status VARCHAR(50) DEFAULT 'not_submitted', -- not_submitted, submitted, graded
  submission_date TIMESTAMPTZ,
  photo_url TEXT,
  teacher_comment TEXT,
  grade INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, assignment_id)
);

-- RLS (Row Level Security) Policy
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;

-- Öğrenciler kendi ödev teslimlerini görebilir
CREATE POLICY "Students can view their own assignment submissions" ON student_assignments
  FOR SELECT USING (auth.uid() = student_id);

-- Öğretmenler kendi sınıflarındaki öğrencilerin ödev teslimlerini görebilir
CREATE POLICY "Teachers can view submissions for their class assignments" ON student_assignments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT c.teacher_id 
      FROM classes c
      JOIN assignments a ON c.id = a.class_id
      WHERE a.id = assignment_id
    )
  );

-- Öğrenciler kendi ödevlerini teslim edebilir ve güncelleyebilir
CREATE POLICY "Students can submit and update their assignments" ON student_assignments
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own submissions" ON student_assignments
  FOR UPDATE USING (auth.uid() = student_id);

-- Öğretmenler öğrenci teslimlerini değerlendirebilir (not verebilir, yorum ekleyebilir)
CREATE POLICY "Teachers can grade student submissions" ON student_assignments
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT c.teacher_id 
      FROM classes c
      JOIN assignments a ON c.id = a.class_id
      WHERE a.id = assignment_id
    )
  );

-- Öğretmenler öğrenci teslimlerini silebilir
CREATE POLICY "Teachers can delete student submissions" ON student_assignments
  FOR DELETE USING (
    auth.uid() IN (
      SELECT c.teacher_id 
      FROM classes c
      JOIN assignments a ON c.id = a.class_id
      WHERE a.id = assignment_id
    )
  ); 