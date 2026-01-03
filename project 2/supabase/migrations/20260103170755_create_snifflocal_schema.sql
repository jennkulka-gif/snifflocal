/*
  # SniffLocal Database Schema
  
  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Category name like "Park", "Cafe", "Beach"
      - `icon` (text) - Icon name for display
      - `created_at` (timestamptz)
    
    - `spots`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the dog-friendly spot
      - `description` (text) - Details about the spot
      - `category_id` (uuid) - Foreign key to categories
      - `address` (text) - Full address
      - `latitude` (numeric) - GPS latitude
      - `longitude` (numeric) - GPS longitude
      - `image_url` (text) - Photo of the spot
      - `amenities` (text[]) - Array of amenities (water bowls, off-leash, etc.)
      - `average_rating` (numeric) - Calculated average rating
      - `total_reviews` (integer) - Count of reviews
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `reviews`
      - `id` (uuid, primary key)
      - `spot_id` (uuid) - Foreign key to spots
      - `user_name` (text) - Reviewer name
      - `rating` (integer) - Rating from 1-5
      - `comment` (text) - Review text
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Allow public read access (unauthenticated users can browse)
    - Reviews are read-only for now (can be extended for authenticated submissions)
  
  3. Indexes
    - Index on spots latitude/longitude for geolocation queries
    - Index on category_id for filtering
    - Index on spot_id for review lookups
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create spots table
CREATE TABLE IF NOT EXISTS spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  address text NOT NULL,
  latitude numeric(10, 8) NOT NULL,
  longitude numeric(11, 8) NOT NULL,
  image_url text NOT NULL,
  amenities text[] DEFAULT '{}',
  average_rating numeric(2, 1) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id uuid NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_spots_location ON spots(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_spots_category ON spots(category_id);
CREATE INDEX IF NOT EXISTS idx_reviews_spot ON reviews(spot_id);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public read access for categories (anyone can view)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

-- Public read access for spots (anyone can view)
CREATE POLICY "Anyone can view spots"
  ON spots FOR SELECT
  USING (true);

-- Public read access for reviews (anyone can view)
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);