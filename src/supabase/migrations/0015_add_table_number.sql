-- Add table_number column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS table_number TEXT;

-- Add index for faster lookups of pending orders by table
CREATE INDEX IF NOT EXISTS idx_orders_status_table 
ON public.orders(status, table_number);

-- Comment
COMMENT ON COLUMN public.orders.table_number IS 'Identifier for the table or customer reference for pending orders';
