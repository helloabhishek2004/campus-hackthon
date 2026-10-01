import { z } from "zod";

export const PostCategorySchema = z.enum([
  "announcement",
  "event",
  "circular",
  "emergency",
  "general",
]);
export type PostCategory = z.infer<typeof PostCategorySchema>;

export const PostScopeSchema = z.enum([
  "campus_wide",
  "departmental",
  "hostel",
  "faculty_only",
]);
export type PostScope = z.infer<typeof PostScopeSchema>;

export const PostAttachmentSchema = z.object({
  id: z.string().optional(),
  url: z.string().url(),
  filename: z.string().optional(),
  mime_type: z.string().optional(),
});
export type PostAttachment = z.infer<typeof PostAttachmentSchema>;

export const PostSchema = z.object({
  id: z.string(),
  author_id: z.string(),
  title: z.string().min(1),
  content: z.string().min(1),
  category: PostCategorySchema,
  scope: PostScopeSchema,
  target_department: z.string().nullable().optional(),
  attachments: z.array(PostAttachmentSchema).default([]),
  is_pinned: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Post = z.infer<typeof PostSchema>;
