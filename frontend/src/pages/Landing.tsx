import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { env } from '@/config/env';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

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
      description: "Tear down complex legal jargon. Our AI translates dense paragraphs into clear, human-readable bullet points.",
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
    <div className="min-h-screen bg-[#070A13] text-slate-105 selection:bg-brand-500 selection:text-white font-sans overflow-x-hidden antialiased transition-colors duration-300">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute top-[20%] right-10 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute top-[50%] left-10 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* Sticky Glassmorphic Header */}
      <header className="sticky top-0 z-50 w-full bg-[#070A13]/80 backdrop-blur-md border-b border-slate-900 transition-colors">
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
            <motion.button
              onClick={toggleTheme}
              whileHover={{ rotate: 15 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition select-none"
              title="Toggle Light/Dark Mode"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <span className="text-sm block leading-none">🌙</span>
              ) : (
                <span className="text-sm block leading-none">☀️</span>
              )}
            </motion.button>
            <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
              Log In
            </Link>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-sm shadow-lg shadow-brand-500/20 inline-block"
              >
                Analyze Now
              </Link>
            </motion.div>
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
      <section className="relative pt-24 pb-20 md:pt-36 md:pb-32 overflow-hidden text-center select-none">
        <div className="max-w-4xl mx-auto px-6 space-y-8 relative z-10">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-full text-xs font-bold uppercase tracking-wider"
          >
            <span>✨</span> Intelligent Legalese Auditor
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1] font-display"
          >
            Understand Terms & Conditions <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Before Clicking "I Agree"
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium"
          >
            TNC Guardian reviews contracts, privacy updates, and legalese in seconds. Spots hidden waivers, automatic renewals, and data sharing risks.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/register"
                className="px-6.5 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm shadow-xl shadow-brand-500/25 inline-block"
              >
                Analyze Now
              </Link>
            </motion.div>
            <a
              href="#features"
              className="px-6.5 py-3.5 border border-slate-800 hover:bg-slate-900/40 text-slate-400 hover:text-white font-bold rounded-xl text-sm transition"
            >
              Learn More
            </a>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-50 cursor-pointer pointer-events-none select-none text-slate-400"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest">Scroll</span>
          <span className="text-sm">↓</span>
        </motion.div>
      </section>

      {/* 2. Features Section */}
      <section id="features" className="py-24 bg-[#090D1A]/60 border-y border-slate-900 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-650/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16 relative z-10">
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="inline-block text-xs font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full select-none">
              Features
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
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="p-8 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-slate-800 hover:bg-slate-950/60 shadow-xl hover:shadow-brand-500/5 transition-all text-left space-y-5 group"
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section id="how-it-works" className="py-24 bg-[#070A13] relative">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-20">
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="inline-block text-xs font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full select-none">
              Process Flow
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">How It Works</h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Three simple steps to secure your rights. No legal background or training required.
            </p>
          </div>

          {/* Steps Timeline Checklist */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto z-10 text-left">
            {steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                className="space-y-4 relative"
              >
                <div className="text-4xl font-black text-brand-500/20 font-display select-none">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-white font-display">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-semibold">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Benefits Section */}
      <section id="why-us" className="py-24 bg-[#090D1A]/60 border-y border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-6 space-y-16 relative z-10 text-center">
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="inline-block text-xs font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full select-none">
              Benefits
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
              Understand Agreements Faster
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto text-left items-center">
            {/* Left list details */}
            <div className="space-y-6">
              {benefits.map((benefit, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="flex items-start gap-4 p-4 rounded-xl border border-slate-900/60 hover:border-slate-800 hover:bg-slate-900/10 transition duration-200"
                >
                  <span className="text-2xl p-2 bg-slate-950/80 border border-slate-800 rounded-lg shrink-0 select-none">
                    {benefit.icon}
                  </span>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm sm:text-base font-display">
                      {benefit.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right details box comparison panel */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              className="bg-slate-950/40 border border-slate-900 p-6.5 rounded-2xl space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-transparent" />
              <div>
                <h3 className="font-extrabold text-white text-base font-display">The Compliance Difference</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5 select-none">T&C Legalese vs Plain Language</p>
              </div>

              <div className="space-y-4 text-xs font-semibold">
                <div className="space-y-2 p-3 bg-red-950/15 border border-red-500/10 rounded-xl">
                  <span className="text-[9px] font-black text-red-500 uppercase select-none">Dense Legal Jargon</span>
                  <p className="text-slate-450 italic leading-relaxed">
                    \"You agree that we may, in our sole discretion, track, aggregate and sell telemetry datasets to third-party ad brokers without notice...\"
                  </p>
                </div>
                <div className="space-y-2 p-3 bg-emerald-950/15 border border-emerald-500/10 rounded-xl">
                  <span className="text-[9px] font-black text-emerald-500 uppercase select-none">Plain Language Summary</span>
                  <p className="text-slate-350 leading-relaxed font-sans font-medium">
                    • Company tracks usage logs. <br />
                    • Sells data to advertisers. <br />
                    • No notification required.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. Testimonials Section */}
      <section className="py-24 bg-[#070A13] relative">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16 relative z-10">
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="inline-block text-xs font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full select-none">
              Testimonials
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">Trusted by Users</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
            {testimonials.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-slate-800 space-y-6 shadow-lg flex flex-col justify-between"
              >
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed italic font-medium">
                  "{item.quote}"
                </p>
                <div className="flex items-center gap-3.5 select-none pt-4 border-t border-slate-900/60">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.avatarBg} flex items-center justify-center font-bold text-white text-sm shadow-md`}>
                    {item.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">{item.author}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">{item.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section id="faq" className="py-24 bg-[#090D1A]/60 border-y border-slate-900 relative">
        <div className="max-w-4xl mx-auto px-6 space-y-16 relative z-10 text-center">
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="inline-block text-xs font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full select-none">
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto text-left">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index} 
                  className="bg-slate-950/40 border border-slate-900 hover:border-slate-850 rounded-2xl overflow-hidden shadow-md transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none select-none text-white hover:text-brand-400 font-bold font-display text-sm sm:text-base gap-4"
                  >
                    <span>{faq.question}</span>
                    <span className="text-slate-500 text-lg transition-transform duration-300" style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                      ＋
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                          open: { opacity: 1, height: "auto" },
                          collapsed: { opacity: 0, height: 0 }
                        }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 text-sm text-slate-400 leading-relaxed pt-2 border-t border-slate-900/60 font-semibold font-sans">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Footer Section */}
      <footer className="py-16 bg-[#070A13] border-t border-slate-900 select-none text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 font-semibold">
          <div className="space-y-4">
            <span className="text-white font-extrabold text-base tracking-wider block">{env.VITE_APP_NAME}</span>
            <p className="leading-relaxed font-semibold max-w-xs">
              AI-powered document auditing dashboard helping you understand legal bindings before signing.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] text-white uppercase font-bold tracking-widest mb-4">Product</h4>
            <ul className="list-none space-y-2.5 pl-0">
              <li><a href="#features" className="hover:text-slate-300 transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-slate-300 transition-colors">How It Works</a></li>
              <li><Link to="/pricing" className="hover:text-slate-300 transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] text-white uppercase font-bold tracking-widest mb-4">Security</h4>
            <ul className="list-none space-y-2.5 pl-0">
              <li><span className="hover:text-slate-300 cursor-pointer transition">Anonymization</span></li>
              <li><span className="hover:text-slate-300 cursor-pointer transition">Sandbox Isolation</span></li>
              <li><span className="hover:text-slate-300 cursor-pointer transition">Zero Data Leaks</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] text-white uppercase font-bold tracking-widest mb-4">Legal</h4>
            <ul className="list-none space-y-2.5 pl-0">
              <li><span className="hover:text-slate-300 cursor-pointer transition">Terms of Use</span></li>
              <li><span className="hover:text-slate-300 cursor-pointer transition">Privacy Policy</span></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <span>&copy; {new Date().getFullYear()} {env.VITE_APP_NAME} Inc. All rights reserved.</span>
          <span>Designed with absolute precision.</span>
        </div>
      </footer>

    </div>
  );
};
