-- Update products table to add category_id foreign key
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id text REFERENCES categories(id);

-- Update existing products to link them with categories using CAST
UPDATE products SET category_id = (
  SELECT id FROM categories WHERE categories.name = products.category::text
) WHERE category IS NOT NULL;

-- Create custom_designs table
CREATE TABLE IF NOT EXISTS custom_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Customer information
  customer_name varchar(255) NOT NULL,
  customer_email varchar(255) NOT NULL,
  customer_phone varchar(50),
  
  -- Design details
  category_id text NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  design_reference_images text[] DEFAULT '{}',
  quantity integer NOT NULL CHECK (quantity > 0),
  additional_details text,
  
  -- Request status
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  admin_notes text,
  estimated_completion_date date,
  
  -- Pricing
  estimated_price decimal(10,2),
  final_price decimal(10,2)
);

-- Create updated_at trigger
CREATE TRIGGER update_custom_designs_updated_at 
    BEFORE UPDATE ON custom_designs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_designs_customer_email ON custom_designs(customer_email);
CREATE INDEX IF NOT EXISTS idx_custom_designs_category_id ON custom_designs(category_id);
CREATE INDEX IF NOT EXISTS idx_custom_designs_product_id ON custom_designs(product_id);
CREATE INDEX IF NOT EXISTS idx_custom_designs_status ON custom_designs(status);
CREATE INDEX IF NOT EXISTS idx_custom_designs_created_at ON custom_designs(created_at);

-- Enable Row Level Security
ALTER TABLE custom_designs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to insert their own custom design requests
CREATE POLICY "Users can insert custom design requests" 
ON custom_designs FOR INSERT 
WITH CHECK (true);

-- Allow users to read their own custom design requests
CREATE POLICY "Users can read their own custom design requests" 
ON custom_designs FOR SELECT 
USING (customer_email = auth.jwt() ->> 'email');

-- Allow authenticated users to read all custom designs (for admin)
CREATE POLICY "Authenticated users can read all custom designs" 
ON custom_designs FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow authenticated users to update custom designs (for admin)
CREATE POLICY "Authenticated users can update custom designs" 
ON custom_designs FOR UPDATE 
USING (auth.role() = 'authenticated');