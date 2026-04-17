-- 1. Create Custom ENUM Types
CREATE TYPE user_role AS ENUM ('admin', 'b2b_operator', 'b2c_user');
CREATE TYPE transaction_type AS ENUM ('recharge', 'service_deduction', 'affiliate_commission');
CREATE TYPE post_category AS ENUM ('job', 'result', 'admit_card');

-- 2. Create Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'b2c_user',
  wallet_balance NUMERIC DEFAULT 0.00,
  referred_by_tenant_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins manage all users" ON users FOR ALL USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- 3. Create Tenant Branding Table
CREATE TABLE tenant_branding (
  tenant_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  shop_slug VARCHAR UNIQUE NOT NULL,
  logo_url VARCHAR,
  theme_colors JSONB,
  shop_name VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view tenant branding for routing" ON tenant_branding FOR SELECT USING (true);
CREATE POLICY "Tenants can update their own branding" ON tenant_branding FOR UPDATE USING (auth.uid() = tenant_id);

-- 4. Create Wallet Transactions Table
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  transaction_type transaction_type NOT NULL,
  reference_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON wallet_transactions FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- 5. Create HTML Templates Table
CREATE TABLE html_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  raw_html TEXT NOT NULL,
  parsed_fields JSONB,
  price NUMERIC NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE html_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active templates" ON html_templates FOR SELECT USING (true);
CREATE POLICY "Admins manage templates" ON html_templates FOR ALL USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- 6. Create Mock Tests Table
CREATE TABLE mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  duration_minutes INTEGER NOT NULL,
  negative_marking_ratio NUMERIC NOT NULL,
  questions_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view mock tests details" ON mock_tests FOR SELECT USING (true);
CREATE POLICY "Admins manage mock tests" ON mock_tests FOR ALL USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
