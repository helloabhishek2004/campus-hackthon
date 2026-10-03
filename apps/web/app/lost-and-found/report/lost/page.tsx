"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@smart-campus/ui";
import { ArrowLeft, Camera, Loader2, X, Lock, AlertTriangle } from "lucide-react";

export default function ReportLostItemPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    category: "electronics",
    subcategory: "",
    public_description: "",
    identifying_marks: "",
    location_description: "",
    event_date: new Date().toISOString().slice(0, 16),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormError(null);
      const rawFiles = Array.from(e.target.files);
      const validFiles: { file: File; preview: string }[] = [];

      for (const file of rawFiles) {
        if (!file.type.startsWith("image/")) {
          setFormError("Only image files (JPG, PNG, WebP) are allowed.");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setFormError(`Image "${file.name}" exceeds the 5MB size limit.`);
          return;
        }
        validFiles.push({
          file,
          preview: URL.createObjectURL(file),
        });
      }

      setFiles((prev) => [...prev, ...validFiles].slice(0, 3));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const removed = prev[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      const base64Images = await Promise.all(files.map((f) => toBase64(f.file)));

      const res = await fetch("/api/lost-found/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "lost",
          ...formData,
          images: base64Images.map((b64) => ({ public_url: b64, storage_path: "base64" })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to submit lost report");
      }

      const data = await res.json();
      router.push(`/lost-and-found/success?type=lost&id=${data.item.id}`);
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/lost-and-found"
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Lost & Found
        </Link>

        <Card className="border-zinc-800 bg-zinc-900/70 shadow-sm rounded-xl">
          <CardHeader className="border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-purple-500/20 bg-purple-500/10 text-purple-400 font-semibold">
                Module 3 Report
              </span>
            </div>
            <CardTitle className="text-lg font-bold text-zinc-100">
              Report a Lost Item
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Submit details and photos of your missing item to initiate automated multimodal AI matching.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Form Error Banner */}
              {formError && (
                <div className="p-3 bg-red-950/40 border border-red-900/60 text-red-300 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Photos */}
              <div className="space-y-2">
                <label className="font-semibold text-zinc-200">Photos (max 3)</label>

                {files.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950"
                      >
                        <img src={f.preview} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-black"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {files.length < 3 && (
                  <div className="border border-dashed border-zinc-800 hover:border-zinc-600 rounded-lg p-5 flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950/40 transition cursor-pointer relative">
                    <Camera className="w-6 h-6 mb-1 text-zinc-500" />
                    <span className="text-xs font-medium text-zinc-300">Tap to browse or take photo</span>
                    <span className="text-[10px] text-zinc-600">JPG, PNG, WebP up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-200">Item Title <span className="text-red-400">*</span></label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Dell XPS 15 Silver Laptop, Blue Hydro Flask"
                  className="w-full px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-200">Category</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-200 focus:outline-none focus:border-zinc-600"
                  >
                    <option value="electronics">Electronics</option>
                    <option value="id_cards_docs">ID Cards / Docs</option>
                    <option value="keys">Keys</option>
                    <option value="wallets_purses">Wallets / Purses</option>
                    <option value="bags_backpacks">Bags / Backpacks</option>
                    <option value="water_bottles">Water Bottles</option>
                    <option value="clothing_accessories">Clothing</option>
                    <option value="books_stationery">Books</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-200">Approximate Date & Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-200 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-200">Last Seen Location <span className="text-red-400">*</span></label>
                <input
                  required
                  type="text"
                  value={formData.location_description}
                  onChange={(e) => setFormData({ ...formData, location_description: e.target.value })}
                  placeholder="e.g. Central Library Floor 2 study desk, or Canteen table 5"
                  className="w-full px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Public Description */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-200">Public Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.public_description}
                  onChange={(e) => setFormData({ ...formData, public_description: e.target.value })}
                  placeholder="Describe the item general appearance visible to other students in the directory."
                  className="w-full px-3 py-2 border border-zinc-800 rounded-lg resize-none bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Identifying Marks (Hidden) */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <label className="font-semibold text-zinc-200">Private Identifying Marks (Protected)</label>
                </div>
                <textarea
                  rows={2}
                  value={formData.identifying_marks}
                  onChange={(e) => setFormData({ ...formData, identifying_marks: e.target.value })}
                  placeholder="Specific stickers, wallpaper, serial suffix, scratches. NEVER shown publicly; used only during claim verification."
                  className="w-full px-3 py-2 border border-zinc-800 rounded-lg resize-none bg-zinc-950/80 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Submit Lost Report</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
