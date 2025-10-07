-- Add delivery_charge column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_charge decimal(10,2) DEFAULT 0.00;

-- Update existing products with default delivery charges (you can modify these values as needed)
UPDATE products SET delivery_charge = 50.00 WHERE delivery_charge IS NULL OR delivery_charge = 0.00;

-- Make delivery_charge NOT NULL after setting default values
ALTER TABLE products ALTER COLUMN delivery_charge SET NOT NULL;