-- Migration: Add loyalty program support
-- This migration adds customer_phone to orders and creates loyalty tracking

-- Add customer_phone column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Create loyalty_cards table
CREATE TABLE IF NOT EXISTS loyalty_cards (
    phone TEXT PRIMARY KEY,
    points INTEGER DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    last_visit TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on loyalty_cards
ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_cards
CREATE POLICY "Public read loyalty cards" ON loyalty_cards FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert loyalty cards" ON loyalty_cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update loyalty cards" ON loyalty_cards FOR UPDATE USING (true);

-- Function to update loyalty points after order completion
CREATE OR REPLACE FUNCTION update_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
    coffee_count INTEGER;
BEGIN
    -- Only process if customer_phone is provided
    IF NEW.customer_phone IS NOT NULL AND NEW.customer_phone != '' THEN
        -- Count coffee items in the order (assuming category 'Bebidas Calientes' contains coffees)
        SELECT COUNT(*)
        INTO coffee_count
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE oi.order_id = NEW.id
        AND c.name = 'Bebidas Calientes';

        -- Upsert loyalty card
        INSERT INTO loyalty_cards (phone, points, total_visits, last_visit)
        VALUES (
            NEW.customer_phone,
            coffee_count,
            1,
            NEW.created_at
        )
        ON CONFLICT (phone) DO UPDATE SET
            points = loyalty_cards.points + coffee_count,
            total_visits = loyalty_cards.total_visits + 1,
            last_visit = NEW.created_at;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for loyalty points
DROP TRIGGER IF EXISTS trigger_update_loyalty_points ON orders;
CREATE TRIGGER trigger_update_loyalty_points
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_loyalty_points();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_points ON loyalty_cards(points DESC);
