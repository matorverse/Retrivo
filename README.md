# 📚 Study Companion — AI Notes, Cited RAG Q&A & Practice Quizzes

> A calm, composed AI study platform built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **PostgreSQL with `pgvector`**. Upload lecture notes and PDFs for instant AI Q&A with clickable source citations, auto-generated practice quizzes, and PWA mobile offline support.

---

## 🌟 Overview

**Study Companion** turns dense lecture notes, research PDFs, and class slides into an interactive, cited intelligence workspace. Unlike generic chatbots that hallucinate or provide uncited summaries, Study Companion performs **per-user vector retrieval-augmented generation (RAG)** directly over your uploaded document chunks—citing the exact document and chunk index for every answer.

Designed with a **Calm & Composed UI/UX identity**, the application features a warm, unhurried visual palette (warm beige `#FAF6EF`, soft sage green `#93AE8B`, peach `#E8B894`, and warm charcoal text `#33312B`) paired with comfortable humanist typography (**DM Sans** body + **Plus Jakarta Sans** headings) to eliminate eye strain during long study sessions.

---

## ✨ Key Features

### 📄 1. PDF Ingestion & Semantic Chunking
- **Server-Side Text Extraction**: Parses raw PDF document streams on upload using `pdf-parse`.
- **Semantic Text Chunking**: Splits extracted text into ~500 token (~1800 character) blocks with ~50 token overlap to preserve paragraph context across boundaries.
- **Vector Embeddings**: Computes 1536-dimensional vector embeddings for each chunk and persists them in PostgreSQL using `pgvector`.
- **Status Lifecycle**: Documents transition automatically from `pending` $\rightarrow$ `processing` $\rightarrow$ `ready` (or `failed` with error capture).

### 🔍 2. Cited RAG Chat Q&A
- **Strict User Scoping**: Vector similarity searches (cosine distance `<=>`) execute strictly over the logged-in user's chunks—never leaking cross-user data.
- **Interactive Source Citations**: Answers include clickable reference chips (e.g. `[Lecture_12.pdf, Chunk #3]`) displaying source document names and chunk indices.
- **Strict Context Prompting**: Instructs the LLM to answer using *only* the provided context and clearly state when information is unavailable.

### 📝 3. Auto-Generated Practice Quizzes
- **Document Comprehension Testing**: Automatically generates multiple-choice practice quizzes derived from indexed document chunks.
- **Instant Feedback & Scoring**: Real-time option evaluation, explanations, and direct citations back to the source text.

### 📱 4. Mobile PWA & Offline Support
- **Installable Web App**: Web App Manifest (`public/manifest.json`) supporting standalone display mode on iOS and Android.
- **Service Worker Caching**: Service worker (`public/sw.js`) caches static assets and document libraries for offline access.
- **Mobile Ergonomics**: All touch targets $\ge 44\text{px}$ with responsive layouts optimized for mobile keyboards.

### 🔒 5. Security & Validation
- **Session Authentication**: Secured via **NextAuth.js** Credentials Provider and `bcryptjs` password hashing.
- **Input Validation**: All server endpoints and client forms are validated using **Zod** schemas.
- **Server-Only Isolation**: LLM and embedding integration routines (`lib/llm.ts`) are strictly server-only and never exposed to the client.

---

## 🛠️ Tech Stack

| Layer | Choice |
|---|---|
| **Framework** | Next.js 14+ (App Router), TypeScript |
| **Styling** | Tailwind CSS (Calm Warm Palette: `#FAF6EF` / `#93AE8B` / `#33312B`) |
| **Typography** | DM Sans (body) + Plus Jakarta Sans (headings) via `next/font/google` |
| **Database** | PostgreSQL (Neon / Supabase with `pgvector` extension) |
| **ORM** | Prisma ORM |
| **Auth** | NextAuth.js (Credentials Provider with `bcryptjs`) |
| **File Parsing** | `pdf-parse` (Server-Side) |
| **Validation** | Zod |
| **PWA** | Web App Manifest + Service Worker (`sw.js`) |
| **CI** | GitHub Actions (`tsc --noEmit` & ESLint) |

---

## 🗄️ Data Model

```prisma
model User {
  id             String     @id @default(cuid())
  email          String     @unique
  hashedPassword String?
  name           String?
  createdAt      DateTime   @default(now())
  documents      Document[]
}

model Document {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  filename   String
  storageUrl String
  status     String   @default("pending") // pending | processing | ready | failed
  createdAt  DateTime @default(now())
  chunks     Chunk[]
}

model Chunk {
  id         String                       @id @default(cuid())
  documentId String
  document   Document                     @relation(fields: [documentId], references: [id], onDelete: Cascade)
  content    String
  embedding  Unsupported("vector(1536)")? // pgvector 1536-dim vector column
  chunkIndex Int
}
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.x or v20.x
- **npm** or **pnpm**
- **PostgreSQL**: A Postgres database instance with `pgvector` enabled (e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com), or Docker Postgres).

### 2. Clone & Install
```bash
git clone https://github.com/matorverse/Retrivo.git
cd Retrivo
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure the environment variables in `.env.local`:
```env
# PostgreSQL connection string (must support pgvector)
DATABASE_URL="postgresql://user:password@localhost:5432/study_companion?schema=public"

# NextAuth secret & URL
NEXTAUTH_SECRET="your-development-secret-key-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Server-Side API Keys
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Blob storage token
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

### 4. Database Setup & Migrations
Generate the Prisma client and push the schema (including raw SQL pgvector extension):
```bash
# Generate Prisma Client
npx prisma generate

# Apply DB schema and pgvector extension
npx prisma db push
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Build Scripts

```bash
# Run TypeScript type check
npx tsc --noEmit

# Run ESLint check
npm run lint

# Build production bundle
npm run build
```

---

## 📁 Project Structure

```
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx        # Login page
│   │   └── signup/page.tsx       # Signup page
│   ├── (dashboard)/
│   │   └── dashboard/page.tsx    # Main workspace (Library, Chat, Quiz tabs)
│   ├── api/
│   │   ├── auth/                 # NextAuth & registration handlers
│   │   ├── chat/route.ts         # Cited RAG chat endpoint
│   │   └── documents/            # Document upload & deletion endpoints
│   ├── globals.css               # Calm theme CSS custom properties
│   ├── layout.tsx                # Root layout with fonts & PWA headers
│   └── page.tsx                  # Public landing page
├── components/
│   ├── AuthProvider.tsx          # Client SessionProvider wrapper
│   ├── ChatInterface.tsx         # Cited RAG Q&A chat component
│   ├── Navbar.tsx                # Navigation header
│   └── QuizInterface.tsx         # Interactive practice quiz component
├── lib/
│   ├── auth.ts                   # NextAuth options & session helpers
│   ├── db.ts                     # Prisma client singleton
│   ├── llm.ts                    # Server-side PDF parsing, chunking & embeddings
│   ├── rag.ts                    # PostgreSQL pgvector similarity search
│   ├── storage.ts                # File storage abstraction
│   └── validations.ts            # Zod validation schemas
├── prisma/
│   ├── migrations/               # Raw SQL migration for pgvector extension
│   └── schema.prisma             # Data model definitions
├── public/
│   ├── manifest.json             # Web App Manifest
│   └── sw.js                     # Offline service worker
└── README.md                     # Project documentation
```

---

## 📄 License

Built as a CSE semester portfolio project. Designed for calm, focused, and cited learning.
