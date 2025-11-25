const { Client } = require('pg');

const connectionString = 'postgresql://postgres:AiAssistant2024!Secure@db.xiiiqyixkpfkxpfhtqhb.supabase.co:5432/postgres';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase
});

const fixSql = `
-- 1. Replace the trigger function with the SAFE version (No ON CONFLICT)
CREATE OR REPLACE FUNCTION update_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
    coffee_count INTEGER;
    target_customer_id uuid;
    existing_card_phone text;
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
            -- Check if exists manually to avoid ON CONFLICT errors
            PERFORM 1 FROM loyalty_cards WHERE customer_id = target_customer_id;
            
            IF FOUND THEN
                -- UPDATE
                UPDATE loyalty_cards
                SET points = points + coffee_count,
                    total_visits = total_visits + 1,
                    last_visit = NEW.created_at
                WHERE customer_id = target_customer_id;
            ELSE
                -- INSERT
                INSERT INTO loyalty_cards (customer_id, points, total_visits, last_visit, phone)
                VALUES (
                    target_customer_id,
                    coffee_count,
                    1,
                    NEW.created_at,
                    NEW.customer_phone
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

async function run() {
    try {
        await client.connect();
        console.log('Connected to database...');

        await client.query(fixSql);
        console.log('SUCCESS: Trigger function updated successfully!');

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await client.end();
    }
}

run();
