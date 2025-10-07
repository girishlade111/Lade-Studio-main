-- Supabase/PostgreSQL schema for Lade Studio

-- Create a custom type for product categories to ensure data consistency.
CREATE TYPE product_category AS ENUM (
    'Painting',
    'Pots',
    'Canvas',
    'Hand Painted Jewelry',
    'Terracotta Pots',
    'Fabric Painting',
    'Portrait',
    'Wall Hanging'
);

-- =================================================================
-- Products Table
-- Stores all product information.
-- =================================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,

    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    specification TEXT,
    
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2), -- The original price, if the product is on sale.
    
    category product_category,
    size TEXT, -- e.g., 'Small', 'Medium', 'Large'
    
    images TEXT[], -- An array of URLs to the product images.
    is_featured BOOLEAN DEFAULT false,

    -- For AI-related features
    ai_hint TEXT
);

-- Add an index on the slug for faster lookups.
CREATE INDEX idx_products_slug ON products(slug);

-- Add an index for featured products.
CREATE INDEX idx_products_is_featured ON products(is_featured);


-- =================================================================
-- Reviews Table
-- Stores customer reviews for products.
-- =================================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    author_name TEXT NOT NULL
);

-- Add an index on product_id for faster review lookups.
CREATE INDEX idx_reviews_product_id ON reviews(product_id);


-- =================================================================
-- Orders Table
-- Stores information about customer orders.
-- =================================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    
    -- Customer information
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address_line1 TEXT NOT NULL,
    shipping_address_line2 TEXT,
    shipping_city TEXT NOT NULL,
    shipping_state TEXT NOT NULL,
    shipping_pincode TEXT NOT NULL,
    
    -- Order details
    subtotal NUMERIC(10, 2) NOT NULL,
    shipping_cost NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    
    payment_method TEXT NOT NULL, -- e.g., 'razorpay', 'cod'
    payment_id TEXT, -- The ID from the payment provider (e.g., Razorpay order ID)
    
    status TEXT DEFAULT 'Processing' NOT NULL -- e.g., 'Processing', 'Shipped', 'Delivered', 'Cancelled'
);

-- Add an index for looking up orders by phone number.
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);


-- =================================================================
-- Order Items Table
-- This is a "join table" that links products to orders, as one order can have many products.
-- =================================================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- SET NULL in case a product is deleted
    
    quantity INT NOT NULL,
    price_at_purchase NUMERIC(10, 2) NOT NULL -- Store the price at the time of purchase
);

-- Add indexes for faster lookups.
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
