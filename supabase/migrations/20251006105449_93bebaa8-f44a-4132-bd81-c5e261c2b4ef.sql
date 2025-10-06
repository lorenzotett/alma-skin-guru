-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  step TEXT,
  price DECIMAL(10,2) NOT NULL,
  description_short TEXT,
  description_long TEXT,
  inci TEXT,
  key_ingredients TEXT[],
  how_to_use TEXT,
  skin_types TEXT[],
  concerns_treated TEXT[],
  product_url TEXT NOT NULL,
  image_url TEXT,
  times_recommended INTEGER DEFAULT 0,
  times_clicked INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  brand TEXT DEFAULT 'Alma Natural Beauty'
);

-- Create users/contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT,
  email TEXT,
  phone TEXT,
  skin_type TEXT,
  concerns TEXT[],
  age INTEGER,
  product_type TEXT,
  additional_info TEXT,
  photo_url TEXT,
  discount_code TEXT,
  email_sent BOOLEAN DEFAULT false,
  email_opened_at TIMESTAMP WITH TIME ZONE,
  email_clicked_at TIMESTAMP WITH TIME ZONE,
  conversation_id UUID
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  duration INTEGER,
  messages JSONB[]
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  user_id UUID REFERENCES public.contacts(id),
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent BOOLEAN DEFAULT false,
  opened BOOLEAN DEFAULT false,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- Create admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT
);

-- Create contact_products junction table
CREATE TABLE IF NOT EXISTS public.contact_products (
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, product_id)
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_products ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable
CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (true);

-- Contacts can be created by anyone (for chatbot)
CREATE POLICY "Anyone can create contacts" ON public.contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all contacts" ON public.contacts
  FOR SELECT USING (true);

-- Conversations can be created by anyone
CREATE POLICY "Anyone can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view conversations" ON public.conversations
  FOR SELECT USING (true);

-- Email logs
CREATE POLICY "Admins can manage email logs" ON public.email_logs
  FOR ALL USING (true);

-- Contact products
CREATE POLICY "Anyone can create contact products" ON public.contact_products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view contact products" ON public.contact_products
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);