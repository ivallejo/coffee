-- 1. Modificar el trigger de venta para ignorar productos compuestos
-- Esto evita que se descuente stock del producto "padre" (ej. Sandwich) que es virtual
CREATE OR REPLACE FUNCTION public.record_sale_movement()
RETURNS TRIGGER AS $$
DECLARE
    prod_type TEXT;
BEGIN
  -- Obtener el tipo de producto
  SELECT product_type INTO prod_type FROM products WHERE id = NEW.product_id;

  -- Solo registrar movimiento si es producto simple (tiene stock físico directo)
  -- Si prod_type es NULL, asumimos simple por compatibilidad
  IF NEW.product_id IS NOT NULL AND (prod_type IS NULL OR prod_type = 'simple') THEN
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
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Actualizar la función RPC para manejar solo ingredientes de compuestos
-- Esto evita el doble descuento en productos simples y asegura el descuento de ingredientes
CREATE OR REPLACE FUNCTION process_inventory_for_order(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
    item RECORD;
    ingredient RECORD;
    v_cashier_id UUID;
BEGIN
    -- Obtener cajero para registrar auditoría
    SELECT cashier_id INTO v_cashier_id FROM orders WHERE id = p_order_id;

    -- Iterar sobre los items de la orden
    FOR item IN 
        SELECT oi.product_id, oi.quantity, p.product_type, p.name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = p_order_id
    LOOP
        -- SOLO procesamos productos compuestos
        IF item.product_type = 'composite' THEN
            
            -- Descontamos sus ingredientes
            FOR ingredient IN
                SELECT ingredient_product_id, quantity
                FROM product_recipes
                WHERE parent_product_id = item.product_id
            LOOP
                -- Insertamos movimiento para el ingrediente
                -- El trigger 'on_inventory_movement' se encargará de actualizar el stock numérico
                INSERT INTO inventory_movements (
                    product_id,
                    type,
                    quantity,
                    reason,
                    notes,
                    created_by
                ) VALUES (
                    ingredient.ingredient_product_id,
                    'OUT',
                    item.quantity * ingredient.quantity,
                    'Venta (Receta)',
                    'Ingrediente para: ' || item.name,
                    v_cashier_id
                );
            END LOOP;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
