-- Add UPDATE policy for orders table
create policy "Staff can update orders" 
on orders for update 
using (auth.role() = 'authenticated');

-- Also ensure DELETE policy exists if we ever need to delete orders (though usually we cancel them)
create policy "Staff can delete orders" 
on orders for delete 
using (auth.role() = 'authenticated');

-- Add policies for order_items
create policy "Staff can update order items" 
on order_items for update 
using (auth.role() = 'authenticated');

create policy "Staff can delete order items" 
on order_items for delete 
using (auth.role() = 'authenticated');
