# Auditor.ai - AI-Powered Corporate Expense Compliance

## 1. Project Title
**Auditor.ai - AI-Powered Corporate Expense Compliance**

## 2. The Problem
Traditional corporate expense auditing is a manual, error-prone process that creates significant friction for both employees and finance teams. Manual reviews lead to slow reimbursement cycles and often fail to catch subtle policy violations, resulting in financial leakage and compliance risks.

## 3. The Solution
Auditor.ai streamlines the entire expense lifecycle using a RAG-based AI approach that automates compliance checks against complex corporate policies. Key features include:
- **Multimodal OCR Receipt Extraction**: Automatically parses data from receipts using Google Gemini's vision capabilities.
- **Dynamic Vector-Based Policy Checking**: Utilizes Qdrant to retrieve and verify expenses against specific policy clauses in real-time.
- **Human-in-the-Loop Overrides**: Allows administrators to review AI flags and provide manual overrides for edge cases.
- **Automated Email Notifications**: Keeps employees informed of claim status and policy violations via Resend.

## 4. Tech Stack
- **Programming languages**: TypeScript
- **Frameworks**: Next.js, React, Tailwind CSS
- **Databases**: Supabase (PostgreSQL), Qdrant (Vector DB)
- **APIs or third-party tools**: Google Gemini API (2.5 Flash & text-embedding-001), Resend API

## 5. Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd policy-expense-auditor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add your API keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   QDRANT_URL=your_qdrant_url
   QDRANT_API_KEY=your_qdrant_api_key
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   RESEND_API_KEY=your_resend_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
