import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { env } from '@/config/env';
import { useTheme } from '@/context/ThemeContext';

export const Landing: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FAQ Accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "What types of legal documents can TNC Guardian analyze?",
      answer: "TNC Guardian can analyze a wide variety of legal documents, including SaaS Terms of Service, Privacy Policies, End User License Agreements (EULAs), Non-Disclosure Agreements (NDAs), and standard service agreements. You can upload PDFs, input website URLs, or directly paste plain text."
    },
    {
      question: "How does the AI Risk Scoring system work?",
      answer: "Our fine-tuned legal LLM parses your document clause-by-clause, checking for key parameters such as data collection policies, liability limitations, class-action waivers, and auto-renewals. Based on the presence and severity of these clauses, it assigns an overall risk score from 0 (Safe) to 100 (Critical Risk)."
    },
    {
      question: "Is my uploaded document private and secure?",
      answer: "Absolutely. Security is our top priority. All documents are analyzed in an isolated sandbox, and personally identifiable information (PII) is automatically scrubbed. We do not use your documents to train public AI models, and you can delete your audit history permanently at any time."
    },
    {
      question: "Can TNC Guardian replace professional legal counsel?",
      answer: "No. TNC Guardian is a compliance helper and risk indicator designed to simplify legal language into plain terms. It does not constitute formal legal advice. For binding commercial negotiations or complex regulatory audits, we recommend consulting a qualified legal professional."
    },
    {
      question: "How long does a typical compliance scan take?",
      answer: "Thanks to our optimized caching pipelines and parallel parsing architecture, most documents are analyzed in under 3 seconds. Ingestion from URL and manual copy-pastes take a similar amount of time."
    }
  ];

  const features = [
    {
      title: "Analyze PDF",
      description: "Securely upload agreements in PDF or DOCX formats. We extract structured plaintext and parse complex nested layers in seconds.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: "Analyze Website URL",
      description: "Provide any website link to terms, privacy updates, or disclosures. Our crawler extracts legal bindings directly from the URL.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      )
    },
    {
      title: "Analyze Text",
      description: "Directly paste agreement snippets, single paragraphs, or custom clauses. Ideal for quick checkups before signing off.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      title: "AI Risk Detection",
      description: "Get an instant, actionable breakdown of provisions flagged by our model. Categorized cleanly from low to critical severity.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    {
      title: "Plain Language Summary",
      description: "Tear down complex legal jargon. Our AI translates dense paragraphs into clear, human-readable bulleted bullet points.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M3 10h18M3 15h12M3 20h18" />
        </svg>
      )
    },
    {
      title: "Privacy First",
      description: "Strict isolation of uploaded contracts. Personally identifiable information is dynamically anonymized to guarantee anonymity.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: "Fast Results",
      description: "A highly parallel compliance engine. Audit terms, check liabilities, and receive complete scoring reports in under 3 seconds.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Upload",
      description: "Drag & drop your PDF contract, insert a public URL, or paste the text clauses into the analyzer."
    },
    {
      num: "02",
      title: "AI Analysis",
      description: "Our fine-tuned LLM parses terms line-by-line, evaluating liability, data tracking, and clauses."
    },
    {
      num: "03",
      title: "Understand Risks",
      description: "Instantly view an interactive rating dashboard, flagging critical items and suggesting actions."
    }
  ];

  const benefits = [
    {
      title: "Readable Legal Language",
      description: "No more parsing complex legalese. Get a clear translation of what each paragraph means for you.",
      icon: "📄"
    },
    {
      title: "Risk Score Scale",
      description: "Compare agreements using a simplified score from 0-100 to quickly judge overall favorability.",
      icon: "📊"
    },
    {
      title: "Dangerous Clauses Highlighted",
      description: "Instantly detect waivers, unlimited indemnifications, automatic subscriptions, and sneaky fees.",
      icon: "⚠️"
    },
    {
      title: "Privacy Focused Ingestion",
      description: "Contracts are scrubbed of personal PII immediately. Your corporate and user documents remain private.",
      icon: "🔒"
    },
    {
      title: "Time Saving Scans",
      description: "Understand complex contracts in seconds instead of spending hours reading fine print.",
      icon: "⚡"
    }
  ];

  const testimonials = [
    {
      quote: "TNC Guardian has completely changed how our sales team evaluates standard customer NDAs. We save hours of manual review and can spot critical class-action waivers instantly.",
      author: "Sarah Jenkins",
      role: "Operations Director, InnoScale",
      avatarBg: "from-blue-600 to-indigo-600"
    },
    {
      quote: "As a software developer, I sign a lot of SaaS terms. This AI gives me an instant plain English summary, highlighting exactly how my private data is collected. Truly a must-have utility.",
      author: "Marcus Chen",
      role: "Lead Architect, DevThread",
      avatarBg: "from-emerald-500 to-teal-600"
    },
    {
      quote: "The URL analysis feature is incredible. I pasted a new vendor agreement link and got a full risk scorecard highlighting auto-renewal clauses in under three seconds. Highly recommended!",
      author: "Elena Rostova",
      role: "Compliance Lead, Apex Global",
      avatarBg: "from-purple-600 to-pink-600"
    }
  ];

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-105 selection:bg-brand-500 selection:text-white font-sans overflow-x-hidden antialiased">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute top-[20%] right-10 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute top-[50%] left-10 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* Sticky Glassmorphic Header */}
      <header className="sticky top-0 z-50 w-full bg-[#070A13]/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-brand-500/10 group-hover:scale-105 transition-transform">
              🛡️
            </span>
            <span className="text-xl font-bold font-display text-white tracking-tight flex items-center gap-1.5">
              {env.VITE_APP_NAME}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors duration-200">How It Works</a>
            <a href="#why-us" className="hover:text-white transition-colors duration-200">Why Choose Us</a>
            <a href="#faq" className="hover:text-white transition-colors duration-200">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition select-none"
              title="Toggle Light/Dark Mode"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <span className="text-sm block leading-none">🌙</span>
              ) : (
                <span className="text-sm block leading-none">☀️</span>
              )}
            </button>
            <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
              Log In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-sm shadow-lg shadow-brand-500/20 active:scale-95 transition-all duration-200"
            >
              Analyze Now
            </Link>
          </div>

          {/* Mobile hamburger icon */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-[#090D1A] border-b border-slate-900 px-6 py-8 flex flex-col gap-6 shadow-xl animate-fadeIn">
            <nav className="flex flex-col gap-4 text-base font-medium text-slate-400">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">How It Works</a>
              <a href="#why-us" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">Why Choose Us</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">FAQ</a>
            </nav>
            <hr className="border-slate-800" />
            <div className="flex flex-col gap-3">
              {/* Mobile theme toggle */}
              <button
                onClick={() => {
                  toggleTheme();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 select-none"
              >
                <span>Theme:</span>
                {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </button>
              <Link 
                to="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 text-center font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 text-center bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl shadow-lg"
              >
                Analyze Now
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 1. Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-36 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: Headings & CTA */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-bold text-brand-400 uppercase tracking-widest">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              <span>AI-Powered Contract Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight font-display">
              Understand Terms & <span className="bg-gradient-to-r from-brand-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">Conditions</span> Before Clicking <span className="bg-gradient-to-r from-brand-400 to-indigo-500 bg-clip-text text-transparent">"I Agree"</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Simplify binding agreements in seconds. Spot auto-renewals, critical waivers, cookie tracking, and hidden liabilities using fine-tuned legal AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/register"
                className="group relative px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Analyze Now</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <a
                href="#features"
                className="px-8 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white text-slate-350 font-bold rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Learn More</span>
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4 pt-4 text-xs font-semibold text-slate-500 border-t border-slate-900/60">
              <div className="flex items-center gap-2">
                <span className="text-brand-500 text-lg">✓</span> PDF, DOCX, TXT Support
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-500 text-lg">✓</span> Live Website Crawler
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-500 text-lg">✓</span> Zero PII Data Retention
              </div>
            </div>
          </div>

          {/* Right Column: Hero Illustration (Glassmorphic Mockup UI) */}
          <div className="lg:col-span-5 flex justify-center relative">
            
            {/* Ambient Background Glow inside frame */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-500/10 rounded-full blur-[80px] -z-10" />

            <div className="w-full max-w-[440px] bg-slate-950/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-6 hover:shadow-brand-500/5 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
              
              {/* Top reflection line */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              
              {/* Header inside mockup */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-900">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-sm">
                    📄
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-xs truncate max-w-[170px]">saas_terms_service.pdf</h4>
                    <span className="text-[10px] text-slate-500 font-semibold block">PDF Document • 4.2 MB</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold tracking-widest uppercase">
                  Analyzed
                </span>
              </div>

              {/* Ingestion risk gauge info */}
              <div className="flex items-center gap-5 bg-slate-900/40 border border-slate-900 p-4 rounded-2xl">
                <div className="relative flex items-center justify-center w-16 h-16 bg-slate-950 rounded-full shadow-inner border border-slate-900">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="26" stroke="#1e293b" strokeWidth="5" fill="transparent" />
                    <circle cx="32" cy="32" r="26" stroke="#EF4444" strokeWidth="5" fill="transparent" strokeDasharray="163.3" strokeDashoffset="35.9" strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-lg font-black text-white">78</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">High Risk Rating</span>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Contains mandatory class-action waivers and automatic renewal charges.
                  </p>
                </div>
              </div>

              {/* Flagged items summary list */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Flagged Clauses (3)</span>
                
                {/* Item 1 */}
                <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl flex items-center justify-between text-xs font-semibold hover:bg-slate-900/60 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-slate-350">Class Action Waiver</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[9px] font-bold border border-red-500/20">CRITICAL</span>
                </div>

                {/* Item 2 */}
                <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl flex items-center justify-between text-xs font-semibold hover:bg-slate-900/60 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span className="text-slate-350">Automatic Renewal Charges</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 text-[9px] font-bold border border-orange-500/20">HIGH</span>
                </div>
              </div>

              {/* Floating micro notification inside illustration */}
              <div className="absolute -bottom-4 -right-4 bg-brand-600 text-white rounded-2xl p-4 shadow-2xl border border-brand-500/40 flex items-center gap-3 animate-bounce max-w-[210px] hidden sm:flex" style={{ animationDuration: '3s' }}>
                <span className="text-xl">🤖</span>
                <div>
                  <h5 className="font-extrabold text-[11px] leading-tight">Guardian Audit</h5>
                  <p className="text-[9px] text-brand-100 font-semibold leading-relaxed mt-0.5">Analysis completed in 1.4s</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Smooth Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none animate-pulse">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scroll Down</span>
          <div className="w-5 h-8 rounded-full border border-slate-700 flex justify-center p-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* 2. Features Section */}
      <section id="features" className="py-24 bg-[#090D1A]/60 border-y border-slate-900 relative">
        
        {/* Glow behind features headers */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="inline-block text-xs font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full">
              Core Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
              Powered by Intelligent Compliance
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              TNC Guardian parses terms instantly using natural language processing. Check liabilities and security clauses in seconds.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, index) => (
              <div 
                key={index} 
                className="p-8 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-slate-800 hover:bg-slate-950/60 shadow-xl hover:shadow-brand-500/5 hover:-translate-y-1 transition-all duration-300 text-left space-y-5 group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-white text-lg group-hover:text-brand-400 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section id="how-it-works" className="py-24 bg-[#070A13] relative">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-20">
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="inline-block text-xs font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full">
              Process Flow
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">How It Works</h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Three simple steps to secure your rights. No legal background or training required.
            </p>
          </div>

          {/* Stepper container with horizontal timeline line */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            
            {/* Timeline connector lines (Desktop) */}
            <div className="hidden md:block absolute top-[44px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-brand-500/20 via-brand-500 to-brand-500/20 -z-10" />

            {steps.map((step, idx) => (
              <div key={idx} className="space-y-6 flex flex-col items-center group">
                <div className="w-[88px] h-[88px] rounded-full bg-slate-950 border-2 border-slate-800 group-hover:border-brand-500/70 flex items-center justify-center font-black text-slate-500 group-hover:text-brand-400 font-display text-2xl transition-all duration-300 shadow-xl relative">
                  
                  {/* Glowing halo */}
                  <div className="absolute inset-0 rounded-full bg-brand-500/0 group-hover:bg-brand-500/5 blur-md transition-all duration-300" />
                  
                  <span>{step.num}</span>
                </div>
                <div className="space-y-2 max-w-xs text-center">
                  <h3 className="font-bold text-white text-lg font-display">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Benefits Section ("Why TNC Guardian") */}
      <section id="why-us" className="py-24 bg-[#090D1A]/60 border-t border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left column: Text info */}
            <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
              <div className="inline-block text-xs font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full">
                Value Proposition
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display leading-tight">
                Why Choose <br />TNC Guardian?
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                We translate dense fine print into transparent metrics to protect you from legal surprises. Stop signing terms blindly.
              </p>

              {/* Before/After Visualization */}
              <div className="pt-4 border-t border-slate-900 space-y-4 hidden sm:block text-left">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Visual Translation</span>
                <div className="grid grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="p-4 rounded-xl bg-red-950/15 border border-red-500/10 space-y-2">
                    <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold uppercase rounded">Legalese</span>
                    <p className="text-[10px] text-slate-600 leading-normal line-through">
                      Licensor grants Licensee a worldwide, non-exclusive, non-sublicensable, perpetual royalty-free license to use data collected during...
                    </p>
                  </div>
                  {/* After */}
                  <div className="p-4 rounded-xl bg-emerald-950/15 border border-emerald-500/10 space-y-2">
                    <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase rounded">Simple</span>
                    <p className="text-[10px] text-emerald-400 font-semibold leading-normal">
                      ✓ They can use your data, but you keep ownership and pay no royalties.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Benefits cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {benefits.map((benefit, idx) => (
                <div 
                  key={idx} 
                  className={`p-6 rounded-2xl bg-slate-950/50 border border-slate-900 hover:border-slate-800 hover:bg-slate-950/80 transition-all duration-300 flex items-start gap-4 ${
                    idx === benefits.length - 1 ? 'sm:col-span-2 max-w-full' : ''
                  }`}
                >
                  <span className="text-3xl p-3 bg-slate-900 border border-slate-800 rounded-xl h-fit">
                    {benefit.icon}
                  </span>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-base font-display">
                      {benefit.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* 5. Testimonials Section */}
      <section className="py-24 bg-[#070A13] relative">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="inline-block text-xs font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full">
              Trust & Validation
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
              Trusted by Compliance Leaders
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Read what developers, managers, and everyday users are saying about our analysis tools.
            </p>
          </div>

          {/* Testimonial Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((test, index) => (
              <div 
                key={index} 
                className="p-8 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-slate-800 hover:bg-slate-950/60 shadow-xl transition-all duration-300 flex flex-col justify-between text-left space-y-6 group hover:-translate-y-1"
              >
                {/* Stars */}
                <div className="flex gap-1 text-amber-400 text-sm">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium italic">
                  "{test.quote}"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-900">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${test.avatarBg} flex items-center justify-center font-bold text-white text-sm`}>
                    {test.author.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs sm:text-sm">
                      {test.author}
                    </h5>
                    <span className="text-[10px] sm:text-xs text-slate-500 font-semibold">
                      {test.role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section id="faq" className="py-24 bg-[#090D1A]/60 border-t border-slate-900 relative">
        <div className="max-w-4xl mx-auto px-6 space-y-16">
          <div className="space-y-4 text-center max-w-2xl mx-auto">
            <div className="inline-block text-xs font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full">
              Help Center
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Find quick answers to common questions about document limitations, security protocols, and compliance metrics.
            </p>
          </div>

          {/* Accordion UI */}
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index}
                  className="bg-slate-950/60 border border-slate-900 hover:border-slate-800 rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  >
                    <span className="font-bold text-white text-sm sm:text-base pr-4">
                      {faq.question}
                    </span>
                    <span className={`w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-white border-brand-500/40 bg-brand-500/10' : ''
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </span>
                  </button>
                  
                  {/* Dynamic Height Transition Container */}
                  <div 
                    className={`transition-all duration-350 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-[300px] border-t border-slate-900' : 'max-h-0'
                    }`}
                  >
                    <div className="px-6 py-5 text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Hero-like Final Call-To-Action (CTA) Section */}
      <section className="py-24 bg-gradient-to-b from-[#070A13] to-[#04060C] text-center relative overflow-hidden border-t border-slate-900">
        
        {/* Soft background light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] -z-10" />

        <div className="max-w-4xl mx-auto px-6 space-y-8">
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            Stop Signing Agreements Blindly.<br />
            Scan Your Terms Now.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-semibold max-w-xl mx-auto leading-relaxed">
            Gain full transparency. TNC Guardian parses terms instantly, pointing out hidden costs, cookie tracking, and data limits.
          </p>
          <div className="pt-4">
            <Link
              to="/register"
              className="px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition-all duration-200 inline-flex items-center gap-2.5"
            >
              <span>Analyze Now (Free Scan)</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer Section */}
      <footer className="bg-[#03050A] border-t border-slate-950 text-slate-500 py-16 text-sm relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-900/60">
          
          {/* Logo & Description */}
          <div className="md:col-span-5 space-y-4">
            <span className="text-lg font-bold text-white font-display tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-sm shadow-md shadow-brand-500/5">
                🛡️
              </span>
              {env.VITE_APP_NAME}
            </span>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-md">
              TNC Guardian is an automated, AI-powered compliance auditor that reviews legal disclosures, service terms, and agreements. We simplify visual compliance checks.
            </p>
          </div>

          {/* Sub Navigation Columns */}
          <div className="md:col-span-7 grid grid-cols-3 gap-6">
            {/* Col 1 */}
            <div className="space-y-3">
              <h5 className="font-extrabold text-white text-xs uppercase tracking-wider">Product</h5>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li><a href="#features" className="hover:text-slate-300 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-slate-300 transition-colors">How It Works</a></li>
                <li><Link to="/register" className="hover:text-slate-300 transition-colors">Register</Link></li>
              </ul>
            </div>

            {/* Col 2 */}
            <div className="space-y-3">
              <h5 className="font-extrabold text-white text-xs uppercase tracking-wider">Legal</h5>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li><a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a></li>
                <li>
                  <a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="hover:text-slate-300 transition-colors inline-flex items-center gap-1"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-3">
              <h5 className="font-extrabold text-white text-xs uppercase tracking-wider">Contact</h5>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Questions? <br />
                <span className="text-slate-300 font-bold block mt-1">support@tnc-guardian.dev</span>
              </p>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600 font-semibold">
          <span>&copy; {new Date().getFullYear()} {env.VITE_APP_NAME}. All rights reserved.</span>
          <span>Powered by Claude & EasyOCR Compliance Pipeline.</span>
        </div>
      </footer>

    </div>
  );
};
