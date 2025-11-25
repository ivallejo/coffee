-- 1. Clean up old triggers if they exist (from the old ingredients system)
DROP TRIGGER IF EXISTS on_order_item_created ON order_items;
DROP FUNCTION IF EXISTS deduct_inventory();

-- 2. Create function to record sale movement
CREATE OR REPLACE FUNCTION public.record_sale_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track inventory for products (not custom items without ID)
  IF NEW.product_id IS NOT NULL THEN
    INSERT INTO public.inventory_movements (
      product_id,
      type,
      quantity,
      reason,
      notes,
      created_by
    ) VALUES (
      NEW.product_id,
      'OUT',
      NEW.quantity,
      'Venta',
      'Orden ID: ' || NEW.order_id,
      auth.uid() -- The cashier who made the sale
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to order_items table
CREATE TRIGGER on_sale_record_movement
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.record_sale_movement();
