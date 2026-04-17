'use client';

import { useState, useRef, useEffect } from 'react';
import { deductForResumeAction, generateResumeSummaryAction } from '../actions';

interface ResumeFormProps {
  shop_slug: string;
  initialBalance: number;
}

const navSections = [
  { icon: 'person', label: 'Personal Info' },
  { icon: 'work', label: 'Experience' },
  { icon: 'school', label: 'Education' },
  { icon: 'psychology', label: 'Skills' },
  { icon: 'folder_special', label: 'Projects' },
];

const skillTags = ['Cloud Arch', 'Python', 'Data Sec', 'Governance', 'Node.js', 'PostgreSQL', 'REST APIs', 'React'];

export default function ResumeForm({ shop_slug, initialBalance }: ResumeFormProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [walletBalance, setWalletBalance] = useState(initialBalance);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Resume State
  const [resumeData, setResumeData] = useState({
    firstName: 'Rajesh',
    lastName: 'Kumar',
    jobTitle: 'Senior Systems Analyst',
    email: 'rajesh.kumar@service.gov.in',
    phone: '98765 43210',
    location: 'New Delhi, India',
    linkedin: 'linkedin.com/in/rkumar-gov',
    profile: 'Dedicated Systems Analyst with over 8 years of experience in managing large-scale governmental digital infrastructure. Proven track record in optimizing administrative workflows.',
    education: [
      { institution: 'Indian Institute of Technology, Delhi', degree: 'B.Tech Computer Science', year: '2022' }
    ],
    experience: [
      { company: 'Department of Electronics & IT', role: 'Lead Digital Infrastructure Specialist', duration: '2018 - Present', details: ['Orchestrated the migration of legacy databases.', 'Developed automated verification systems.'] }
    ],
    skills: [...skillTags],
    extraDetails: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setResumeData(prev => ({ ...prev, [id.replace(/-([a-z])/g, (g) => g[1].toUpperCase())]: value }));
  };

  const handleGenerateAISummary = async () => {
    if (!resumeData.jobTitle) {
      alert('Please enter a Job Title first so the AI can tailor the summary.');
      return;
    }
    setIsGeneratingSummary(true);
    try {
      const res = await generateResumeSummaryAction(resumeData.jobTitle, resumeData.experience.map(e => `${e.role} at ${e.company}`).join(', '));
      if (res.success && res.summary) {
        setResumeData(prev => ({ ...prev, profile: res.summary }));
      } else {
        alert(res.error || 'AI Failed to generate summary.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (isGenerating) return;

    if (walletBalance < 10) {
      alert('Insufficient wallet balance (₹10 required).');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await deductForResumeAction(shop_slug, `RES-${Date.now()}`);
      if (!result.success) {
        alert(result.error || 'Deduction failed');
        setIsGenerating(false);
        return;
      }
      setWalletBalance(result.newBalance ?? walletBalance);

      const html2pdf = (await import('html2pdf.js')).default;
      const element = resumeRef.current;
      
      if (!element) throw new Error('Preview element not found');

      const opt = {
        margin: 0,
        filename: `Resume_${resumeData.firstName}_${resumeData.lastName}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 3, 
          useCORS: true,
          letterRendering: true,
          windowWidth: 794 // Ensures 1:1 A4 capture regardless of viewport
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
      };

      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Failed to generate resume PDF.');
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

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Left Sidebar (Internal Navigation) ────────────────────────── */}
      <aside className={`flex-shrink-0 bg-white border-r border-slate-200/60 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div>
              <h2 className="text-lg font-black text-slate-900">CV Builder</h2>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">₹{walletBalance} Rem.</p>
            </div>
          )}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <span className="material-symbols-outlined">{isSidebarCollapsed ? 'side_navigation' : 'keyboard_double_arrow_left'}</span>
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navSections.map((section, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSection(idx)}
              className={`w-full rounded-xl flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-all ${
                activeSection === idx ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
              title={isSidebarCollapsed ? section.label : ''}
            >
              <span className="material-symbols-outlined text-xl">{section.icon}</span>
              {!isSidebarCollapsed && <span className="text-[10px] uppercase font-black tracking-widest">{section.label}</span>}
            </button>
          ))}
        </nav>
        
        {!isSidebarCollapsed && (
          <div className="p-4 bg-slate-900 m-4 rounded-2xl space-y-3">
             <button 
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black tracking-widest flex items-center justify-center gap-2 hover:bg-blue-500 transition-all disabled:opacity-50"
             >
                <span className="material-symbols-outlined text-sm">{isGenerating ? 'progress_activity' : 'download'}</span>
                {isGenerating ? 'GENERATING...' : 'EXPORT PDF'}
             </button>
          </div>
        )}
      </aside>

      {/* ── Main Workspace ────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden bg-slate-50">
        {/* Form Area */}
        <section className="col-span-12 lg:col-span-5 h-full overflow-y-auto p-8 custom-scrollbar border-r border-slate-200/50 bg-slate-50">
          <div className="max-w-xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between mb-2">
               <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{navSections[activeSection].label}</h1>
               <div className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-widest">Sarkari Standard</div>
            </div>

            {/* Section 0: Personal Info */}
            {activeSection === 0 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">First Name</label>
                    <input id="first-name" value={resumeData.firstName} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Last Name</label>
                    <input id="last-name" value={resumeData.lastName} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Target Job Title</label>
                  <input id="job-title" value={resumeData.jobTitle} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-blue-700" placeholder="e.g. Senior Software Engineer" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Professional Summary</label>
                    <button 
                      onClick={handleGenerateAISummary} 
                      disabled={isGeneratingSummary}
                      className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-1 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                      {isGeneratingSummary ? 'Thinking...' : 'Write with AI'}
                    </button>
                  </div>
                  <textarea
                    id="profile"
                    value={resumeData.profile}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none resize-none focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[140px]"
                    placeholder="Brief professional profile..."
                  />
                </div>

                <div className="pt-4 grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Email</label>
                    <input id="email" value={resumeData.email} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs shadow-sm shadow-slate-200/50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Phone</label>
                    <input id="phone" value={resumeData.phone} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs shadow-sm shadow-slate-200/50" />
                  </div>
                </div>
              </div>
            )}

            {/* Section 1: Experience */}
            {activeSection === 1 && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {resumeData.experience.map((exp, i) => (
                    <div key={i} className="glass-card p-6 rounded-2xl border border-slate-200 space-y-4">
                        <input value={exp.company} className="w-full bg-slate-50 border-none px-4 py-2 rounded-lg text-sm font-bold" placeholder="Company Name" />
                        <input value={exp.role} className="w-full bg-slate-50 border-none px-4 py-2 rounded-lg text-sm" placeholder="Your Role" />
                        <textarea value={exp.details.join('\n')} rows={3} className="w-full bg-slate-50 border-none px-4 py-2 rounded-lg text-xs" placeholder="Responsibilities (one per line)" />
                    </div>
                  ))}
                  <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 transition-all">+ Add Experience</button>
               </div>
            )}

            {/* Section 4: Additional Info */}
            <div className="pt-10 border-t border-slate-200 space-y-4">
               <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Extra Details (Footer Section)</label>
               <textarea
                  id="extra-details"
                  value={resumeData.extraDetails}
                  onChange={(e) => setResumeData({...resumeData, extraDetails: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none"
                  rows={4}
                  placeholder="Languages, Interests, or specialized certifications..."
               />
            </div>

            <div className="flex justify-between items-center gap-4 pt-10">
               <button onClick={() => setActiveSection(prev => Math.max(0, prev - 1))} className={`px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-white transition-all ${activeSection === 0 ? 'invisible' : ''}`}>PREVIOUS</button>
               <button onClick={() => setActiveSection(prev => Math.min(navSections.length - 1, prev + 1))} className={`px-8 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-lg hover:bg-slate-800 transition-all ${activeSection === navSections.length - 1 ? 'invisible' : ''}`}>NEXT STEP</button>
            </div>
          </div>
        </section>

        {/* ── Live Preview Area ────────────────────────────────────── */}
        <section ref={containerRef} className="col-span-12 lg:col-span-7 h-full bg-slate-200 overflow-y-auto custom-scrollbar flex flex-col items-center py-12">
          <div 
             className="transition-transform duration-300 ease-out origin-top mb-10"
             style={{ transform: `scale(${scale})` }}
          >
            <div 
              ref={resumeRef} 
              className="w-[210mm] min-h-[297mm] bg-white shadow-2xl relative transition-all duration-500 overflow-hidden flex flex-col p-[20mm]"
              style={{ color: '#000', fontFamily: "'Inter', sans-serif" }}
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b-[6px] border-blue-700 pb-10 mb-10">
                <div className="flex-1 pr-10">
                  <h2 className="text-[42px] font-black text-slate-900 uppercase tracking-tighter leading-[0.9] drop-shadow-sm">
                    {resumeData.firstName} <span className="text-blue-700">{resumeData.lastName}</span>
                  </h2>
                  <p className="text-blue-700 font-black tracking-[0.3em] text-[11px] uppercase mt-4 opacity-90">{resumeData.jobTitle}</p>
                </div>
                <div className="text-right space-y-1.5 pt-2 flex flex-col items-end">
                  <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-slate-800">
                    <span>{resumeData.email}</span>
                    <span className="material-symbols-outlined text-blue-600 text-[14px]">mail</span>
                  </div>
                  <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-slate-800">
                    <span>{resumeData.phone}</span>
                    <span className="material-symbols-outlined text-blue-600 text-[14px]">call</span>
                  </div>
                  <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-slate-800">
                    <span>{resumeData.location}</span>
                    <span className="material-symbols-outlined text-blue-600 text-[14px]">location_on</span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 flex flex-col space-y-10">
                <div className="relative">
                  <div className="absolute -left-6 top-0 bottom-0 w-1 bg-blue-100 rounded-full opacity-50"></div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-700 rounded-full"></span>
                    Professional Summary
                  </h3>
                  <p className="text-[12px] text-slate-700 leading-[1.6] font-medium text-justify">{resumeData.profile}</p>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 border-b-2 border-slate-100 pb-2 mb-6">Work Experience</h3>
                  {resumeData.experience.map((exp, i) => (
                    <div key={i} className="mb-8">
                       <div className="flex justify-between items-baseline mb-1">
                          <span className="text-[14px] font-black text-slate-900">{exp.company}</span>
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">{exp.duration}</span>
                       </div>
                       <p className="text-[11px] text-slate-500 font-black mb-3 italic uppercase tracking-wider">{exp.role}</p>
                       <ul className="text-[11px] text-slate-600 space-y-2">
                          {exp.details.map((d, j) => (
                            <li key={j} className="flex gap-3">
                               <span className="text-blue-400 mt-1.5 h-1 w-1 rounded-full bg-blue-500 shrink-0"></span>
                               <span>{d}</span>
                            </li>
                          ))}
                       </ul>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-12">
                   <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 border-b-2 border-slate-100 pb-2 mb-6">Education</h3>
                      {resumeData.education.map((edu, i) => (
                        <div key={i} className="mb-4">
                           <p className="text-[12px] font-black text-slate-900 mb-0.5">{edu.degree}</p>
                           <p className="text-blue-700 text-[10px] font-bold">{edu.institution}</p>
                           <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Class of {edu.year}</p>
                        </div>
                      ))}
                   </div>
                   <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 border-b-2 border-slate-100 pb-2 mb-6">Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.skills.map((skill, i) => (
                          <span key={i} className="text-[10px] font-black bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 uppercase tracking-tighter">
                            {skill}
                          </span>
                        ))}
                      </div>
                   </div>
                </div>

                {/* Additional Info / Extra Details Bottom Appended */}
                {resumeData.extraDetails && (
                  <div className="pt-8 border-t border-slate-100 mt-auto">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 mb-4">Additional Information</h3>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{resumeData.extraDetails}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-10 border-t border-slate-100 flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mt-10">
                 <span>Drafted by {shop_slug} Digital</span>
                 <div className="flex gap-4">
                    <span>Authentic Standard</span>
                    <span className="text-blue-600">ID: CV-{Date.now().toString().slice(-6)}</span>
                 </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
