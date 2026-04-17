-- Migration 00002: RPC Functions, govt_posts table, subscription_plans, and SSC CGL seed data

-- ─── 1. govt_posts table (missing from initial schema) ──────────────────────
CREATE TABLE IF NOT EXISTS govt_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  category post_category NOT NULL DEFAULT 'job',
  content_html TEXT NOT NULL DEFAULT '',
  excerpt TEXT,
  organisation VARCHAR,
  state VARCHAR,
  total_posts INTEGER,
  last_date DATE,
  published_at TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN DEFAULT false,
  slug VARCHAR UNIQUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE govt_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published posts" ON govt_posts
  FOR SELECT USING (is_published = true);
CREATE POLICY "Admins manage all posts" ON govt_posts
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_govt_posts_search
  ON govt_posts USING gin(to_tsvector('english', title || ' ' || coalesce(excerpt, '')));

-- ─── 2. subscription_plans table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  validity_months INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active plans" ON subscription_plans
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage plans" ON subscription_plans
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ─── 3. user_subscriptions table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  razorpay_payment_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all subscriptions" ON user_subscriptions
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ─── 4. RPC: increment_wallet (atomic credit) ────────────────────────────────
CREATE OR REPLACE FUNCTION increment_wallet(_user_id UUID, _amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET wallet_balance = wallet_balance + _amount
  WHERE id = _user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', _user_id;
  END IF;
END;
$$;

-- ─── 5. RPC: decrement_wallet (atomic debit with balance guard) ───────────────
CREATE OR REPLACE FUNCTION decrement_wallet(_user_id UUID, _amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _current_balance NUMERIC;
BEGIN
  SELECT wallet_balance INTO _current_balance
  FROM users
  WHERE id = _user_id
  FOR UPDATE; -- row-level lock to prevent race conditions

  IF _current_balance IS NULL THEN
    RAISE EXCEPTION 'User % not found', _user_id;
  END IF;

  IF _current_balance < _amount THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Required: %', _current_balance, _amount;
  END IF;

  UPDATE users
  SET wallet_balance = wallet_balance - _amount
  WHERE id = _user_id;
END;
$$;

-- ─── 6. RPC: get_tenant_stats (admin dashboard) ──────────────────────────────
CREATE OR REPLACE FUNCTION get_tenant_stats()
RETURNS TABLE(
  tenant_id UUID,
  shop_name VARCHAR,
  shop_slug VARCHAR,
  wallet_balance NUMERIC,
  total_commissions NUMERIC,
  user_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS tenant_id,
    tb.shop_name,
    tb.shop_slug,
    u.wallet_balance,
    COALESCE(SUM(CASE WHEN wt.transaction_type = 'affiliate_commission' THEN wt.amount ELSE 0 END), 0) AS total_commissions,
    COUNT(DISTINCT b2c.id) AS user_count
  FROM users u
  JOIN tenant_branding tb ON tb.tenant_id = u.id
  LEFT JOIN wallet_transactions wt ON wt.user_id = u.id
  LEFT JOIN users b2c ON b2c.referred_by_tenant_id = u.id
  WHERE u.role = 'b2b_operator'
  GROUP BY u.id, tb.shop_name, tb.shop_slug, u.wallet_balance;
END;
$$;

-- ─── 7. Seed: Subscription Plans ──────────────────────────────────────────────
INSERT INTO subscription_plans (name, validity_months, price, features) VALUES
  ('Basic - SSC Starter', 1, 199, '["150+ SSC Sectional Tests", "Performance Report", "English & Hindi Support"]'::jsonb),
  ('Combo - SSC Premium', 6, 999, '["1500+ Full Tests", "Smart Analytics", "Live Rank Dashboard", "Bilingual Prep"]'::jsonb),
  ('Pro - UPSC Elite', 12, 4999, '["200+ Prelims Tests", "Mains Writing Module", "Daily Current Affairs", "All Exams Bundle"]'::jsonb)
ON CONFLICT DO NOTHING;

-- ─── 8. Seed: Sample govt_posts (Jobs) ───────────────────────────────────────
-- Note: Insert requires a valid admin user UUID — using a placeholder
-- In production, run this after creating the admin user.
INSERT INTO govt_posts (title, category, content_html, excerpt, organisation, state, total_posts, last_date, is_published, slug, published_at) VALUES
(
  'SBI Clerk Recruitment 2024 — 8,773 Posts',
  'job',
  '<h2>Important Dates</h2><p>Notification: 01 Nov 2024 | Last Date: 15 Nov 2024 | Exam: Jan 2025</p><h2>Vacancies</h2><p>Total 8,773 Posts across all states.</p><h2>Eligibility</h2><p>Graduate in any discipline from a recognised University.</p><h2>How to Apply</h2><p>Apply online at <strong>sbi.co.in/careers</strong></p>',
  'State Bank of India invites online applications for 8,773 Junior Associates (Customer Support & Sales).',
  'State Bank of India',
  'All India',
  8773,
  '2024-11-15',
  true,
  'sbi-clerk-2024',
  NOW()
),
(
  'UP Police Constable Recruitment 2024 — 60,244 Posts',
  'job',
  '<h2>Important Dates</h2><p>Notification: 15 Oct 2024 | Last Date: 28 Dec 2024 | Exam: Mar 2025</p><h2>Vacancies</h2><p>Total 60,244 Constable Posts in Uttar Pradesh Police.</p><h2>Eligibility</h2><p>10+2 (Intermediate) from a recognised board. Age: 18-22 years.</p><h2>How to Apply</h2><p>Apply online at <strong>uppbpb.gov.in</strong></p>',
  'UPPBPB invites online applications for 60,244 Constable (Civil Police) posts.',
  'UP Police Recruitment & Promotion Board',
  'Uttar Pradesh',
  60244,
  '2024-12-28',
  true,
  'up-police-constable-2024',
  NOW()
),
(
  'BPSC Teacher Recruitment 3.0 — 70,000 Posts',
  'job',
  '<h2>Important Dates</h2><p>Notification: 20 Oct 2024 | Last Date: 10 Jan 2025 | Exam: Apr 2025</p><h2>Vacancies</h2><p>Total 70,000+ Teacher Posts at TGT, PGT, and Primary levels.</p><h2>Eligibility</h2><p>Graduation + B.Ed or equivalent for TGT. PG + B.Ed for PGT. D.El.Ed for primary.</p><h2>How to Apply</h2><p>Apply online at <strong>bpsc.bih.nic.in</strong></p>',
  'BPSC announces 70,000+ teacher recruitment across primary, TGT, and PGT categories.',
  'Bihar Public Service Commission',
  'Bihar',
  70000,
  '2025-01-10',
  true,
  'bpsc-teacher-3',
  NOW()
),
(
  'SSC GD Constable Recruitment 2025 — 26,146 Posts',
  'job',
  '<h2>Important Dates</h2><p>Notification: 01 Nov 2024 | Last Date: 05 Feb 2025 | Exam: Jun 2025</p><h2>Vacancies</h2><p>Total 26,146 Posts in BSF, CISF, CRPF, SSB, ITBP, and AR.</p><h2>Eligibility</h2><p>10+2 (Intermediate). Age: 18-23 years (relaxation for reserved categories).</p><h2>How to Apply</h2><p>Apply online at <strong>ssc.gov.in</strong></p>',
  'SSC invites online applications for 26,146 GD Constable posts in CAPFs, NIA, SSF, and Rifleman (GD) in AR.',
  'Staff Selection Commission',
  'All India',
  26146,
  '2025-02-05',
  true,
  'ssc-gd-2025',
  NOW()
),
(
  'SSC MTS Recruitment 2024 | Havaldar Exam',
  'result',
  '<h2>Result Declared</h2><p>SSC MTS Paper-I Result 2024 has been declared on 15 Nov 2024.</p><h2>How to Check</h2><p>Visit <strong>ssc.gov.in</strong> → Results → MTS → Paper-I Result 2024.</p><h2>Next Step</h2><p>Shortlisted candidates will appear for Paper-II (Descriptive) on 22 Dec 2024.</p>',
  'SSC MTS Paper-I Result 2024 declared. Check your roll number in the merit list.',
  'Staff Selection Commission',
  'All India',
  NULL,
  '2024-11-15',
  true,
  'ssc-mts-result-2024',
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- ─── 9. Seed: Mock Test Questions (SSC CGL Pattern) ──────────────────────────
INSERT INTO mock_tests (title, duration_minutes, negative_marking_ratio, questions_payload) VALUES
(
  'SSC CGL Tier-I Full Mock Test #1',
  60,
  0.5,
  '{
    "questions": [
      {
        "id": 1, "subject": "General Awareness",
        "question": "Which article of the Indian Constitution abolishes untouchability?",
        "options": {"A": "Article 14", "B": "Article 17", "C": "Article 21", "D": "Article 25"},
        "correct": "B",
        "explanation": "Article 17 of the Indian Constitution abolishes untouchability in all its forms and its practice in any form is forbidden."
      },
      {
        "id": 2, "subject": "General Awareness",
        "question": "The Battle of Plassey was fought in which year?",
        "options": {"A": "1753", "B": "1757", "C": "1761", "D": "1764"},
        "correct": "B",
        "explanation": "The Battle of Plassey was fought on 23 June 1757 between the British East India Company and the Nawab of Bengal."
      },
      {
        "id": 3, "subject": "General Awareness",
        "question": "Which planet is known as the ''Red Planet''?",
        "options": {"A": "Venus", "B": "Jupiter", "C": "Mars", "D": "Saturn"},
        "correct": "C",
        "explanation": "Mars is called the Red Planet because of the reddish appearance due to iron oxide (rust) on its surface."
      },
      {
        "id": 4, "subject": "Quantitative Aptitude",
        "question": "If the cost price of 20 articles equals the selling price of 25 articles, what is the loss percentage?",
        "options": {"A": "20%", "B": "25%", "C": "15%", "D": "10%"},
        "correct": "A",
        "explanation": "Loss% = (25-20)/25 × 100 = 20%. The trader sells 25 articles at the price of 20, incurring a 20% loss."
      },
      {
        "id": 5, "subject": "Quantitative Aptitude",
        "question": "A train 150m long passes a pole in 15 seconds. Its speed is:",
        "options": {"A": "36 km/h", "B": "40 km/h", "C": "45 km/h", "D": "54 km/h"},
        "correct": "A",
        "explanation": "Speed = 150/15 m/s = 10 m/s = 10 × 18/5 km/h = 36 km/h."
      },
      {
        "id": 6, "subject": "Quantitative Aptitude",
        "question": "What is the simple interest on Rs. 5000 at 8% per annum for 3 years?",
        "options": {"A": "Rs. 1200", "B": "Rs. 1000", "C": "Rs. 1500", "D": "Rs. 2000"},
        "correct": "A",
        "explanation": "SI = (P × R × T)/100 = (5000 × 8 × 3)/100 = Rs. 1200."
      },
      {
        "id": 7, "subject": "English Language",
        "question": "Choose the correctly spelled word:",
        "options": {"A": "Necesary", "B": "Necessary", "C": "Neccessary", "D": "Necesssary"},
        "correct": "B",
        "explanation": "The correct spelling is ''Necessary'' — one ''c'' and two ''s'' letters."
      },
      {
        "id": 8, "subject": "English Language",
        "question": "Select the synonym of the word ''BENEVOLENT'':",
        "options": {"A": "Cruel", "B": "Generous", "C": "Miserly", "D": "Indifferent"},
        "correct": "B",
        "explanation": "Benevolent means well-meaning and kindly; its synonym is Generous."
      },
      {
        "id": 9, "subject": "General Intelligence & Reasoning",
        "question": "If DELHI = 73541 and CALCUTTA = 82589662, then how is CALICUT coded?",
        "options": {"A": "8251896", "B": "8258176", "C": "8251876", "D": "8251796"},
        "correct": "C",
        "explanation": "Using the coding: C=8, A=2, L=5, I=1, C=8, U=9, T=6 → CALICUT = 8251876."
      },
      {
        "id": 10, "subject": "General Intelligence & Reasoning",
        "question": "Find the odd one out: 2, 5, 10, 17, 26, 37, 50, 64",
        "options": {"A": "17", "B": "26", "C": "37", "D": "64"},
        "correct": "D",
        "explanation": "Series follows n²+1 pattern: 1+1=2, 4+1=5, 9+1=10, 16+1=17, 25+1=26, 36+1=37, 49+1=50. Next should be 64+1=65, but 64 is given without +1."
      },
      {
        "id": 11, "subject": "General Awareness",
        "question": "Which river is known as the ''Sorrow of Bihar''?",
        "options": {"A": "Ganga", "B": "Kosi", "C": "Gandak", "D": "Son"},
        "correct": "B",
        "explanation": "Kosi river is called the ''Sorrow of Bihar'' due to its devastating floods that cause massive destruction in Bihar."
      },
      {
        "id": 12, "subject": "Quantitative Aptitude",
        "question": "The ratio of the ages of A and B is 3:5. After 10 years, the ratio becomes 5:7. Find B''s current age.",
        "options": {"A": "20 years", "B": "25 years", "C": "30 years", "D": "35 years"},
        "correct": "B",
        "explanation": "Let ages be 3x and 5x. (3x+10)/(5x+10) = 5/7 → 21x+70 = 25x+50 → x=5. B''s age = 5×5 = 25 years."
      },
      {
        "id": 13, "subject": "English Language",
        "question": "Fill in the blank: He _____ the report before the manager arrived.",
        "options": {"A": "complete", "B": "had completed", "C": "has completed", "D": "will complete"},
        "correct": "B",
        "explanation": "Past perfect tense (had + V3) is used for an action completed before another past action."
      },
      {
        "id": 14, "subject": "General Intelligence & Reasoning",
        "question": "If 6 × 4 = 46, 8 × 3 = 38, then 7 × 5 = ?",
        "options": {"A": "57", "B": "75", "C": "35", "D": "53"},
        "correct": "A",
        "explanation": "The pattern reverses the results: 6×4=24→42+4=46. Actually: digits are swapped and one is added. 7×5=35→57."
      },
      {
        "id": 15, "subject": "General Awareness",
        "question": "The headquarters of the International Court of Justice (ICJ) is located in:",
        "options": {"A": "New York", "B": "Geneva", "C": "The Hague", "D": "Vienna"},
        "correct": "C",
        "explanation": "The International Court of Justice (ICJ) is headquartered at The Hague, Netherlands."
      }
    ]
  }'::jsonb
)
ON CONFLICT DO NOTHING;
