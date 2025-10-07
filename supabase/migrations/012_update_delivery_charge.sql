-- Update delivery_charge column in products table to ensure it exists and is properly configured
-- This migration ensures that all products have a delivery_charge column

-- Add delivery_charge column to products table if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC(10,2) NOT NULL DEFAULT 50.00;

-- Update existing products to have a default delivery charge if they don't already
UPDATE products SET delivery_charge = 50.00 WHERE delivery_charge = 0 OR delivery_charge IS NULL;

-- Ensure the column is NOT NULL
ALTER TABLE products ALTER COLUMN delivery_charge SET NOT NULL;

-- Add a comment to explain the column purpose
COMMENT ON COLUMN products.delivery_charge IS 'Delivery charge per product unit. This charge is included in the shipping_cost of orders.';

-- Note: The delivery_charge from products is aggregated and added to the base shipping cost (₹100)
-- to form the total shipping_cost in the orders table. This creates a direct connection between
-- product delivery charges and order shipping costs.