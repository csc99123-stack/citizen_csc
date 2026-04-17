# Frontend Testing PRD: SmartForms & Sarkari Exams Platform

## Overview
This document outlines the core workflows and critical paths for the SmartForms SaaS platform. It serves as the primary guidance for automated stress testing via TestSprite.

## Core Workflows

### 1. Authentication & Session Management
- **Description**: Users must be able to securely login and access their tenant-specific dashboard.
- **Critical Path**:
    - Login via `src/app/auth/login`.
    - Verification of session persistence across `/[shop_slug]/dashboard`.
    - Logout functionality.
- **Expected Outcome**: Unauthorized users are redirected to login; authorized users see their shop branding and wallet balance.

### 2. Universal Wallet Engine
- **Description**: All premium tools require a ₹10 deduction from the operator's wallet.
- **Critical Path**:
    - Atomic deduction using `supabase.rpc('decrement_wallet')`.
    - Transaction logging in `wallet_transactions` table.
    - Blocking access if `wallet_balance < 10`.
- **Expected Outcome**: Successful deduction for each service call; graceful error handling for insufficient funds.

### 3. AI MRO Letter Generator
- **Description**: Generates official letters using Gemini 2.0 Flash.
- **Critical Path**:
    - Data entry in `LetterForm` (Topic, Language, Tone).
    - Server Action `generateLetter` handles wallet deduction + Gemini API call.
    - Display of AI-generated text in A4 preview.
- **Cost**: ₹10 per generation.
- **Expected Outcome**: Contextually relevant letters in English, Hindi, or Telugu.

### 4. Professional Resume Builder
- **Description**: Multi-step form to generate a print-ready A4 resume.
- **Critical Path**:
    - Form completion (Personal, Work, Education, Skills).
    - Client-side PDF generation using `html2pdf.js`.
    - Wallet deduction via `deductForResumeAction`.
- **Cost**: ₹10 per download.
- **Expected Outcome**: Formatted PDF document downloaded to user's device.

### 5. Smart Affidavit Builder
- **Description**: Document builder for common legal affidavits.
- **Critical Path**:
    - Selection of template (e.g., Address Proof, Income).
    - Previewing legal boilerplate with dynamic user data.
    - PDF generation and ₹10 deduction.
- **Expected Outcome**: Legally formatted affidavit ready for printing on stamp paper.

### 6. Passport Photo Grid Maker
- **Description**: Image processing tool to create standard photo sheets.
- **Critical Path**:
    - Photo upload.
    - Layout selection (A4: 16 photos, 4x6: 8 photos).
    - Printing/Generation and ₹10 deduction.
- **Expected Outcome**: High-resolution print template with accurate dimensions.

### 7. Mock Test CBT Simulator
- **Description**: Gated access to full-length exam simulations.
- **Critical Path**:
    - Gating check in `/[shop_slug]/mock-test/page.tsx`.
    - Single test unlock (₹10) or Subscription check.
    - Timer-based exam interface.
- **Expected Outcome**: Access restricted until transaction is confirmed; functional CBT environment for authorized users.

## Testing Configuration
- **Base URL**: `http://localhost:3000`
- **Primary Credentials**: [Provide testing credentials if applicable]
- **Target Accuracy**: 100% pass rate for Wallet Deductions and Auth gates.
