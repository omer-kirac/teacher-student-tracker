-- Öğrenci tablosundaki password_hash sütununun varlığını kontrol et
DO $$ 
BEGIN
    -- Sütun yoksa ekle
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'password_hash'
    ) THEN
        -- Önce NULL değerlere izin vererek sütunu ekleyelim
        ALTER TABLE public.students ADD COLUMN password_hash VARCHAR(255);
        
        -- Varolan kayıtlara varsayılan değerler atayalım (güvenlik için şifrelenmemiş değerleri kullanmayın,
        -- bu sadece şema düzeltmesi için)
        UPDATE public.students SET password_hash = 'secure_placeholder' WHERE password_hash IS NULL;
    END IF;
END
$$; 