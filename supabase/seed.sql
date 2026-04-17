-- Supabase Seed Data for SmartForms Platform

-- 1. Initial Admin User Metadata (Instructions)
-- Note: Supabase Users are managed via Auth. To designate an admin:
-- INSERT INTO public.users (id, role, wallet_balance) VALUES ('<USER_UUID>', 'admin', 99999.99);

-- 2. Default Affidavit Templates (html_templates)
INSERT INTO html_templates (title, raw_html, parsed_fields, price) VALUES
(
  'General Income Affidavit',
  '<div style="font-family: serif; padding: 40px; line-height: 1.6;">
    <h1 style="text-align: center; text-decoration: underline;">AFFIDAVIT</h1>
    <p>I, <strong>{{full_name}}</strong>, son/daughter of <strong>{{father_name}}</strong>, aged about {{age}} years, residing at {{address}}, do hereby solemnly affirm and state as follows:</p>
    <p>1. That I am the deponent herein and well conversant with the facts stated below.</p>
    <p>2. That my total annual income from all sources (including agriculture, business, and service) for the financial year {{financial_year}} is Rs. {{annual_income}}/- (Rupees {{annual_income_words}} only).</p>
    <p>3. That I require this affidavit for the purpose of {{purpose}}.</p>
    <p>Verification: Verified at {{place}} on this {{date}} that the contents of the above affidavit are true and correct to the best of my knowledge.</p>
    <br><br>
    <p style="text-align: right;">(Signature of Deponent)</p>
  </div>',
  '["full_name", "father_name", "age", "address", "financial_year", "annual_income", "annual_income_words", "purpose", "place", "date"]'::jsonb,
  20.00
),
(
  'Address Proof Affidavit',
  '<div style="font-family: serif; padding: 40px; line-height: 1.6;">
    <h1 style="text-align: center; text-decoration: underline;">ADDRESS AFFIDAVIT</h1>
    <p>I, <strong>{{full_name}}</strong>, S/o <strong>{{father_name}}</strong>, residing at <strong>{{permanent_address}}</strong> for the last {{years_resident}} years, do hereby declare:</p>
    <p>1. That the above address is my permanent place of residence.</p>
    <p>2. That I have no other permanent address in the state of {{state_name}}.</p>
    <p>3. That I am submitting this affidavit as a proof of residence for {{document_type}} application.</p>
    <br><br>
    <p>Date: {{date}}<br>Place: {{place}}</p>
    <p style="text-align: right;">DEPONENT</p>
  </div>',
  '["full_name", "father_name", "permanent_address", "years_resident", "state_name", "document_type", "date", "place"]'::jsonb,
  20.00
),
(
  'Gap Year Certificate',
  '<div style="font-family: serif; padding: 40px; line-height: 1.6;">
    <h1 style="text-align: center;">GAP AFFIDAVIT</h1>
    <p>I, <strong>{{student_name}}</strong>, S/o <strong>{{parent_name}}</strong>, resident of {{address}}, do hereby state:</p>
    <p>1. That I passed my {{last_qualification}} examination in the year {{passing_year}} from {{institution_name}}.</p>
    <p>2. That I did not join any regular course in any college/university during the period from {{gap_start}} to {{gap_end}}.</p>
    <p>3. That during this gap period, I was preparing for {{exam_name}} and was not involved in any criminal activity.</p>
    <br><br>
    <p style="text-align: right;">DEPONENT</p>
  </div>',
  '["student_name", "parent_name", "address", "last_qualification", "passing_year", "institution_name", "gap_start", "gap_end", "exam_name"]'::jsonb,
  20.00
)
ON CONFLICT DO NOTHING;

-- 3. Supplemental Mock Tests (Defense & Banking)
INSERT INTO mock_tests (title, duration_minutes, negative_marking_ratio, questions_payload) VALUES
(
  'Indian Army GD - Sample Practice Test',
  60,
  0.25,
  '{
    "questions": [
      {"id": 1, "subject": "Science", "question": "What is the chemical symbol for Gold?", "options": {"A": "Ag", "B": "Au", "C": "Fe", "D": "Pb"}, "correct": "B", "explanation": "Au is the symbol for Gold (Aurum)."},
      {"id": 2, "subject": "General Knowledge", "question": "Who was the first President of India?", "options": {"A": "Jawaharlal Nehru", "B": "Sardar Patel", "C": "Dr. Rajendra Prasad", "D": "B.R. Ambedkar"}, "correct": "C", "explanation": "Dr. Rajendra Prasad was the first President."}
    ]
  }'::jsonb
)
ON CONFLICT DO NOTHING;
