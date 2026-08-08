import Link from "next/link";
import { BookOpen, FileText, Database, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-20">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-calm-primary-tint border border-calm-border text-xs font-medium text-calm-primary">
          <Sparkles className="w-3.5 h-3.5 stroke-[1.75]" />
          <span>A quiet, composed AI study space</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-5xl font-bold text-calm-text tracking-tight leading-tight">
          Transform your lecture notes into interactive intelligence
        </h1>

        <p className="text-base text-calm-text-muted leading-relaxed max-w-xl mx-auto font-sans">
          Upload your PDFs and class notes. Ask questions with instant citations back to your original source material, without distractions.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-6 py-2.5 rounded-calm-sm bg-calm-primary hover:bg-calm-primary-hover text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            Start studying free
            <ArrowRight className="w-4 h-4 stroke-[1.75]" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-2.5 rounded-calm-sm bg-calm-surface hover:bg-calm-surface-muted text-calm-text font-medium text-sm border border-calm-border transition-colors text-center"
          >
            Log in to dashboard
          </Link>
        </div>
      </div>

      {/* Feature Section */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="calm-card calm-card-hover p-6 space-y-3">
          <div className="p-2.5 w-fit rounded-calm-sm bg-calm-primary-tint text-calm-primary">
            <FileText className="w-5 h-5 stroke-[1.75]" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-calm-text">
            Smart document storage
          </h2>
          <p className="text-sm text-calm-text-muted leading-relaxed">
            Upload PDF notes cleanly. Documents are organized for fast vector indexing and retrieval.
          </p>
        </div>

        <div className="calm-card calm-card-hover p-6 space-y-3">
          <div className="p-2.5 w-fit rounded-calm-sm bg-calm-secondary-tint text-calm-text">
            <Database className="w-5 h-5 stroke-[1.75]" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-calm-text">
            Vector search with pgvector
          </h2>
          <p className="text-sm text-calm-text-muted leading-relaxed">
            Schema enabled with vector embeddings for exact semantic citations to source paragraphs.
          </p>
        </div>

        <div className="calm-card calm-card-hover p-6 space-y-3">
          <div className="p-2.5 w-fit rounded-calm-sm bg-calm-surface-muted border border-calm-border text-calm-text-muted">
            <ShieldCheck className="w-5 h-5 stroke-[1.75]" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-calm-text">
            Session security
          </h2>
          <p className="text-sm text-calm-text-muted leading-relaxed">
            Protected server routes, password hashing with bcrypt, and input validation with Zod.
          </p>
        </div>
      </div>
    </div>
  );
}
