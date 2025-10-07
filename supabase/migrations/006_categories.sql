-- Create updated_at trigger function first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create categories table first (needed for custom_designs foreign key)
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  name varchar(255) NOT NULL UNIQUE,
  slug varchar(255) NOT NULL UNIQUE,
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
INSERT INTO categories (id, name, slug, description, is_active) VALUES
  ('painting', 'Painting', 'painting', 'Beautiful hand-painted artworks and canvases', true),
  ('pots', 'Pots', 'pots', 'Decorative and functional pottery items', true),
  ('canvas', 'Canvas', 'canvas', 'Canvas paintings and prints', true),
  ('hand-painted-jewelry', 'Hand Painted Jewelry', 'hand-painted-jewelry', 'Unique hand-painted jewelry pieces', true),
  ('terracotta-pots', 'Terracotta Pots', 'terracotta-pots', 'Traditional terracotta pottery', true),
  ('fabric-painting', 'Fabric Painting', 'fabric-painting', 'Hand-painted fabric items and textiles', true),
  ('portrait', 'Portrait', 'portrait', 'Custom portrait paintings', true),
  ('wall-hanging', 'Wall Hanging', 'wall-hanging', 'Decorative wall hanging items', true)
ON CONFLICT (slug) DO NOTHING;