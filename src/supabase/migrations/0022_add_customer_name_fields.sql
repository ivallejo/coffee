ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name_father TEXT,
ADD COLUMN IF NOT EXISTS last_name_mother TEXT;

-- Opcional: Actualizar registros existentes intentando separar full_name (muy básico)
-- Esto es solo un intento, idealmente se llenarán con los nuevos registros
UPDATE customers 
SET first_name = split_part(full_name, ' ', 1)
WHERE first_name IS NULL;
