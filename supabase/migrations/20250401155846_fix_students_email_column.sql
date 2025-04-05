-- Öğrenci tablosundaki email sütununun varlığını kontrol et
DO $$ 
BEGIN
    -- Sütun yoksa ekle (önce NULL değerlere izin ver)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'email'
    ) THEN
        -- Önce NULL değerlere izin vererek sütunu ekleyelim
        ALTER TABLE public.students ADD COLUMN email VARCHAR(255);
        
        -- Varolan kayıtlara varsayılan değerler atayalım
        UPDATE public.students SET email = CONCAT('user_', id, '@example.com') WHERE email IS NULL;
        
        -- Sonra sütunu NOT NULL yapalım
        ALTER TABLE public.students ALTER COLUMN email SET NOT NULL;
        
        -- Son olarak UNIQUE constraint ekleyelim
        ALTER TABLE public.students ADD CONSTRAINT students_email_unique UNIQUE (email);
    END IF;
END
$$; 