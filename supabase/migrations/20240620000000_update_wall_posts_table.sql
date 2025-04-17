-- Gönderi tablosuna yazar adı ve öğretmen mi bilgisi ekleniyor
ALTER TABLE wall_posts 
ADD COLUMN author_name TEXT,
ADD COLUMN author_is_teacher BOOLEAN DEFAULT FALSE;

-- Mevcut gönderilere yazar bilgilerini ekleme (öğretmen kontrolü)
UPDATE wall_posts
SET 
  author_name = (
    SELECT full_name 
    FROM teachers 
    WHERE id = wall_posts.author_id
  ),
  author_is_teacher = TRUE
WHERE author_id IN (SELECT id FROM teachers);

-- Mevcut gönderilere yazar bilgilerini ekleme (öğrenci kontrolü)
UPDATE wall_posts
SET 
  author_name = (
    SELECT name 
    FROM students 
    WHERE id = wall_posts.author_id
  ),
  author_is_teacher = FALSE
WHERE author_id IN (SELECT id FROM students); 