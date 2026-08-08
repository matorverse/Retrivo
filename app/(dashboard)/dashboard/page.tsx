"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  UploadCloud,
  FileText,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Search,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { ChatInterface } from "@/components/ChatInterface";
import { QuizInterface } from "@/components/QuizInterface";

interface UserDocument {
  id: string;
  filename: string;
  storageUrl: string;
  status: "pending" | "processing" | "ready" | "failed" | string;
  createdAt: string;
  _count?: {
    chunks: number;
  };
}

type DashboardTab = "library" | "chat" | "quiz";

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [activeTab, setActiveTab] = useState<DashboardTab>("library");
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDocForChat, setActiveDocForChat] = useState<UserDocument | null>(null);
  const [activeDocForQuiz, setActiveDocForQuiz] = useState<UserDocument | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchDocuments();
      // Only set fast polling interval if any document is processing or pending
      const hasActiveProcessing = documents.some(
        (d) => d.status === "pending" || d.status === "processing"
      );
      if (hasActiveProcessing) {
        const interval = setInterval(fetchDocuments, 3000);
        return () => clearInterval(interval);
      }
    }
  }, [session, fetchDocuments, documents]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isPdfType = file.type === "application/pdf" || file.type === "application/x-pdf";
      const isPdfExt = file.name.toLowerCase().endsWith(".pdf");
      if (!isPdfType && !isPdfExt) {
        setUploadError("Only PDF files are supported.");
        setSelectedFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("File size must not exceed 10MB.");
        setSelectedFile(null);
        return;
      }
      setUploadError(null);
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Failed to upload document.");
      } else {
        setUploadSuccess(`Successfully uploaded ${selectedFile.name}`);
        setSelectedFile(null);
        fetchDocuments();
      }
    } catch (err) {
      setUploadError("Network error while uploading file.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    // Optimistic UI update: Remove document immediately from local state
    const previousDocs = [...documents];
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        // Rollback state if server deletion failed
        setDocuments(previousDocs);
        alert("Failed to delete document on server.");
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
      setDocuments(previousDocs);
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) =>
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [documents, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 calm-card p-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-calm-primary uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 stroke-[1.75]" /> Workspace
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-calm-text">
            Study Workspace
          </h1>
          <p className="text-xs sm:text-sm text-calm-text-muted mt-0.5">
            Upload lecture notes, ask cited Q&A questions, and practice with auto-generated quizzes
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-calm-sm bg-calm-surface-muted border border-calm-border self-start md:self-auto">
          <button
            onClick={() => setActiveTab("library")}
            className={`px-3 py-1.5 rounded-calm-sm text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "library"
                ? "bg-calm-surface text-calm-text shadow-none border border-calm-border"
                : "text-calm-text-muted hover:text-calm-text"
            }`}
          >
            <FileText className="w-3.5 h-3.5 stroke-[1.75]" />
            Library
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 rounded-calm-sm text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "chat"
                ? "bg-calm-surface text-calm-text shadow-none border border-calm-border"
                : "text-calm-text-muted hover:text-calm-text"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-calm-primary stroke-[1.75]" />
            AI Q&A Chat
          </button>
          {activeDocForQuiz && (
            <button
              onClick={() => setActiveTab("quiz")}
              className={`px-3 py-1.5 rounded-calm-sm text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "quiz"
                  ? "bg-calm-surface text-calm-text shadow-none border border-calm-border"
                  : "text-calm-text-muted hover:text-calm-text"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-calm-primary stroke-[1.75]" />
              Practice Quiz
            </button>
          )}
        </div>
      </div>

      {/* Tab Content 1: Library */}
      {activeTab === "library" && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Form Card */}
          <div className="calm-card p-6 space-y-5 h-fit">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-calm-sm bg-calm-primary-tint text-calm-primary">
                <UploadCloud className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-calm-text">Upload material</h2>
                <p className="text-xs text-calm-text-muted">PDF files up to 10MB</p>
              </div>
            </div>

            {uploadError && (
              <div className="p-3 rounded-calm-sm bg-calm-danger-tint border border-calm-danger/30 text-calm-danger text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 stroke-[1.75]" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 rounded-calm-sm bg-calm-success-tint border border-calm-success/30 text-calm-success text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[1.75]" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <label
                htmlFor="pdf-upload"
                className="border border-dashed border-calm-border hover:border-calm-primary bg-calm-surface-muted hover:bg-calm-surface rounded-calm-sm p-6 text-center block cursor-pointer transition-colors"
              >
                <FileText className="w-8 h-8 mx-auto text-calm-text-muted mb-2 stroke-[1.5]" />
                <p className="text-sm font-medium text-calm-text">
                  {selectedFile ? selectedFile.name : "Click or drag PDF here"}
                </p>
                <p className="text-xs text-calm-text-subtle mt-1">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                    : "PDF documents supported"}
                </p>
                <input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="w-full py-2.5 px-4 rounded-calm-sm bg-calm-primary hover:bg-calm-primary-hover text-white font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin stroke-[1.75]" />
                    Uploading & Indexing...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 stroke-[1.75]" />
                    Upload document
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Document Library Container */}
          <div className="lg:col-span-2 calm-card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-heading text-lg font-semibold text-calm-text flex items-center gap-2">
                Your library
                <span className="text-xs px-2 py-0.5 rounded-full bg-calm-surface-muted border border-calm-border text-calm-text-muted font-normal">
                  {documents.length}
                </span>
              </h2>

              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-calm-text-subtle absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.75]" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-calm-sm bg-calm-surface border border-calm-border text-xs text-calm-text placeholder-calm-text-subtle focus:outline-none focus:border-calm-primary transition-colors"
                />
              </div>
            </div>

            {loadingDocs ? (
              <div className="py-12 text-center text-calm-text-muted space-y-2">
                <RefreshCw className="w-5 h-5 mx-auto animate-spin text-calm-primary stroke-[1.75]" />
                <p className="text-xs">Fetching library documents...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-calm-border rounded-calm-sm p-6 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-calm-text-subtle stroke-[1.5]" />
                <h3 className="text-sm font-medium text-calm-text">No documents found</h3>
                <p className="text-xs text-calm-text-muted max-w-xs mx-auto">
                  {searchQuery
                    ? "No files match your search criteria."
                    : "Upload lecture notes or study PDFs on the left to get started."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-calm-border text-xs font-medium text-calm-text-muted uppercase tracking-wider">
                      <th className="py-2.5 px-3">Document name</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-calm-border text-sm">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-calm-surface-muted transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-calm-sm bg-calm-primary-tint text-calm-primary">
                              <FileText className="w-4 h-4 stroke-[1.75]" />
                            </div>
                            <div>
                              <p className="font-medium text-calm-text truncate max-w-xs">
                                {doc.filename}
                              </p>
                              <p className="text-[11px] text-calm-text-subtle">
                                {doc._count?.chunks ? `${doc._count.chunks} chunks indexed` : "PDF document"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {doc.status === "ready" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-calm-success-tint border border-calm-success/20 text-calm-success text-xs font-medium">
                              <CheckCircle2 className="w-3 h-3 stroke-[1.75]" /> Ready
                            </span>
                          ) : doc.status === "pending" || doc.status === "processing" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-calm-warning-tint border border-calm-warning/20 text-calm-warning text-xs font-medium animate-calm-pulse">
                              <Clock className="w-3 h-3 stroke-[1.75]" /> Processing
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-calm-danger-tint border border-calm-danger/20 text-calm-danger text-xs font-medium">
                              <AlertTriangle className="w-3 h-3 stroke-[1.75]" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {doc.status === "ready" && (
                              <>
                                <button
                                  onClick={() => {
                                    setActiveDocForChat(doc);
                                    setActiveTab("chat");
                                  }}
                                  className="px-2.5 py-1 rounded-calm-sm bg-calm-primary-tint text-calm-primary hover:bg-calm-primary/20 text-xs font-medium transition-colors flex items-center gap-1"
                                  title="Ask AI about this document"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 stroke-[1.75]" />
                                  Ask AI
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveDocForQuiz(doc);
                                    setActiveTab("quiz");
                                  }}
                                  className="px-2.5 py-1 rounded-calm-sm bg-calm-secondary-tint text-calm-text hover:bg-calm-secondary/30 text-xs font-medium transition-colors flex items-center gap-1"
                                  title="Generate practice quiz"
                                >
                                  <BookOpen className="w-3.5 h-3.5 stroke-[1.75]" />
                                  Quiz
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="p-1.5 rounded-calm-sm text-calm-text-subtle hover:text-calm-danger hover:bg-calm-danger-tint transition-colors"
                              title="Delete document"
                            >
                              <Trash2 className="w-4 h-4 stroke-[1.75]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: AI Q&A Chat */}
      {activeTab === "chat" && (
        <ChatInterface
          documentId={activeDocForChat?.id}
          documentName={activeDocForChat?.filename}
        />
      )}

      {/* Tab Content 3: Practice Quiz */}
      {activeTab === "quiz" && activeDocForQuiz && (
        <QuizInterface
          documentId={activeDocForQuiz.id}
          documentName={activeDocForQuiz.filename}
          onClose={() => setActiveTab("library")}
        />
      )}
    </div>
  );
}
