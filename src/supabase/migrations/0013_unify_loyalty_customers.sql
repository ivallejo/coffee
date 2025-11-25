-- 1. Modify loyalty_cards table structure
-- Drop existing PK if it exists (which was phone)
ALTER TABLE loyalty_cards DROP CONSTRAINT IF EXISTS loyalty_cards_pkey;

-- Add customer_id
ALTER TABLE loyalty_cards
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);

-- Make customer_id the new PK (or unique identifier for logic)
-- We'll use a composite or just ensure customer_id is unique where not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_customer_id ON loyalty_cards(customer_id);

-- 2. Update the trigger function to use customer_id
CREATE OR REPLACE FUNCTION update_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
    coffee_count INTEGER;
    target_customer_id uuid;
BEGIN
    target_customer_id := NEW.customer_id;

    -- Fallback: Find customer by phone if ID not provided
    IF target_customer_id IS NULL AND NEW.customer_phone IS NOT NULL THEN
        SELECT id INTO target_customer_id FROM customers WHERE phone = NEW.customer_phone LIMIT 1;
    END IF;

    IF target_customer_id IS NOT NULL THEN
        -- Count coffee items
        SELECT COUNT(*)
        INTO coffee_count
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE oi.order_id = NEW.id
        AND c.name = 'Bebidas Calientes';

        IF coffee_count > 0 THEN
            -- Upsert based on customer_id
            INSERT INTO loyalty_cards (customer_id, points, total_visits, last_visit, phone)
            VALUES (
                target_customer_id,
                coffee_count,
                1,
                NEW.created_at,
                NEW.customer_phone
            )
            ON CONFLICT (customer_id) DO UPDATE SET
                points = loyalty_cards.points + coffee_count,
                total_visits = loyalty_cards.total_visits + 1,
                last_visit = NEW.created_at;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
