'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { deductWallet } from '@/lib/wallet';
import { GoogleGenerativeAI } from '@google/generative-ai';

const AFFIDAVIT_COST_RS = 20;

export async function deductForAffidavitAction(
  shop_slug: string,
  referenceId: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  // 1. Authenticate
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'You must be logged in to generate documents.' };
  }

  // 2. Deduct wallet
  try {
    const result = await deductWallet(
      user.id,
      AFFIDAVIT_COST_RS,
      'service_deduction',
      `AFFIDAVIT-${referenceId}`
    );

    // 3. Revalidate path to update UI balance
    revalidatePath(`/${shop_slug}`);
    revalidatePath(`/${shop_slug}/dashboard`);

    return { 
      success: true, 
      newBalance: result.newBalance 
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Wallet deduction failed';
    return { 
      success: false, 
      error: errorMessage.includes('Insufficient') 
        ? `Insufficient balance (₹${AFFIDAVIT_COST_RS} required).` 
        : errorMessage 
    };
  }
}

/**
 * AI Document Analysis: Extracts entities from uploaded proof documents (Aadhar, SSC, etc.)
 */
export async function analyzeReferenceDocument(
  base64Data: string,
  mimeType: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  try {
    const prompt = `Analyze this legal proof document (Aadhar, SSC, PAN, etc.). 
    Extract the following entities exactly as they appear in the document:
    - Full Name
    - Date of Birth (Age)
    - Father's Name
    - Full Address
    - Unique ID Number (if any)
    
    Return the result in JSON format only. If an entity is not found, use null.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const response = result.response.text();
    const jsonStr = response.replace(/```json|```/g, '').trim();
    const data = JSON.parse(jsonStr);

    return { success: true, data };
  } catch (err: unknown) {
    console.error('Gemini Analysis Error:', err);
    return { success: false, error: 'Failed to extract data mapping from document.' };
  }
}

/**
 * AI Affidavit Generator: Drafts a professional legal body based on intent.
 */
export async function generateAffidavitBody(
  type: string,
  details: string,
  context?: string
): Promise<{ success: boolean; body?: string; error?: string }> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  try {
    const prompt = `You are a professional legal drafter in India. 
    Write the live BODY of an affidavit for: ${type}.
    
    User Context/Instructions: ${details}
    Additional Proof Context: ${context || 'None'}
    
    Instructions:
    1. Write ONLY the core points (numbered list if applicable).
    2. Start with the affirmation: "I, the deponent... do hereby solemnly affirm and state on oath as follows:"
    3. Use formal legal terminology appropriate for Indian courts/offices.
    4. Do NOT include header, footers, or signature blocks.
    5. Maintain Rich Text tags like <b> or <u> if necessary.
    
    Generate the affidavit body now:`;

    const result = await model.generateContent(prompt);
    const body = result.response.text();

    return { success: true, body };
  } catch (err: unknown) {
    console.error('Gemini Generation Error:', err);
    return { success: false, error: 'AI failed to draft the affidavit.' };
  }
}
