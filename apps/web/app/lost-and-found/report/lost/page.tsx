"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@smart-campus/ui";
import { ArrowLeft, Camera, Loader2, X } from "lucide-react";

export default function ReportLostItemPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<{file: File, preview: string}[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    category: "electronics",
    subcategory: "",
    public_description: "",
    identifying_marks: "",
    location_description: "",
    event_date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDThh:mm
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, 3);
      const fileObjects = selectedFiles.map(file => ({
          file,
          preview: URL.createObjectURL(file)
      }));
      setFiles(prev => [...prev, ...fileObjects].slice(0, 3));
    }
  };

  const removeFile = (index: number) => {
      setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const base64Images = await Promise.all(files.map(f => toBase64(f.file)));

      const res = await fetch("/api/lost-found/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "lost",
          ...formData,
          images: base64Images.map(b64 => ({ public_url: b64, storage_path: "base64" }))
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to submit");
      }

      const data = await res.json();
      router.push(`/lost-and-found/success?type=lost&id=${data.item.id}`);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/lost-and-found"
        className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Lost & Found
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Report a Lost Item</CardTitle>
          <CardDescription>
            Submit details and images of an item you lost on campus to initiate automated multimodal matching.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5 text-sm">
            
            <div className="space-y-3">
              <label className="font-semibold text-slate-700">Photos (max 3)</label>
              
              {files.length > 0 && (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                      {files.map((f, i) => (
                          <div key={i} className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200">
                              <img src={f.preview} alt="preview" className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                                  <X className="w-3 h-3" />
                              </button>
                          </div>
                      ))}
                  </div>
              )}

              {files.length < 3 && (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition cursor-pointer relative">
                    <Camera className="w-8 h-8 mb-2 text-slate-400" />
                    <span>Tap to take photos or browse</span>
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

            <div className="space-y-2">
              <label className="font-semibold text-slate-700">Item Title</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Black Dell Laptop, Blue Water Bottle"
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-semibold text-slate-700">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              <div className="space-y-2">
                <label className="font-semibold text-slate-700">When was it lost?</label>
                <input
                  required
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-700">Where was it lost?</label>
              <input
                required
                type="text"
                value={formData.location_description}
                onChange={(e) => setFormData({...formData, location_description: e.target.value})}
                placeholder="e.g. Library 2nd floor, Canteen"
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-700">Public Description</label>
              <textarea
                required
                rows={3}
                value={formData.public_description}
                onChange={(e) => setFormData({...formData, public_description: e.target.value})}
                placeholder="Describe the item. This will be visible to everyone."
                className="w-full px-3 py-2 border border-slate-300 rounded-md resize-none bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-700">Identifying Marks (Hidden)</label>
              <textarea
                rows={2}
                value={formData.identifying_marks}
                onChange={(e) => setFormData({...formData, identifying_marks: e.target.value})}
                placeholder="Any scratches, stickers, or serial numbers. Visible only to security and you."
                className="w-full px-3 py-2 border border-slate-300 rounded-md resize-none bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Lost Report
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
