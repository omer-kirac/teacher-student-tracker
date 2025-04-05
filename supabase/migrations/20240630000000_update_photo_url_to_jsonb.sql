-- photo_url sütununu TEXT'ten JSONB türüne değiştir
ALTER TABLE student_assignments
ALTER COLUMN photo_url TYPE JSONB USING 
    CASE 
        WHEN photo_url IS NULL THEN NULL
        -- Eğer içerik data: ile başlıyorsa (base64), onu bir JSON dizisi içine koy
        WHEN photo_url LIKE 'data:%' THEN jsonb_build_array(photo_url)
        -- Eğer içerik http ile başlıyorsa (URL), onu bir JSON dizisi içine koy
        WHEN photo_url LIKE 'http%' THEN jsonb_build_array(photo_url)
        -- Eğer içerik zaten JSON formatındaysa, doğrudan kullan
        WHEN photo_url ~ '^\[.*\]$' THEN photo_url::jsonb
        -- Diğer durumlar için boş dizi
        ELSE '[]'::jsonb
    END;

-- Mevcut verileri düzeltmek için yardımcı bir fonksiyon (uygulama ile gelecek istekler için gerekli değil)
CREATE OR REPLACE FUNCTION convert_photo_url_to_jsonb()
RETURNS VOID AS $$
BEGIN
    UPDATE student_assignments
    SET photo_url = jsonb_build_array(photo_url)
    WHERE photo_url IS NOT NULL 
    AND (photo_url->0) IS NULL
    AND NOT jsonb_typeof(photo_url) = 'array';
END;
$$ LANGUAGE plpgsql;

-- Fonksiyonu çağır ve mevcut verileri dönüştür
SELECT convert_photo_url_to_jsonb();

-- Yardımcı fonksiyonu sil (kullanıldıktan sonra)
DROP FUNCTION IF EXISTS convert_photo_url_to_jsonb();

-- Kısıtlama: photo_url NULL veya JSONB tipinde dizi olmalı
ALTER TABLE student_assignments
ADD CONSTRAINT photo_url_is_array CHECK (
    photo_url IS NULL OR 
    jsonb_typeof(photo_url) = 'array'
); 