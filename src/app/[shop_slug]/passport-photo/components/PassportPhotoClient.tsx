'use client';

import { useState, useRef } from 'react';
import { deductForPassportAction } from '../actions';

interface PassportPhotoClientProps {
  shopSlug: string;
  walletBalance: number;
  userId: string | null;
}

const PHOTO_COST = 10;
// Standard passport photo dimensions (in mm): 35x45
const PHOTO_WIDTH_MM = 35;
const PHOTO_HEIGHT_MM = 45;

type LayoutSize = 'A4' | '4x6';

export function PassportPhotoClient({ shopSlug, walletBalance, userId }: PassportPhotoClientProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [layout, setLayout] = useState<LayoutSize>('A4');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState(walletBalance);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const PHOTOS_PER_SHEET = layout === 'A4' ? 8 : 16; // A4 (8 spaced), 4x6 (16 dense or 8 standard)
  // Let's settle on: A4 (8 photos), 4x6 (8 photos) for now to keep it simple and high quality.
  // Actually, user said "8 or 16". Let's do 16 for A4 (4x4) and 8 for 4x6 (2x4).
  const numPhotos = layout === 'A4' ? 16 : 8;

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG).');
      return;
    }
    setError(null);
    setIsUnlocked(false);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleDownloadPDF() {
    if (!userId) {
      setError('Login required.');
      return;
    }
    if (currentBalance < PHOTO_COST) {
      setError(`Insufficient balance. (₹${PHOTO_COST} required)`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Deduct wallet
      const result = await deductForPassportAction(shopSlug, `PP-${Date.now()}`);
      if (!result.success) {
        setError(result.error || 'Payment failed.');
        setIsProcessing(false);
        return;
      }

      setCurrentBalance(result.newBalance ?? currentBalance - PHOTO_COST);
      setIsUnlocked(true);

      // 2. Generate PDF
      const html2pdf = (await import('html2pdf.js')).default;
      const element = sheetRef.current;
      
      const format = layout === 'A4' ? 'a4' : [101.6, 152.4]; // 4x6 in in mm

      const opt = {
        margin: layout === 'A4' ? 10 : 2,
        filename: `PassportPhotos_${layout}_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3 },
        jsPDF: { unit: 'mm', format: format, orientation: 'portrait' }
      };

      await html2pdf().from(element).set(opt).save();

    } catch (err) {
      console.error(err);
      setError('Generation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Controls */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Passport Photo Maker</h2>
          <p className="text-slate-500 text-sm">Create professional print sheets in seconds.</p>
        </div>

        {/* Upload Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[200px] ${
            photoUrl ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/40'
          }`}
        >
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          {photoUrl ? (
            <div className="flex flex-col items-center gap-3">
              <img src={photoUrl} alt="Uploaded" className="w-20 h-24 object-cover rounded shadow-md border-2 border-white" />
              <p className="text-xs font-bold text-green-700 uppercase tracking-widest">Photo Loaded ✓</p>
            </div>
          ) : (
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">add_photo_alternate</span>
              <p className="text-sm font-bold text-slate-600">Click to upload photo</p>
            </div>
          )}
        </div>

        {/* Layout Selection */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Print Layout</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'A4', label: 'A4 Sheet', sub: '16 Photos (4×4)' },
              { id: '4x6', label: '4×6 inch', sub: '8 Photos (2×4)' },
            ].map((size) => (
              <button
                key={size.id}
                onClick={() => setLayout(size.id as LayoutSize)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  layout === size.id ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <p className={`text-sm font-bold ${layout === size.id ? 'text-blue-700' : 'text-slate-900'}`}>{size.label}</p>
                <p className="text-[10px] text-slate-500">{size.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Wallet & Button */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 uppercase tracking-widest font-bold">Wallet Balance</span>
            <span className="font-extrabold text-blue-400">₹{currentBalance.toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={!photoUrl || isProcessing || currentBalance < PHOTO_COST}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isProcessing ? 'hourglass_empty' : 'download'}
            </span>
            {isProcessing ? 'Processing...' : `Unlock & Download PDF (−₹${PHOTO_COST})`}
          </button>
          {error && <p className="text-center text-[10px] text-red-400 font-bold">{error}</p>}
        </div>
      </div>

      {/* Right: Preview */}
      <div className="flex flex-col items-center">
        <div className="w-full text-center mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Grid Preview</span>
        </div>

        <div className="bg-slate-200 p-8 rounded-lg">
          <div
            ref={sheetRef}
            className="bg-white shadow-xl mx-auto flex flex-wrap gap-4 p-8 justify-center align-start"
            style={{
              width: layout === 'A4' ? '180mm' : '101.6mm',
              minHeight: layout === 'A4' ? '240mm' : '152.4mm',
              gap: layout === 'A4' ? '8mm' : '4mm',
              padding: layout === 'A4' ? '15mm' : '5mm',
            }}
          >
            {Array.from({ length: numPhotos }).map((_, i) => (
              <div
                key={i}
                style={{ width: `${PHOTO_WIDTH_MM}mm`, height: `${PHOTO_HEIGHT_MM}mm` }}
                className="border border-slate-200 bg-slate-50 overflow-hidden"
              >
                {photoUrl && <img src={photoUrl} alt="p" className="w-full h-full object-cover object-top" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
