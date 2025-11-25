-- 1. Add document fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS document_type text DEFAULT 'ticket', -- 'ticket', 'boleta', 'factura'
ADD COLUMN IF NOT EXISTS document_series text,
ADD COLUMN IF NOT EXISTS document_number text;

-- 2. Create document_series table for managing series and correlatives
CREATE TABLE IF NOT EXISTS document_series (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_type text NOT NULL, -- 'ticket', 'boleta', 'factura'
    series text NOT NULL, -- e.g., 'T001', 'B001', 'F001'
    current_number int DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(document_type, series)
);

-- Enable RLS
ALTER TABLE document_series ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read document series" ON document_series FOR SELECT USING (true);
CREATE POLICY "Admins can manage document series" ON document_series FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Seed default series
INSERT INTO document_series (document_type, series, current_number, is_active) VALUES
('ticket', 'T001', 0, true),
('boleta', 'B001', 0, false),
('factura', 'F001', 0, false)
ON CONFLICT (document_type, series) DO NOTHING;

-- 4. Create function to get next document number
CREATE OR REPLACE FUNCTION get_next_document_number(
    p_document_type text,
    p_series text DEFAULT NULL
)
RETURNS TABLE(series text, number int, full_number text) AS $$
DECLARE
    v_series text;
    v_number int;
BEGIN
    -- If series not provided, get the active one for this document type
    IF p_series IS NULL THEN
        SELECT ds.series INTO v_series
        FROM document_series ds
        WHERE ds.document_type = p_document_type 
        AND ds.is_active = true
        LIMIT 1;
    ELSE
        v_series := p_series;
    END IF;

    -- Get and increment the current number
    UPDATE document_series
    SET current_number = current_number + 1,
        updated_at = now()
    WHERE document_series.document_type = p_document_type 
    AND document_series.series = v_series
    RETURNING current_number INTO v_number;

    -- Return the series, number, and formatted full number
    RETURN QUERY SELECT 
        v_series,
        v_number,
        v_series || '-' || LPAD(v_number::text, 8, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_document ON orders(document_type, document_series, document_number);
