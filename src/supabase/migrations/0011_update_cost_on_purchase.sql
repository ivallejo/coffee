-- Trigger to update product cost price on purchase (IN movement)
CREATE OR REPLACE FUNCTION update_product_cost_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if it's an IN movement and has a valid unit cost
    IF NEW.type = 'IN' AND NEW.unit_cost IS NOT NULL AND NEW.unit_cost > 0 THEN
        UPDATE products
        SET cost_price = NEW.unit_cost
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_purchase_update_cost ON inventory_movements;
CREATE TRIGGER on_purchase_update_cost
    AFTER INSERT ON inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_product_cost_on_purchase();
