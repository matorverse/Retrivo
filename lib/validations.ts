import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").optional().or(z.literal("")),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const documentUploadSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  size: z.number().max(10 * 1024 * 1024, "File size must not exceed 10MB"),
  contentType: z.string().optional(),
}).refine(
  (data) => {
    const isPdfType = data.contentType === "application/pdf" || data.contentType === "application/x-pdf";
    const isPdfExt = data.filename.toLowerCase().endsWith(".pdf");
    return isPdfType || isPdfExt;
  },
  {
    message: "Only PDF documents are supported",
    path: ["contentType"],
  }
);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
