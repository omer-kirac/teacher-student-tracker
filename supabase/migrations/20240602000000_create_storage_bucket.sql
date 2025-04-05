-- Ödev fotoğraf bucketı oluştur
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('assignment-photos', 'assignment-photos', true, false, 5242880, '{image/jpeg,image/png,image/gif,image/webp}')
ON CONFLICT (id) DO NOTHING;

-- Herkesin bucket'taki dosyaları görebilmesi için RLS politikası
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (
  bucket_id = 'assignment-photos'
);

-- Sadece kayıtlı kullanıcıların yükleme yapabilmesi için RLS politikası
CREATE POLICY "Authenticated Users Only Insert" ON storage.objects FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND bucket_id = 'assignment-photos'
);

-- Kullanıcıların kendi yükledikleri dosyaları güncellemesi için RLS politikası
CREATE POLICY "Owner Update" ON storage.objects FOR UPDATE USING (
  auth.uid() = owner AND bucket_id = 'assignment-photos'
);

-- Kullanıcıların kendi yükledikleri dosyaları silmesi için RLS politikası
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE USING (
  auth.uid() = owner AND bucket_id = 'assignment-photos'
); 