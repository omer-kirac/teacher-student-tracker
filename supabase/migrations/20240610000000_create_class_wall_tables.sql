-- Sınıf duvarı gönderileri (wall_posts) tablosu
CREATE TABLE IF NOT EXISTS wall_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  link TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Policy
ALTER TABLE wall_posts ENABLE ROW LEVEL SECURITY;

-- Öğretmenler kendi sınıfları için gönderileri görebilir
CREATE POLICY "Teachers can view wall posts for their classes" ON wall_posts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = class_id
    )
  );

-- Öğrenciler kayıtlı oldukları sınıfların gönderilerini görebilir
CREATE POLICY "Students can view wall posts for their enrolled classes" ON wall_posts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM students WHERE class_id = wall_posts.class_id
    )
  );

-- Öğretmenler kendi sınıfları için gönderi oluşturabilir
CREATE POLICY "Teachers can create wall posts for their classes" ON wall_posts
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = class_id
    )
  );

-- Öğrenciler kayıtlı oldukları sınıflar için gönderi oluşturabilir
CREATE POLICY "Students can create wall posts for their enrolled classes" ON wall_posts
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM students WHERE class_id = wall_posts.class_id
    )
  );

-- Öğretmenler kendi oluşturdukları gönderileri güncelleyebilir
CREATE POLICY "Teachers can update wall posts they created" ON wall_posts
  FOR UPDATE USING (auth.uid() = author_id);

-- Öğretmenler herhangi bir gönderiyi silebilir
CREATE POLICY "Teachers can delete any wall post in their classes" ON wall_posts
  FOR DELETE USING (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = class_id
    )
  );

-- Öğrenciler kendi oluşturdukları gönderileri silebilir
CREATE POLICY "Students can delete wall posts they created" ON wall_posts
  FOR DELETE USING (auth.uid() = author_id);

-- Gönderi yorumları (wall_post_comments) tablosu
CREATE TABLE IF NOT EXISTS wall_post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES wall_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Policy
ALTER TABLE wall_post_comments ENABLE ROW LEVEL SECURITY;

-- Öğretmenler kendi sınıflarındaki gönderilerin yorumlarını görebilir
CREATE POLICY "Teachers can view comments for wall posts in their classes" ON wall_post_comments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = (
        SELECT class_id FROM wall_posts WHERE id = post_id
      )
    )
  );

-- Öğrenciler kayıtlı oldukları sınıfların gönderilerinin yorumlarını görebilir
CREATE POLICY "Students can view comments for wall posts in their enrolled classes" ON wall_post_comments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM students WHERE class_id = (
        SELECT class_id FROM wall_posts WHERE id = post_id
      )
    )
  );

-- Öğretmenler kendi sınıflarındaki gönderilere yorum ekleyebilir
CREATE POLICY "Teachers can create comments for wall posts in their classes" ON wall_post_comments
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = (
        SELECT class_id FROM wall_posts WHERE id = post_id
      )
    )
  );

-- Öğrenciler kayıtlı oldukları sınıfların gönderilerine yorum ekleyebilir
CREATE POLICY "Students can create comments for wall posts in their enrolled classes" ON wall_post_comments
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM students WHERE class_id = (
        SELECT class_id FROM wall_posts WHERE id = post_id
      )
    )
  );

-- Öğretmenler herhangi bir yorumu silebilir
CREATE POLICY "Teachers can delete any comment in their classes" ON wall_post_comments
  FOR DELETE USING (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = (
        SELECT class_id FROM wall_posts WHERE id = post_id
      )
    )
  );

-- Öğrenciler kendi yorumlarını silebilir
CREATE POLICY "Students can delete their own comments" ON wall_post_comments
  FOR DELETE USING (auth.uid() = author_id);

-- Susturulmuş öğrenciler (muted_students) tablosu
CREATE TABLE IF NOT EXISTS muted_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  muted_by UUID REFERENCES auth.users(id) NOT NULL,
  muted_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- RLS (Row Level Security) Policy
ALTER TABLE muted_students ENABLE ROW LEVEL SECURITY;

-- Öğretmenler kendi sınıflarındaki susturulmuş öğrencileri görebilir
CREATE POLICY "Teachers can view muted students in their classes" ON muted_students
  FOR SELECT USING (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = class_id
    )
  );

-- Öğretmenler öğrencileri susturabilir
CREATE POLICY "Teachers can mute students in their classes" ON muted_students
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = class_id
    )
  );

-- Öğretmenler susturma durumunu güncelleyebilir
CREATE POLICY "Teachers can update mute status" ON muted_students
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = class_id
    )
  );

-- Öğretmenler susturma durumunu kaldırabilir
CREATE POLICY "Teachers can remove mutes" ON muted_students
  FOR DELETE USING (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = class_id
    )
  );

-- Dosyalar için depolama bucketı oluştur
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('wall-post-files', 'wall-post-files', true, false, 10485760, '{image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain}')
ON CONFLICT (id) DO NOTHING;

-- Herkesin bucket'taki dosyaları görebilmesi için RLS politikası
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (
  bucket_id = 'wall-post-files'
);

-- Sadece kayıtlı kullanıcıların yükleme yapabilmesi için RLS politikası
CREATE POLICY "Authenticated Users Only Insert" ON storage.objects FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND bucket_id = 'wall-post-files'
);

-- Kullanıcıların kendi yükledikleri dosyaları güncellemesi için RLS politikası
CREATE POLICY "Owner Update" ON storage.objects FOR UPDATE USING (
  auth.uid() = owner AND bucket_id = 'wall-post-files'
);

-- Kullanıcıların kendi yükledikleri dosyaları silmesi için RLS politikası
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE USING (
  auth.uid() = owner AND bucket_id = 'wall-post-files'
); 