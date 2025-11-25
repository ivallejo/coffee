-- Add QR code URL and receipt logo fields to store_settings
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS qr_code_url text,
ADD COLUMN IF NOT EXISTS receipt_logo_url text;

COMMENT ON COLUMN store_settings.qr_code_url IS 'URL to encode in QR code on receipts (e.g., website, WhatsApp, payment link)';
COMMENT ON COLUMN store_settings.receipt_logo_url IS 'URL of the logo image to display on receipts (PNG format recommended)';
