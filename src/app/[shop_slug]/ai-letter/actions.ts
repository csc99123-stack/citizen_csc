'use server';

import { revalidatePath } from 'next/cache';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { deductWallet } from '@/lib/wallet';
import { GenerateLetterResult, RefineLetterResult } from '@/lib/types';

const LETTER_COST_RS = 10;

export async function generateLetter(
  _prevState: GenerateLetterResult | null,
  formData: FormData
): Promise<GenerateLetterResult> {
  // ── 1. Authenticate ────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'You must be logged in to generate a letter.' };
  }

  // ── 2. Extract form fields ─────────────────────────────────────────────────
  const topic = (formData.get('letter-topic') as string)?.trim();
  const language = (formData.get('letter-language') as string) || 'English';
  const tone = (formData.get('letter-tone') as string) || 'Formal / Official';
  const recipient = (formData.get('letter-recipient') as string) || 'Mandal Revenue Officer (MRO)';
  const applicantName = (formData.get('applicant-name') as string)?.trim() || '[Applicant Name]';
  const applicantDesignation = (formData.get('applicant-designation') as string)?.trim() || '';
  const applicantAddress = (formData.get('applicant-address') as string)?.trim() || '';
  const applicantId = (formData.get('applicant-id') as string)?.trim() || '';
  const extraDetails = (formData.get('extra-details') as string)?.trim() || '';

  if (!topic) {
    return { success: false, error: 'Please enter the letter topic and purpose.' };
  }

  // ── 3. Check & deduct wallet ───────────────────────────────────────────────
  let newBalance = 0;
  try {
    const result = await deductWallet(
      user.id,
      LETTER_COST_RS,
      'service_deduction',
      `AI-LETTER-${Date.now()}`
    );
    newBalance = result.newBalance;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Wallet deduction failed';
    if (errorMessage.includes('Insufficient')) {
      return {
        success: false,
        error: `Insufficient wallet balance. You need ₹${LETTER_COST_RS}. Please recharge your wallet.`,
      };
    }
    return { success: false, error: errorMessage };
  }

  // ── 4. Call Gemini API (or Mock) ───────────────────────────────────────────
  if (process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
    return {
      success: true,
      letter: `[TEST MODE MOCK LETTER]
Respected Sir/Madam,

This is a mock letter generated for verification purposes. Subject: ${topic}. 
Applicant: ${applicantName}. Context: ${extraDetails}.

Thanking you,
Yours faithfully,
[Mock Generated Signature]`,
      newBalance,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a professional government letter writer in India with expertise in formal administrative correspondence.

Write a ${tone.toLowerCase()} government letter in **${language}** language.

**Details:**
- Recipient: ${recipient}
- Letter Topic / Purpose: ${topic}
- Applicant Name: ${applicantName}
${applicantDesignation ? `- Designation / Occupation: ${applicantDesignation}` : ''}
${applicantAddress ? `- Address: ${applicantAddress}` : ''}
${applicantId ? `- ID / Aadhar: ${applicantId}` : ''}
${extraDetails ? `- Additional Instructions / Custom Data: ${extraDetails}` : ''}

**Instructions:**
1. Write ONLY the body of the letter — from the salutation ("Respected Sir/Madam,") to the closing ("Yours faithfully,")
2. Do NOT include the letterhead, date, subject line, "To" address, or signature block — those are pre-printed
3. Use formal official language appropriate for Indian government correspondence
4. Keep the letter between 3-5 paragraphs, concise and legally appropriate
5. If the language is Telugu or Hindi, write the entire body in that language only
6. End with "Thanking you," on its own line, followed by "Yours faithfully,"

Generate the letter body now:`;

    const result = await model.generateContent(prompt);
    const letterText = result.response.text();

    if (!letterText) {
      return { success: false, error: 'AI generated an empty response. Please try again.' };
    }

    revalidatePath('/');

    return {
      success: true,
      letter: letterText,
      newBalance,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Gemini API call failed';
    console.error('[ai-letter] Gemini error:', errorMessage);
    // Wallet was already deducted — we log but return the error
    return {
      success: false,
      error: `AI generation failed: ${errorMessage}. ₹${LETTER_COST_RS} has been deducted from your wallet.`,
    };
  }
}

// ── Deduct wallet for any service (shared action) ───────────────────────────
export async function deductWalletAction(
  amount: number,
  service: string,
  referenceId: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated.' };

  try {
    const result = await deductWallet(user.id, amount, 'service_deduction', referenceId);
    return { success: true, newBalance: result.newBalance };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Deduction failed' };
  }
}
export async function refineLetter(
  currentLetter: string,
  prompt: string,
  language: string = 'English'
): Promise<RefineLetterResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in to refine a letter.' };
  }

  if (!prompt || !currentLetter) {
    return { success: false, error: 'Missing content or refinement prompt.' };
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const fullPrompt = `You are a professional government letter editing assistant.
    
Current Letter Body:
"""
${currentLetter}
"""

User's Refinement Request:
"${prompt}"

Instructions:
1. Rewrite the letter body based on the refinement request.
2. Return ONLY the updated body text.
3. Maintain the same formal tone and language (${language}) unless specified otherwise.
4. Keep the structure concise and professional.
5. Preserver Rich Text tags (like <b>, <i>, <u>) if they are present and relevant, but respond primarily in text that can be inserted into a contentEditable div.

Output the updated letter body now:`;

    const result = await model.generateContent(fullPrompt);
    const updatedLetter = result.response.text();

    if (!updatedLetter) {
      return { success: false, error: 'AI generated an empty response.' };
    }

    return {
      success: true,
      letter: updatedLetter,
    };
  } catch (err: unknown) {
    console.error('[ai-letter] Refine error:', err);
    return { success: false, error: 'AI refinement failed. Please try again.' };
  }
}
