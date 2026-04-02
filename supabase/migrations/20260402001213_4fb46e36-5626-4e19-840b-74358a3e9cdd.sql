ALTER TABLE subjects ADD COLUMN IF NOT EXISTS battle_disabled boolean DEFAULT false;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS battle_password text DEFAULT null;