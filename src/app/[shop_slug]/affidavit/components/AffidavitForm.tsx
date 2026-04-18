'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { deductForAffidavitAction, analyzeReferenceDocument, generateAffidavitBody } from '../actions';

interface AffidavitFormProps {
  shop_slug: string;
  initialBalance: number;
}

const steps = [
  { icon: 'person', label: 'Deponent details' },
  { icon: 'description', label: 'Affidavit Type' },
  { icon: 'upload_file', label: 'Proofs & Photos' },
  { icon: 'edit_note', label: 'Edit & Review' },
];

const AFFIDAVIT_TYPES = [
  { id: 'name-correction', label: 'Name Correction', fields: ['incorrectName', 'correctName'] },
  { id: 'dob-correction', label: 'Date of Birth Correction', fields: ['incorrectDob', 'correctDob'] },
  { id: 'income', label: 'Income Certificate', fields: ['annualIncome', 'occupation', 'incomeSource'] },
  { id: 'gap', label: 'Gap in Education', fields: ['gapYears', 'reasonForGap'] },
  { id: 'anti-ragging', label: 'Anti-Ragging Declaration', fields: ['collegeName', 'courseName'] },
  { id: 'joint-hindu-family', label: 'Joint Hindu Family', fields: ['kartaName', 'familyMembers'] },
  { id: 'custom', label: 'Other / Custom', fields: ['customRequirement'] }
];

export default function AffidavitForm({ shop_slug, initialBalance }: AffidavitFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [walletBalance, setWalletBalance] = useState(initialBalance);
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Custom Controls States
  const [topMarginInch, setTopMarginInch] = useState(1.0); // Default 1 inch, supports 3-5 for Stamp Paper
  const [lineHeight, setLineHeight] = useState(1.5);
  const [activeFormats, setActiveFormats] = useState({
    bold: false, italic: false, underline: false,
    alignLeft: false, alignCenter: false, alignRight: false, alignJustify: false,
  });

  // Form State
  const [formData, setFormData] = useState({
    docType: 'name-correction',
    stateName: 'Telangana',
    fullName: '',
    age: '',
    gender: 'Male',
    fatherName: '',
    address: '',
    date: new Date().toLocaleDateString('en-GB'),
    place: 'Hyderabad',
    extraDetails: '',
    // Dynamic Fields
    incorrectName: '',
    correctName: '',
    incorrectDob: '',
    correctDob: '',
    annualIncome: '',
    occupation: '',
    incomeSource: '',
    gapYears: '',
    reasonForGap: '',
    collegeName: '',
    courseName: '',
    kartaName: '',
    familyMembers: '',
    customRequirement: '',
  });

  // Body Content (AI Generated or Template)
  const [editableBody, setEditableBody] = useState('');
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [referenceDoc, setReferenceDoc] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); 
  };

  // ── AI & File Helpers ──────────────────────────────────────────────────────
  const handleFileAnalysis = async (file: File) => {
    setIsAnalyzing(true);
    setReferenceDoc(file);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await analyzeReferenceDocument(base64, file.type);
        if (res.success && res.data) {
          setFormData(prev => ({
            ...prev,
            fullName: res.data.fullName || prev.fullName,
            age: res.data.age || prev.age,
            fatherName: res.data.fatherName || prev.fatherName,
            address: res.data.address || prev.address,
          }));
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhotoUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setPassportPhoto(url);
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const typeLabel = AFFIDAVIT_TYPES.find(t => t.id === formData.docType)?.label || formData.docType;
      const res = await generateAffidavitBody(typeLabel, formData.customRequirement || 'Standard format');
      if (res.success && res.body) {
        setEditableBody(res.body);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Toolbar & Rich Text Logic ──────────────────────────────────────────────
  const execCommand = (cmd: string, value: string = '') => {
    document.execCommand(cmd, false, value);
    if (pdfRef.current) {
      // We'll update the editableBody state if needed, but usually we just let the DOM be
    }
    checkActiveFormats();
  };

  const checkActiveFormats = () => {
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

  useEffect(() => {
    document.addEventListener('selectionchange', checkActiveFormats);
    return () => document.removeEventListener('selectionchange', checkActiveFormats);
  }, []);

  const [isManuallyEdited, setIsManuallyEdited] = useState(false);

  // ── Template Logic ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isManuallyEdited) return;

    const templates: Record<string, string> = {
      'name-correction': `
        <ol style="padding-left: 20px; list-style-type: decimal;">
          <li style="margin-bottom: 15px;">That I am the deponent of this affidavit and am well acquainted with the facts stated herein.</li>
          <li style="margin-bottom: 15px;">That my name has been incorrectly recorded as <u>${formData.incorrectName || '[Old Name]'}</u> in the official records related to governmental documents.</li>
          <li style="margin-bottom: 15px;">That my correct and actual name as per my government issued identification documents (Aadhar/Voter ID) is <b>${formData.correctName || '[Correct Name]'}</b>.</li>
          <li style="margin-bottom: 15px;">That I shall be hereafter known and addressed only by my correct name: <b>${formData.correctName || '[Correct Name]'}</b>.</li>
          <li style="margin-bottom: 15px;">That I swear this affidavit for the purpose of correcting the aforementioned discrepancy in all official records.</li>
        </ol>
      `,
      'dob-correction': `
        <ol style="padding-left: 20px; list-style-type: decimal;">
          <li style="margin-bottom: 15px;">That my date of birth has been incorrectly entered as <u>${formData.incorrectDob || '[Wrong Date]'}</u> in my service/official records.</li>
          <li style="margin-bottom: 15px;">That my true and actual date of birth is <b>${formData.correctDob || '[Correct Date]'}</b> as evidenced by my Birth Certificate / SSC Marks Memo.</li>
          <li style="margin-bottom: 15px;">That I request the concerned authorities to update their records with my correct date of birth as mentioned above.</li>
        </ol>
      `,
      'income': `
        <ol style="padding-left: 20px; list-style-type: decimal;">
          <li style="margin-bottom: 15px;">That I am currently employed/engaged as <b>${formData.occupation || '[Occupation]'}</b>.</li>
          <li style="margin-bottom: 15px;">That my total annual income from all sources including salary, property, and agricultural gain for the financial year is <b>₹${formData.annualIncome || '0'}/-</b>.</li>
          <li style="margin-bottom: 15px;">That no other member of my family is earning more than the stated amount.</li>
        </ol>
      `,
      'gap': `
        <ol style="padding-left: 20px; list-style-type: decimal;">
          <li style="margin-bottom: 15px;">That I passed my last examination in the year <b>${formData.gapYears?.split(' ')[0] || '[Year]'}</b> from [Institution Name].</li>
          <li style="margin-bottom: 15px;">That there is a gap of <b>${formData.gapYears || '[Duration]'}</b> in my regular studies.</li>
          <li style="margin-bottom: 15px;">That during this period, I was <b>${formData.reasonForGap || '[Reason for Gap]'}</b> and was not involved in any illegal activities or enrolled elsewhere.</li>
        </ol>
      `,
      'anti-ragging': `
        <ol style="padding-left: 20px; list-style-type: decimal;">
          <li style="margin-bottom: 15px;">That I have been admitted to <b>${formData.collegeName || '[College Name]'}</b> for the course <b>${formData.courseName || '[Course Name]'}</b>.</li>
          <li style="margin-bottom: 15px;">That I have read and understood the UGC Regulations on Curbing the Menace of Ragging in Higher Educational Institutions.</li>
          <li style="margin-bottom: 15px;">That I solemnly undertake that I will not indulge in any behavior or act that may be constituted as ragging.</li>
        </ol>
      `,
      'address-proof': `
        <ol style="padding-left: 20px; list-style-type: decimal;">
          <li style="margin-bottom: 15px;">That I am residing at the address mentioned above for the last <b>${formData.durationOfStay || '____'}</b> months/years.</li>
          <li style="margin-bottom: 15px;">That the said premises is my permanent/temporary place of residence.</li>
        </ol>
      `,
      'joint-hindu-family': `
        <ol style="padding-left: 20px; list-style-type: decimal;">
          <li style="margin-bottom: 15px;">That I am the Karta of the Joint Hindu Family (HUF) known as <b>${formData.kartaName || '[Karta Name]'} HUF</b>.</li>
          <li style="margin-bottom: 15px;">That the following are the members of the said HUF: <b>${formData.familyMembers || '[Member Names]'}</b>.</li>
        </ol>
      `
    };

    const newBody = templates[formData.docType] || '<p>I hereby affirm that the details provided are true...</p>';
    setEditableBody(newBody);
  }, [formData.docType, formData.incorrectName, formData.correctName, formData.incorrectDob, formData.correctDob, formData.annualIncome, formData.occupation, formData.gapYears, formData.reasonForGap, formData.collegeName, formData.courseName, formData.kartaName, formData.familyMembers]);

  const handleGeneratePDF = async () => {
    if (isGenerating) return;
    
    if (walletBalance < 20) {
      alert('Insufficient wallet balance (₹20 required).');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await deductForAffidavitAction(shop_slug, `AFF-${Date.now()}`);
      
      if (!result.success) {
        alert(result.error || 'Failed to deduct wallet.');
        setIsGenerating(false);
        return;
      }
      if (result.newBalance !== undefined) setWalletBalance(result.newBalance);

      const html2pdf = (await import('html2pdf.js')).default;
      const element = pdfRef.current;
      
      if (!element) throw new Error('PDF element not found');

      // High quality export settings: Scale 3x + WindowWidth 794 ensures 1:1 A4 capture
      const opt = {
        margin: 0,
        filename: `Affidavit_${formData.fullName.replace(/\s+/g, '_') || 'Draft'}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 3, 
          useCORS: true,
          letterRendering: true,
          windowWidth: 794 // Forced width for A4 consistency
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
      };

      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error('PDF Error:', error);
      alert('An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Left Sidebar (Internal Navigation) ────────────────────────── */}
      <aside className={`flex-shrink-0 bg-white border-r border-slate-200/60 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          {!isSidebarCollapsed && <h2 className="text-lg font-black text-slate-900">Affidavit Builder</h2>}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <span className="material-symbols-outlined">{isSidebarCollapsed ? 'side_navigation' : 'keyboard_double_arrow_left'}</span>
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-full rounded-xl flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                currentStep === idx ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
              title={isSidebarCollapsed ? step.label : ''}
            >
              <span className="material-symbols-outlined text-xl">{step.icon}</span>
              {!isSidebarCollapsed && <span>{step.label}</span>}
            </button>
          ))}
        </nav>
        
        {!isSidebarCollapsed && (
          <div className="p-4 bg-slate-50 m-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Pricing</span>
              <span className="text-xs font-black text-slate-900">₹20</span>
            </div>
            <p className="text-[10px] text-slate-500 italic leading-snug">Legal quality draft with AI proofreading enabled.</p>
          </div>
        )}
      </aside>

      {/* ── Main Workspace ────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden bg-slate-50">
        {/* Form Area */}
        <section className={`col-span-12 lg:col-span-5 h-full overflow-y-auto p-8 custom-scrollbar border-r border-slate-200/50 bg-slate-50 transition-all`}>
          <div className="max-w-xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between mb-2">
               <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Smart Form</h1>
               {isAnalyzing && <span className="flex items-center gap-2 text-xs font-bold text-blue-600 animate-pulse"><span className="w-3 h-3 rounded-full bg-blue-600"></span> AI Analyzing...</span>}
            </div>

            {/* Step 0: Proof Uploads */}
            {currentStep === 0 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="glass-card p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                  <label className="block text-[11px] uppercase tracking-widest font-black text-blue-600 border-b border-blue-100 pb-2">Multimodal AI References</label>
                  
                  {/* Passport Photo */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">Deponent Photograph</label>
                    <div className="relative group hover:scale-[1.01] transition-transform">
                      <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                      <div className="w-full h-32 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 group-hover:border-blue-400 group-hover:bg-blue-50/30 transition-all">
                        {passportPhoto ? (
                          <img src={passportPhoto} alt="Preview" className="h-full w-full object-contain rounded-xl" />
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-slate-400 text-3xl">add_a_photo</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Portrait</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reference Document */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">Reference Proof (Aadhar/SSC/PAN)</label>
                    <div className="relative group hover:scale-[1.01] transition-transform">
                      <input type="file" accept="image/*,application/pdf" onChange={(e) => e.target.files?.[0] && handleFileAnalysis(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                      <div className={`w-full h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all ${referenceDoc ? 'bg-green-50 border-green-300' : 'bg-slate-100 border-slate-300 group-hover:border-blue-400'}`}>
                        <span className="material-symbols-outlined text-2xl text-slate-400">{referenceDoc ? 'verified_user' : 'upload_file'}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{referenceDoc ? referenceDoc.name : 'AI Analysis (Multimodal)'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <label className="block text-[11px] uppercase tracking-widest font-black text-blue-600 border-b border-blue-100 pb-2">Verified Identity</label>
                  <div className="space-y-4">
                    <input value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none" placeholder="Deponent Full Name" />
                    <input value={formData.fatherName} onChange={(e) => setFormData({...formData, fatherName: e.target.value})} className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none" placeholder="Father's / Husband's Name" />
                    <div className="grid grid-cols-3 gap-3">
                      <input value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className="col-span-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none" placeholder="Age" />
                      <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="col-span-2 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none">
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                    <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none" rows={3} placeholder="Full Address" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Affidavit Type */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="glass-card p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <label className="block text-[11px] uppercase tracking-widest font-black text-blue-600 border-b border-blue-100 pb-2">Select Purpose</label>
                  <select 
                    value={formData.docType} 
                    onChange={(e) => setFormData({...formData, docType: e.target.value})}
                    className="w-full bg-slate-100 border-none rounded-xl px-4 py-3.5 text-sm font-bold shadow-inner outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                  >
                    {AFFIDAVIT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>

                {/* Dynamic Fields */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                   {formData.docType === 'custom' ? (
                     <div className="space-y-4">
                        <textarea
                          value={formData.customRequirement}
                          onChange={(e) => setFormData({...formData, customRequirement: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm min-h-[120px] outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                          placeholder="Type your specific affidavit requirement here (e.g. Affidavit for losing a specialized lab equipment)..."
                        />
                        <button onClick={handleAIGenerate} disabled={isGenerating} className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                          <span className="material-symbols-outlined text-sm">auto_awesome</span>
                          Draft Legal Body with AI
                        </button>
                     </div>
                   ) : (
                     <div className="grid grid-cols-1 gap-4">
                        {formData.docType === 'name-correction' && (
                          <>
                            <input value={formData.incorrectName} onChange={(e) => setFormData({...formData, incorrectName: e.target.value})} placeholder="Incorrect Name as per record" className="w-full bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 text-sm" />
                            <input value={formData.correctName} onChange={(e) => setFormData({...formData, correctName: e.target.value})} placeholder="Correct/New Name" className="w-full bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 text-sm" />
                          </>
                        )}
                        {formData.docType === 'dob-correction' && (
                          <>
                            <input value={formData.incorrectDob} onChange={(e) => setFormData({...formData, incorrectDob: e.target.value})} placeholder="Incorrect DOB (e.g. 15-05-1985)" className="w-full bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 text-sm" />
                            <input value={formData.correctDob} onChange={(e) => setFormData({...formData, correctDob: e.target.value})} placeholder="Correct/Actual DOB" className="w-full bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 text-sm" />
                          </>
                        )}
                        {formData.docType === 'income' && (
                           <>
                             <input value={formData.annualIncome} onChange={(e) => setFormData({...formData, annualIncome: e.target.value})} placeholder="Total Annual Income (e.g. 1,20,000)" className="w-full bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 text-sm" />
                             <input value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} placeholder="Occupation/Business" className="w-full bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 text-sm" />
                           </>
                        )}
                        {formData.docType === 'gap' && (
                           <>
                             <input value={formData.gapYears} onChange={(e) => setFormData({...formData, gapYears: e.target.value})} placeholder="Gap Duration (e.g. 2021 to 2023)" className="w-full bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 text-sm" />
                             <textarea value={formData.reasonForGap} onChange={(e) => setFormData({...formData, reasonForGap: e.target.value})} placeholder="Reason for gap (e.g. Preparing for UPSC)" className="w-full bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 text-sm" />
                           </>
                        )}
                        <p className="text-[10px] text-slate-400 italic">Fields marked above will be dynamically inserted into the legal template.</p>
                     </div>
                   )}
                </div>
              </div>
            )}

            {/* Step 3: Review & Finalize (Rich Text Toolbar) */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
                <div className="glass-card p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                   <label className="block text-[11px] uppercase tracking-widest font-black text-blue-600 border-b border-blue-100 pb-2">Extra Details (Appended at End)</label>
                   <textarea
                     value={formData.extraDetails}
                     onChange={(e) => setFormData({...formData, extraDetails: e.target.value})}
                     className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                     rows={4}
                     placeholder="Any additional declarations to append before signature..."
                   />
                </div>
                
                <div className="glass-card p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                   <label className="block text-[11px] uppercase tracking-widest font-black text-blue-600 border-b border-blue-100 pb-2">Print Configuration</label>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-600">Stamp Paper Top Margin:</span>
                         <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">{topMarginInch} Inch</span>
                      </div>
                      <input 
                        type="range" min="0" max="6" step="0.1" 
                        value={topMarginInch} 
                        onChange={(e) => setTopMarginInch(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <p className="text-[10px] text-slate-400 italic leading-snug tracking-tight">Standard stamp papers (₹10, ₹50, ₹100) usually require **3.5 to 4.5 inches** of top margin.</p>
                   </div>
                </div>

                <button
                  onClick={handleGeneratePDF}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-br from-blue-600 to-blue-800 text-white font-black py-4.5 px-6 rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.98] transition-all transform-gpu"
                >
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
                  {isGenerating ? 'GENERATE & DEDUCT ₹20...' : 'GENERATE PROFESSIONAL AFFIDAVIT'}
                </button>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 pt-10">
               <button onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))} className={`px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-white transition-all ${currentStep === 0 ? 'invisible' : ''}`}>Back</button>
               <button onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))} className={`px-8 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-lg hover:bg-slate-800 transition-all ${currentStep === steps.length - 1 ? 'invisible' : ''}`}>Continue</button>
            </div>
          </div>
        </section>

        {/* ── Live Preview Area ────────────────────────────────────── */}
        <section ref={containerRef} className="col-span-12 lg:col-span-7 h-full bg-slate-200 overflow-y-auto custom-scrollbar flex flex-col items-center">
          {/* Interactive Toolbar */}
          <div className="w-full max-w-[210mm] sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm px-6 py-2.5 flex items-center justify-between mb-8 overflow-x-auto no-print">
             <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                   <button onClick={() => execCommand('bold')} className={`p-1.5 rounded ${activeFormats.bold ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><span className="material-symbols-outlined text-lg">format_bold</span></button>
                   <button onClick={() => execCommand('italic')} className={`p-1.5 rounded ${activeFormats.italic ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><span className="material-symbols-outlined text-lg">format_italic</span></button>
                   <button onClick={() => execCommand('underline')} className={`p-1.5 rounded ${activeFormats.underline ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><span className="material-symbols-outlined text-lg">format_underlined</span></button>
                   <div className="w-px h-5 bg-slate-200 mx-1"></div>
                   <button onClick={() => execCommand('justifyLeft')} className={`p-1.5 rounded ${activeFormats.alignLeft ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><span className="material-symbols-outlined text-lg">format_align_left</span></button>
                   <button onClick={() => execCommand('justifyCenter')} className={`p-1.5 rounded ${activeFormats.alignCenter ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><span className="material-symbols-outlined text-lg">format_align_center</span></button>
                   <button onClick={() => execCommand('justifyRight')} className={`p-1.5 rounded ${activeFormats.alignRight ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><span className="material-symbols-outlined text-lg">format_align_right</span></button>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200">
                   <span className="material-symbols-outlined text-slate-400 text-[16px]">height</span>
                   <select value={lineHeight} onChange={(e) => setLineHeight(parseFloat(e.target.value))} className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600">
                      <option value={1.2}>Single</option><option value={1.5}>1.5 Line</option><option value={2.0}>Double</option>
                   </select>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={handleGeneratePDF} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black tracking-widest hover:bg-blue-700 active:scale-95 transition-all uppercase"><span className="material-symbols-outlined text-sm">print</span> Quick Print</button>
             </div>
          </div>

          <div 
             className="transition-transform duration-300 ease-out origin-top mb-10"
             style={{ transform: `scale(${scale})` }}
          >
            <div 
              ref={pdfRef} 
              className="w-[210mm] min-h-[297mm] bg-white shadow-2xl relative transition-all duration-500 overflow-hidden flex flex-col"
              style={{ padding: `60px 70px 60px 70px`, paddingTop: `${topMarginInch * 96}px` }}
            >
              {/* Multimodal AI Passport Photo */}
              {passportPhoto && (
                <div className="absolute top-12 right-14 w-[3.5cm] h-[4.5cm] border border-slate-200 p-1 bg-white shadow-sm flex items-center justify-center">
                   <img src={passportPhoto} alt="Photo" className="w-full h-full object-cover grayscale-[0.3]" />
                </div>
              )}

              {/* Stamp Paper Top Space (Indicator only) */}
              {topMarginInch > 1.0 && (
                <div data-html2canvas-ignore="true" className="absolute top-0 left-0 w-full bg-orange-50/10 border-b border-dashed border-orange-200 flex items-center justify-center pointer-events-none select-none" style={{ height: `${topMarginInch * 96}px` }}>
                   <span className="text-[10px] text-orange-400/50 font-black uppercase tracking-[0.5em]">Reserved for Stamp Paper Header</span>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-10 space-y-1">
                 <h2 className="text-[32px] font-serif font-bold text-slate-900 border-b-4 border-double border-slate-900 pb-1 mb-2">AFFIDAVIT</h2>
                 <p className="text-xs font-serif font-bold italic text-slate-600 leading-tight uppercase tracking-wider">
                   (Before the Executive Magistrate / Notary Public, {formData.place})
                 </p>
                 <div className="pt-2">
                    <span className="text-[10px] font-black bg-slate-900 text-white px-4 py-0.5 rounded uppercase tracking-[0.2em]">Government of India • State of {formData.stateName}</span>
                 </div>
              </div>

              {/* Interactive Deponent Block */}
              <div className="mb-10 text-[13px] leading-[1.8] font-serif text-slate-900 text-justify">
                 <p>
                    I, <b>{formData.fullName || '[Full Name]'}</b>, 
                    aged about <b>{formData.age || '___'}</b> years, 
                    son/daughter/wife of <b>{formData.fatherName || '[Father/Husband Name]'}</b>, 
                    resident of <b><u>{formData.address || '[Permanent Address]'}</u></b>, 
                    do hereby solemnly affirm and state on oath under the laws of <b>State of {formData.stateName}</b> as follows:
                 </p>
              </div>

              {/* AI Powered Legal Body */}
              <div 
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: editableBody || `
                  <ol style="padding-left: 20px; list-style-type: decimal;">
                    <li style="margin-bottom: 20px;">That I am the deponent of this affidavit and am well acquainted with the facts stated herein.</li>
                    <li style="margin-bottom: 20px;">That I have selected the purpose: <b>${AFFIDAVIT_TYPES.find(t => t.id === formData.docType)?.label}</b> and declare the contents following.</li>
                    <li style="margin-bottom: 20px;">[Body will be dynamically generated based on form inputs]</li>
                  </ol>
                ` }}
                onInput={(e) => setEditableBody(e.currentTarget.innerHTML)}
                className="flex-1 outline-none text-[13px] leading-[1.8] font-serif text-slate-900 text-justify mb-10"
                style={{ lineHeight: lineHeight }}
              />

              {/* Additional Information Block (Appended) */}
              {formData.extraDetails && (
                 <div className="mb-10 text-[13px] leading-[1.5] font-serif text-slate-700 italic border-l-2 border-slate-200 pl-4 py-2 bg-slate-50/50">
                    <p className="font-bold underline uppercase text-[10px] tracking-wider mb-2">Additional Declarations:</p>
                    <p className="whitespace-pre-wrap">{formData.extraDetails}</p>
                 </div>
              )}

              {/* Verification Block */}
              <div className="mt-auto pt-10 border-t border-slate-200">
                 <div className="flex justify-between items-end">
                    <div className="space-y-2">
                       <p className="text-xs font-serif font-bold">Date: {formData.date}</p>
                       <p className="text-xs font-serif font-bold">Place: {formData.place}</p>
                    </div>
                    <div className="text-center pt-8 border-t-2 border-slate-900/60 min-w-[200px]">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">DEPONENT SIGNATURE</p>
                       <span className="text-[9px] text-slate-400 italic">(Verified by Witness/Notary)</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
