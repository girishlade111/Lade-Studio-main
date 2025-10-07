-- Create updated_at trigger function first (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate categories table to ensure correct schema
DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
  id text PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  name varchar(255) NOT NULL UNIQUE,
  description text,
  image_url varchar(500),
  is_active boolean DEFAULT true
);

-- Create updated_at trigger for categories
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial categories based on existing product categories
INSERT INTO categories (id, name, description, is_active) VALUES
  ('painting', 'Painting', 'Beautiful hand-painted artworks and canvases', true),
  ('pots', 'Pots', 'Decorative and functional pottery items', true),
  ('canvas', 'Canvas', 'Canvas paintings and prints', true),
  ('hand-painted-jewelry', 'Hand Painted Jewelry', 'Unique hand-painted jewelry pieces', true),
  ('terracotta-pots', 'Terracotta Pots', 'Traditional terracotta pottery', true),
  ('fabric-painting', 'Fabric Painting', 'Hand-painted fabric items and textiles', true),
  ('portrait', 'Portrait', 'Custom portrait paintings', true),
  ('wall-hanging', 'Wall Hanging', 'Decorative wall hanging items', true)
ON CONFLICT (id) DO NOTHING;

-- Add category_id to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id text REFERENCES categories(id);

-- Update existing products to link them with categories using CAST
UPDATE products SET category_id = 
  CASE products.category::text
    WHEN 'Painting' THEN 'painting'
    WHEN 'Pots' THEN 'pots' 
    WHEN 'Canvas' THEN 'canvas'
    WHEN 'Hand Painted Jewelry' THEN 'hand-painted-jewelry'
    WHEN 'Terracotta Pots' THEN 'terracotta-pots'
    WHEN 'Fabric Painting' THEN 'fabric-painting'
    WHEN 'Portrait' THEN 'portrait'
    WHEN 'Wall Hanging' THEN 'wall-hanging'
    ELSE NULL
  END
WHERE category IS NOT NULL;