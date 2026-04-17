'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { generateLetter, refineLetter } from '../actions';
import type { GenerateLetterResult } from '@/lib/types';
import html2pdf from 'html2pdf.js';

const INITIAL_LETTER = `With reference to the aforementioned subject, I, the undersigned, am writing to formally bring to your notice the matter as described in the subject and humbly request appropriate action.<br><br>
I have attached all relevant supporting documentation as required under the applicable rules and regulations. I confirm that all information provided herein is true, accurate, and complete to the best of my knowledge.<br><br>
I kindly request your esteemed office to take cognizance of this application and process the same at the earliest convenience. I shall remain available for any verification or clarification that may be required.<br><br>
Thanking you,<br>
Yours faithfully,`;

interface LetterFormProps {
  shopSlug: string;
  walletBalance: number;
}

type MarginType = 'standard' | 'letterhead' | 'legal';

export function LetterForm({ shopSlug, walletBalance }: LetterFormProps) {
  const [state, formAction, isPending] = useActionState<GenerateLetterResult | null, FormData>(
    generateLetter,
    null
  );
  const previewRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  
  // New States for AI Letter Assistant
  const [editableContent, setEditableContent] = useState(INITIAL_LETTER);
  const [marginType, setMarginType] = useState<MarginType>('standard');
  const [topMarginInch, setTopMarginInch] = useState(0.75); // Standard top margin
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineCount, setRefineCount] = useState(0);
  const [recipient, setRecipient] = useState('Mandal Revenue Officer (MRO)');
  
  // Global Formatting States
  const [fontFamily, setFontFamily] = useState("'Times New Roman', serif");
  const [fontSize, setFontSize] = useState(12);
  const [lineHeight, setLineHeight] = useState(1.5);
  
  // Active Formatting States
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
  });

  // Track selection changes to update toolbar state
  useEffect(() => {
    const handleSelectionChange = () => {
      if (typeof document === 'undefined') return;
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        alignLeft: document.queryCommandState('justifyLeft'),
        alignCenter: document.queryCommandState('justifyCenter'),
        alignRight: document.queryCommandState('justifyRight'),
        alignJustify: document.queryCommandState('justifyFull'),
      });
    };
    
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Auto-scale A4 to fit container width
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 48; // padding
        const a4Width = 794; // ~210mm at 96dpi
        if (containerWidth < a4Width) {
          setScale(containerWidth / a4Width);
        } else {
          setScale(1);
        }
      }
    };
    
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync state when a new letter is generated
  useEffect(() => {
    if (state?.success && state.letter) {
      setEditableContent(state.letter.replace(/\n/g, '<br>'));
      setRefineCount(0); // Reset refinement count for a new letter
      if (previewRef.current) {
        previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [state]);

  const handleRefine = async () => {
    if (!refinementPrompt || isRefining || refineCount >= 5) return;
    
    setIsRefining(true);
    try {
      const result = await refineLetter(editableContent, refinementPrompt);
      if (result.success && result.letter) {
        setEditableContent(result.letter.replace(/\n/g, '<br>'));
        setRefineCount(prev => prev + 1);
        setRefinementPrompt('');
      } else {
        alert(result.error || 'Refinement failed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleDownloadPDF = () => {
    const element = previewRef.current;
    if (!element) return;

    // To ensure high quality and scale-independence, we use a high scale factor
    // and ensure the capture doesn't inherit the UI's CSS transform scale.
    const opt = {
      margin: 0,
      filename: `AI_Letter_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 3, 
        useCORS: true, 
        letterRendering: true,
        // Ensure we capture the full element regardless of UI scaling
        windowWidth: 794, // Force A4 width in pixels for capture consistency
      },
      jsPDF: { unit: 'mm', format: marginType === 'legal' ? 'legal' : 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const execCommand = (cmd: string, value: string = '') => {
    document.execCommand(cmd, false, value);
    if (canvasRef.current) {
      setEditableContent(canvasRef.current.innerHTML);
    }
    // Manually trigger a state refresh for the toolbar
    setActiveFormats(prev => ({
      ...prev,
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      alignLeft: document.queryCommandState('justifyLeft'),
      alignCenter: document.queryCommandState('justifyCenter'),
      alignRight: document.queryCommandState('justifyRight'),
      alignJustify: document.queryCommandState('justifyFull'),
    }));
  };

  const currentBalance = state?.newBalance ?? walletBalance;

  return (
    <div className="flex-1 overflow-hidden grid grid-cols-12">
      {/* ── Left Panel: Form Controls ─────────────────────────── */}
      <section className="col-span-12 md:col-span-5 lg:col-span-4 bg-slate-100/60 p-8 overflow-y-auto custom-scrollbar border-r border-slate-200/50">
        <div className="max-w-md mx-auto space-y-7">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-1.5 text-balance">AI Letter Assistant</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Craft professional, legally compliant letters in seconds using Gemini AI.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-orange-700 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200/60">
              <span className="material-symbols-outlined text-orange-600 text-sm">payments</span>
              Cost: ₹10 per letter · Current balance: ₹{currentBalance.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Error / Success feedback */}
          {state && !state.success && (
            <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200/60 rounded-xl text-red-600 text-sm">
              <span className="material-symbols-outlined text-sm mt-0.5 flex-shrink-0">error</span>
              <span>{state.error}</span>
            </div>
          )}
          {state?.success && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200/60 rounded-xl text-green-700 text-sm font-medium">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Letter generated! ₹10 deducted. New balance: ₹{currentBalance.toLocaleString('en-IN')}
            </div>
          )}

          <form action={formAction} className="space-y-6">
            {/* Topic Input */}
            <div className="space-y-1.5">
              <label htmlFor="letter-topic" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Letter Topic & Purpose *
              </label>
              <textarea
                id="letter-topic"
                name="letter-topic"
                required
                className="w-full bg-white rounded-xl p-4 border border-slate-200/60 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/40 min-h-[100px] text-sm shadow-sm transition-all outline-none resize-none"
                placeholder="e.g., Application for new water connection at Sector 4, Hyderabad..."
              />
            </div>

            {/* Language & Tone Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="letter-language" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Language</label>
                <div className="relative">
                  <select id="letter-language" name="letter-language" className="w-full bg-white rounded-xl px-4 py-3 border border-slate-200/60 focus:ring-2 focus:ring-orange-500/20 text-sm shadow-sm appearance-none outline-none">
                    <option>English</option>
                    <option>Telugu (తెలుగు)</option>
                    <option>Hindi (हिन्दी)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="letter-tone" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tone</label>
                <div className="relative">
                  <select id="letter-tone" name="letter-tone" className="w-full bg-white rounded-xl px-4 py-3 border border-slate-200/60 focus:ring-2 focus:ring-orange-500/20 text-sm shadow-sm appearance-none outline-none">
                    <option>Formal / Official</option>
                    <option>Urgent</option>
                    <option>Persuasive</option>
                    <option>Request</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
                </div>
              </div>
            </div>

            {/* Recipient - Dynamic / Creatable */}
            <div className="space-y-1.5">
              <label htmlFor="letter-recipient" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Recipient Authority</label>
              <div className="relative group">
                <input 
                  list="recipient-suggestions"
                  id="letter-recipient" 
                  name="letter-recipient" 
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-white rounded-xl px-4 py-3 border border-slate-200/60 focus:ring-2 focus:ring-orange-500/20 text-sm shadow-sm outline-none"
                  placeholder="Type or select authority..."
                />
                <datalist id="recipient-suggestions">
                  <option value="Mandal Revenue Officer (MRO)" />
                  <option value="Municipal Commissioner" />
                  <option value="District Collector" />
                  <option value="Sub-Registrar" />
                  <option value="RTO (Regional Transport Office)" />
                  <option value="Block Development Officer (BDO)" />
                </datalist>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-sm">edit</span>
              </div>
            </div>

            {/* Applicant Details */}
            <div className="bg-white/80 p-5 rounded-2xl space-y-3 border border-slate-200/50">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-slate-500 text-sm">person</span>
                Applicant Details
              </h3>
              <input id="applicant-name" name="applicant-name" className="w-full bg-slate-50 rounded-lg px-4 py-2.5 text-sm border border-slate-200/60 focus:ring-1 focus:ring-orange-500/20 outline-none" placeholder="Full Legal Name" type="text" />
              <input id="applicant-designation" name="applicant-designation" className="w-full bg-slate-50 rounded-lg px-4 py-2.5 text-sm border border-slate-200/60 focus:ring-1 focus:ring-orange-500/20 outline-none" placeholder="Designation / Occupation" type="text" />
              <input id="applicant-address" name="applicant-address" className="w-full bg-slate-50 rounded-lg px-4 py-2.5 text-sm border border-slate-200/60 focus:ring-1 focus:ring-orange-500/20 outline-none" placeholder="Village / Mandal / District" type="text" />
              <input id="applicant-id" name="applicant-id" className="w-full bg-slate-50 rounded-lg px-4 py-2.5 text-sm border border-slate-200/60 focus:ring-1 focus:ring-orange-500/20 outline-none" placeholder="Aadhar / Registration ID (Optional)" type="text" />
            </div>

            {/* Extra Details */}
            <div className="space-y-1.5">
              <label htmlFor="extra-details" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Additional Details / Extra Information
              </label>
              <textarea
                id="extra-details"
                name="extra-details"
                className="w-full bg-white rounded-xl p-4 border border-slate-200/60 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/40 min-h-[80px] text-sm shadow-sm transition-all outline-none resize-none"
                placeholder="Any custom instructions or extra data to include..."
              />
            </div>

            {/* Generate Button */}
            <button
              id="generate-letter-btn"
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold py-4 rounded-xl shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isPending ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Generating with Gemini AI...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  Generate Letter (−₹10)
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* ── Right Panel: A4 Preview ───────────────────────────── */}
      <section ref={containerRef} className="col-span-12 md:col-span-7 lg:col-span-8 bg-slate-200 overflow-y-auto custom-scrollbar flex flex-col items-center py-10 px-6">
        
        {/* Margin Controls Toolbar */}
        <div className="w-full max-w-[210mm] mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-4 bg-white rounded-xl p-1 shadow-sm border border-slate-200/60">
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button 
                onClick={() => { setMarginType('standard'); setTopMarginInch(0.75); }}
                className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${marginType === 'standard' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Standard
              </button>
              <button 
                onClick={() => { setMarginType('letterhead'); setTopMarginInch(2.0); }}
                className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${marginType === 'letterhead' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Letterhead
              </button>
              <button 
                onClick={() => { setMarginType('legal'); setTopMarginInch(0.75); }}
                className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${marginType === 'legal' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Legal
              </button>
            </div>
            
            <div className="h-6 w-px bg-slate-200 mr-1"></div>
            
            <div className="flex items-center gap-3 pr-2">
              <label htmlFor="top-margin" className="text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">Top Margin (In):</label>
              <input 
                id="top-margin"
                type="number" 
                step="0.1"
                min="0"
                max="5"
                value={topMarginInch}
                onChange={(e) => setTopMarginInch(parseFloat(e.target.value) || 0)}
                className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500/20"
              />
            </div>
          </div>
          
          <button
            id="download-letter-btn"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            Export PDF
          </button>
        </div>

        {/* Formatting Toolbar (Sticky over canvas) */}
        <div className="w-full max-w-[210mm] sticky top-0 z-30 bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-t-2xl px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Font Family */}
            <div className="relative group">
              <select 
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium outline-none appearance-none focus:ring-1 focus:ring-orange-500/20"
              >
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="'Arial', sans-serif">Arial</option>
                <option value="'Calibri', sans-serif">Calibri</option>
                <option value="'Georgia', serif">Georgia</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">expand_more</span>
            </div>

            {/* Font Size */}
            <div className="relative group">
              <select 
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-xs font-medium outline-none appearance-none focus:ring-1 focus:ring-orange-500/20"
              >
                {[10, 11, 12, 13, 14, 16, 18, 20].map(size => (
                  <option key={size} value={size}>{size}pt</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">expand_more</span>
            </div>

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            {/* Formatting Actions */}
            <div className="flex items-center gap-0.5">
              <button 
                onClick={() => execCommand('bold')} 
                className={`p-2 rounded-lg transition-colors ${activeFormats.bold ? 'bg-orange-100 text-orange-600' : 'hover:bg-slate-100 text-slate-500'}`} 
                title="Bold"
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: activeFormats.bold ? "'wght' 700" : "" }}>format_bold</span>
              </button>
              <button 
                onClick={() => execCommand('italic')} 
                className={`p-2 rounded-lg transition-colors ${activeFormats.italic ? 'bg-orange-100 text-orange-600' : 'hover:bg-slate-100 text-slate-500'}`} 
                title="Italic"
              >
                <span className="material-symbols-outlined text-lg">format_italic</span>
              </button>
              <button 
                onClick={() => execCommand('underline')} 
                className={`p-2 rounded-lg transition-colors ${activeFormats.underline ? 'bg-orange-100 text-orange-600' : 'hover:bg-slate-100 text-slate-500'}`} 
                title="Underline"
              >
                <span className="material-symbols-outlined text-lg">format_underlined</span>
              </button>
            </div>

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            {/* Alignment */}
            <div className="flex items-center gap-0.5">
              <button 
                onClick={() => execCommand('justifyLeft')} 
                className={`p-2 rounded-lg transition-colors ${activeFormats.alignLeft ? 'bg-orange-100 text-orange-600' : 'hover:bg-slate-100 text-slate-500'}`} 
                title="Align Left"
              >
                <span className="material-symbols-outlined text-lg">format_align_left</span>
              </button>
              <button 
                onClick={() => execCommand('justifyCenter')} 
                className={`p-2 rounded-lg transition-colors ${activeFormats.alignCenter ? 'bg-orange-100 text-orange-600' : 'hover:bg-slate-100 text-slate-500'}`} 
                title="Align Center"
              >
                <span className="material-symbols-outlined text-lg">format_align_center</span>
              </button>
              <button 
                onClick={() => execCommand('justifyRight')} 
                className={`p-2 rounded-lg transition-colors ${activeFormats.alignRight ? 'bg-orange-100 text-orange-600' : 'hover:bg-slate-100 text-slate-500'}`} 
                title="Align Right"
              >
                <span className="material-symbols-outlined text-lg">format_align_right</span>
              </button>
              <button 
                onClick={() => execCommand('justifyFull')} 
                className={`p-2 rounded-lg transition-colors ${activeFormats.alignJustify ? 'bg-orange-100 text-orange-600' : 'hover:bg-slate-100 text-slate-500'}`} 
                title="Justify"
              >
                <span className="material-symbols-outlined text-lg">format_align_justify</span>
              </button>
            </div>

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            {/* Line Spacing */}
            <div className="relative group">
              <select 
                value={lineHeight}
                onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-[10px] font-black uppercase outline-none appearance-none focus:ring-1 focus:ring-orange-500/20"
              >
                {[1.0, 1.15, 1.5, 2.0].map(val => (
                  <option key={val} value={val}>{val === 1 ? 'Single' : val === 2 ? 'Double' : val}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">height</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${state?.success ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {state?.success ? 'AI Generated' : 'Draft Mode'}
            </span>
            {refineCount > 0 && (
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">Refined {refineCount}/5</span>
            )}
          </div>
        </div>

        {/* A4 Document Wrapper for Scaling */}
        <div 
          className="transition-transform duration-300 ease-out origin-top"
          style={{ transform: `scale(${scale})` }}
        >
          <div 
            id="letter-a4" 
            ref={previewRef}
            className={`w-[210mm] ${marginType === 'legal' ? 'min-h-[355mm]' : 'min-h-[297mm]'} bg-white shadow-2xl relative transition-all duration-500 overflow-hidden mb-8 flex-shrink-0`}
            style={{ 
              paddingTop: `${topMarginInch * 96}px`,
              paddingLeft: '60px',
              paddingRight: '60px',
              paddingBottom: '60px'
            }}
          >
          {/* Top accent */}
          {marginType === 'standard' && (
            <div data-html2canvas-ignore="true" className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500/40 via-orange-500 to-orange-500/40"></div>
          )}

          {/* Letterhead placeholder indicator (Non-printing) */}
          {topMarginInch > 1.2 && (
            <div 
              data-html2canvas-ignore="true"
              className="absolute top-0 left-0 w-full bg-slate-50 border-b border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest pointer-events-none select-none z-10"
              style={{ height: `${topMarginInch * 96}px` }}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">print_disabled</span>
                Letterhead Space (Reserved for Printing)
              </div>
            </div>
          )}

          {/* Generating overlay */}
          {(isPending || isRefining) && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 gap-4">
              <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-slate-700">{isRefining ? 'Refining with AI...' : 'Gemini is writing your letter...'}</p>
            </div>
          )}

          {/* Document Header */}
          <div className="flex justify-between items-start mb-14">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[10px]">account_balance</span>
                </div>
                <span className="font-bold text-xs tracking-tight text-slate-800 uppercase">Government Correspondence</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Ref: LA-{shopSlug.toUpperCase().replace(/-/g, '')}-{Math.floor(Date.now()/1000000)}</p>
              <p className="text-[10px] text-slate-500 font-medium">Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="text-right text-[10px] text-slate-500 space-y-0.5">
              <p className="font-bold text-slate-800 uppercase">SmartForms Digital Services</p>
              <p>Common Service Center</p>
              <p>{shopSlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
            </div>
          </div>

          {/* Addressee */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-slate-900 border-b border-slate-100 inline-block mb-1">To,</p>
            <p className="text-sm font-bold text-slate-900">{recipient},</p>
            <p className="text-sm text-slate-700">Official Jurisdiction, Government of India.</p>
          </div>

          {/* Subject */}
          <div className="mb-8 pb-4 border-b border-slate-200/60">
            <p className="font-bold text-slate-900 text-sm">
              Subject: <span className="font-normal italic text-slate-600">
                {state?.success ? '[As per application details below]' : '[Subject will be included in the body]'}
              </span>
            </p>
          </div>

          {/* Interactive Rich Text Canvas */}
          <div 
            ref={canvasRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setEditableContent(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: editableContent }}
            className="min-h-[300px] outline-none focus:ring-1 focus:ring-orange-100 rounded p-2 -mx-2 transition-all print:p-0 print:m-0"
            style={{ 
              fontFamily: fontFamily,
              fontSize: `${fontSize}pt`,
              lineHeight: lineHeight
            }}
          />

          {/* AI Stamp */}
          {(state?.success || refineCount > 0) && (
            <div className="absolute bottom-12 right-14 flex flex-col items-center select-none pointer-events-none opacity-40">
              <div className="w-16 h-16 rounded-full border-2 border-orange-500 flex items-center justify-center relative">
                <span className="material-symbols-outlined text-orange-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <p className="text-[8px] text-orange-600 font-bold uppercase mt-2 tracking-widest text-center">AI Assisted<br/>Verified</p>
            </div>
          )}
        </div>

        {/* Refinement Chatbox */}
        {state?.success && (
          <div className="w-full max-w-[210mm] bg-white rounded-2xl p-6 shadow-xl border border-blue-100 mt-2 mb-20 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 text-sm">chat_bubble</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Refine with AI</h4>
                <p className="text-[10px] text-slate-500">Free adjustments • No wallet deduction</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <input 
                type="text"
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                placeholder="e.g., 'Make it more urgent' or 'Add a paragraph about COVID relief'..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                disabled={refineCount >= 5}
              />
              <button 
                onClick={handleRefine}
                disabled={!refinementPrompt || isRefining || refineCount >= 5}
                className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                {isRefining ? '...' : (
                  <>
                    <span className="material-symbols-outlined text-lg">send</span>
                    Refine
                  </>
                )}
              </button>
            </div>
            {refineCount >= 5 && (
              <p className="mt-2 text-[10px] text-orange-600 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">info</span>
                Session limit reached (5 refinements). Regenerate for more.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
    </div>
  );
}
