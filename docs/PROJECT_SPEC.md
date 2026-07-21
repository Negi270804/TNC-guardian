# Project Specification: TNC Guardian

## 1. Problem Statement
In the modern digital economy, users are constantly prompted to accept Terms and Conditions (T&Cs), Privacy Policies, and End-User License Agreements (EULAs) before accessing applications, websites, and digital services. These legal agreements are notoriously long, complex, and written in dense legal terminology ("legalese"). 

Statistically, over 90% of consumers accept these agreements without reading them. This behavior poses significant risks, including:
- Unknowingly consenting to invasive data collection and sharing practices.
- Waiving rights to collective action or civil litigation through forced arbitration clauses.
- Accepting recurring subscriptions, hidden fees, or unfavorable termination clauses.
- Granting perpetual, royalty-free licenses to personal content, intellectual property, or uploaded data.

There is a critical lack of tools that translate complex legalese into accessible, simple, and actionable terms in real time, empowering users to make informed decisions before clicking "I Agree."

---

## 2. Objectives
TNC Guardian aims to bridge the gap between complex legal documents and user comprehension through an AI-powered document intelligence system.

The primary objectives are:
- **Demystify Legalese**: Instantly translate dense legal syntax into simple English (reading level: 8th grade / CEFR B1).
- **Highlight Risky Clauses**: Identify, categorize, and flag terms that infringe on privacy, limit liability unfairly, or bind the user to unexpected financial commitments.
- **Provide Actionable Precautionary Advice**: Formulate concrete safety measures and settings adjustments for each identified risk.
- **Accelerate Analysis**: Enable users to analyze documents using multiple convenient inputs—pasted URLs, uploaded PDFs, static screenshots, or screen recordings of scrolling text.
- **Track Legal Revisions**: Offer a history of scanned documents so users can track changes in terms over time.

---

## 3. Project Scope
The scope of TNC Guardian spans the development of a production-grade web application tailored for consumers, freelancers, and small businesses.

- **In-Scope**:
  - Processing and ingestion of URLs, PDFs, PNG/JPG/WebP screenshots, and MP4/WebM screen recordings.
  - OCR extraction engine optimized for structured legal layout detection.
  - Transcription pipeline for extracting spoken narration from video uploads (if any).
  - LLM analysis engine for semantic risk assessment, categorization, and scoring.
  - Interactive dashboard displaying historical scans, risk comparisons, and detail sheets.
  - User settings, profile management, and billing integration for premium plans.
- **Out of Scope (Phase 0 Boundaries)**:
  - Frontend component rendering, UI builds, styling implementations, and state routing code.
  - Backend API implementations, routes, controllers, middleware code, database migrations, and models.
  - Live Docker deployments, infrastructure provisioning, and CI/CD pipelines.

---

## 4. Target Users
- **Students**: Need to review university enrollment forms, housing leases, and software tools quickly.
- **Professionals**: Reviewing employment agreements, non-disclosure agreements (NDAs), and SaaS tool licenses.
- **General Internet Users**: Seeking to protect personal data before signing up for new apps, games, or social platforms.
- **Freelancers & Independent Contractors**: Reviewing service agreements, intellectual property assignments, and payment terms without access to expensive legal departments.
- **Privacy-Conscious Users**: Individuals focused on protecting personal identity, limiting tracking, and auditing data policies.
- **Small Businesses**: Reviewing vendor agreements, hardware leases, and corporate subscription plans on a budget.

---

## 5. Major Features
- **URL Scraper**: Automatically fetches and extracts the text content of Terms & Conditions and Privacy Policies directly from target websites.
- **Document Ingestor**: Extracts clean text from uploaded PDF files, handling multi-column formats and tables.
- **OCR Parser**: Identifies text in uploaded image files (screenshots) using optical recognition, correcting skewness and resolution drops.
- **Video Transcriber**: Extracts audio streams from video screen recordings, transcribes voice narration, and combines it with frames processed by OCR to analyze video walkthroughs.
- **AI Legal Simplifier**: Rewrites clauses into short, bulleted summaries using simple language.
- **Risk Score Engine**: Computes a dynamic score (0 to 100) representing the threat level of the document, based on severity and density of risky clauses.
- **Clause Categorizer**: Tags issues under defined categories: Data Privacy, Financial Commitment, Intellectual Property, Dispute Resolution, and Termination.
- **Precautionary Recommender**: Generates custom checklists for users to mitigate risks (e.g., "Opt-out of tracking in setting page X within 30 days").
- **Dashboard & History**: A centralized history view enabling search, filtering, and comparative analysis of past documents.

---

## 6. Out of Scope (Future General Implementations)
- **Legal Representation**: The application does not provide official legal counsel, legal advice, or attorney-client representation. It serves as an informational analysis tool.
- **Automated Opt-Out Execution**: The tool will not automatically click buttons or submit opt-out forms on external sites on the user's behalf.
- **Custom Contract Drafting**: The system will not generate contract templates, draft agreements, or facilitate negotiations between signing parties.

---

## 7. Functional Requirements
- **FR-1: URL Extraction**: The system must scrape pages matching legal keywords, bypass common bot protections (e.g., Cloudflare, cookie consent walls) where legally permissible, and parse out core layout elements.
- **FR-2: Multi-Format Uploads**: The system must support PDFs up to 50MB, images (PNG, JPG) up to 10MB, and video uploads (MP4, WebM) up to 100MB.
- **FR-3: OCR Text Alignment**: The system must reconstruct horizontal line arrangements and column divisions from raw OCR pixel maps to preserve clause contexts.
- **FR-4: Speech-to-Text Processing**: The system must extract audio from video containers, run transcription with timestamps, and index spoken legal disclosures.
- **FR-5: LLM Risk Assessment**: The AI engine must analyze document blocks, classify clauses against predefined risk taxonomies, and explain each threat in plain English.
- **FR-6: Risk Scoring Matrix**: The system must generate a composite score using weighted threat severity (Critical: 10, High: 6, Medium: 3, Low: 1) normalized by document length.
- **FR-7: Recommendation Engine**: The system must map identified risks to corresponding actionable remediation steps.
- **FR-8: User History Ledger**: The system must record analysis logs, retaining the source document metadata, risk metrics, and detailed results for subscriber retrieval.

---

## 8. Non-Functional Requirements
- **NFR-1: Performance (Latency)**: 
  - Text analyses (URL/pasted text) must return results within 5 seconds.
  - Documents requiring OCR or transcription must complete processing and analysis within 45 seconds.
- **NFR-2: Security & Privacy**:
  - All communication must utilize TLS 1.3 encryption.
  - Uploaded documents containing personally identifiable information (PII) must be scrubbed or encrypted at rest using AES-256.
  - JWT tokens must employ HS256/RS256 algorithms with a 15-minute expiration window and secure HttpOnly refresh cookies.
- **NFR-3: Availability**: The platform must target a 99.9% uptime (excluding scheduled maintenance).
- **NFR-4: Scalability**: The architecture must scale horizontally, utilizing async message queues for heavy processing operations (OCR, Whisper transcription, and LLM requests) to prevent API thread starvation.
- **NFR-5: Accuracy**: The LLM parsing accuracy for risk categorization must achieve a F1-score of >= 0.90 based on a benchmark test suite of annotated legal texts.

---

## 9. Success Criteria
- **User Engagement**: 85% of users state they understand the risks of analyzed agreements better than they would have by reading the raw text.
- **Conversion Rate**: Achieve a 5% signup conversion rate from guest visitors to free tier accounts, and a 2% conversion rate from free to premium subscription plans.
- **System Robustness**: 99.5% of OCR and video uploads are parsed successfully without server timeouts or unhandled internal errors.
- **Analysis Accuracy**: Low false-negative rate (< 3%) for critical clauses like "unilateral changes without notice" or "binding arbitration and waiver of class action."

---

## 10. Future Scope
- **Browser Extension**: A Chrome/Firefox/Safari extension that automatically scans T&Cs on signup pages as the user browses.
- **Automated Opt-Out Agents**: Autonomous agents that interface with user settings on scanned services to toggle off data collection automatically via API or page automation.
- **Custom Fine-tuned Legal Models**: Training a custom open-source model (e.g., Llama-3-Legal-FineTune) to reduce dependence on third-party proprietary APIs and lower token costs.
- **Collaborative Risk Database**: A crowd-sourced database where users can view, comment on, and verify analysis scores of major online platforms in real time.
