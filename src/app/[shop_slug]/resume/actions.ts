'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { deductWallet } from '@/lib/wallet';
import { GoogleGenerativeAI } from '@google/generative-ai';

const RESUME_COST_RS = 10;

export async function deductForResumeAction(
  shop_slug: string,
  referenceId: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  // 1. Authenticate
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Not authenticated.' };
  }

  // 2. Deduct wallet
  try {
    const result = await deductWallet(
      user.id,
      RESUME_COST_RS,
      'service_deduction',
      `RESUME-${referenceId}`
    );

    // 3. Revalidate
    revalidatePath(`/${shop_slug}`);
    revalidatePath(`/${shop_slug}/dashboard`);

    return { success: true, newBalance: result.newBalance };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Deduction failed';
    return { 
      success: false, 
      error: errorMessage.includes('Insufficient') 
        ? `Insufficient balance (₹${RESUME_COST_RS} required).` 
        : errorMessage 
    };
  }
}

/**
 * AI Resume Summary Generator
 */
export async function generateResumeSummaryAction(
  jobTitle: string,
  experience?: string
): Promise<{ success: boolean; summary?: string; error?: string }> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  try {
    const prompt = `Professional Resume Summary Creator.
    Job Title: ${jobTitle}
    Experience Details: ${experience || 'Not provided'}
    
    Task: Write a highly professional, 2-3 sentence resume summary tailored for a high-quality CV in India.
    Focus on impact, skills, and reliability. 
    Do NOT use fluff. Keep it punchy and outcome-oriented.
    
    Summary:`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();

    return { success: true, summary };
  } catch (err: unknown) {
    console.error('AI Summary Error:', err);
    return { success: false, error: 'Failed to generate professional summary.' };
  }
}
