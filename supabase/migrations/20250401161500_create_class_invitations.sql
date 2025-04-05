-- Davetiye tablosu oluştur
CREATE TABLE IF NOT EXISTS class_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) NOT NULL,
  invitation_code VARCHAR(20) NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Policy
ALTER TABLE class_invitations ENABLE ROW LEVEL SECURITY;

-- Öğretmenler kendi oluşturdukları davetleri görebilir
CREATE POLICY "Teachers can view their own invitations" ON class_invitations
  FOR SELECT USING (auth.uid() = created_by);

-- Öğretmenler kendi sınıfları için davet oluşturabilir
CREATE POLICY "Teachers can create invitations for their classes" ON class_invitations
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT teacher_id FROM classes WHERE id = class_id
    )
  );

-- Öğretmenler kendi oluşturdukları davetleri güncelleyebilir
CREATE POLICY "Teachers can update their own invitations" ON class_invitations
  FOR UPDATE USING (auth.uid() = created_by);

-- Öğretmenler kendi oluşturdukları davetleri silebilir
CREATE POLICY "Teachers can delete their own invitations" ON class_invitations
  FOR DELETE USING (auth.uid() = created_by);

-- Herkes davetleri okuyabilir (katılma için)
CREATE POLICY "Anyone can read invitations" ON class_invitations
  FOR SELECT USING (is_active = true);

-- Davet kodunu almak için fonksiyon
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(20) := '';
  i INTEGER := 0;
  pos INTEGER := 0;
BEGIN
  FOR i IN 1..8 LOOP
    pos := 1 + CAST(random() * (length(chars) - 1) AS INTEGER);
    result := result || substr(chars, pos, 1);
  END LOOP;
  
  -- Her 4 karakterde bir tire ekle
  result := substr(result, 1, 4) || '-' || substr(result, 5, 4);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql; 