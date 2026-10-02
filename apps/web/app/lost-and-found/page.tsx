"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@smart-campus/ui";
import { Search, PlusCircle, CheckCircle } from "lucide-react";

export default function LostAndFoundDashboard() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Smart Campus <span className="text-purple-600">Lost & Found</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Report lost items or help reunite found items with their owners using our secure, AI-powered matching system.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 pt-8">
        <Link href="/lost-and-found/report/lost" className="group">
          <Card className="h-full transition-all hover:border-purple-300 hover:shadow-md bg-gradient-to-br from-white to-purple-50/50">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <CardTitle>I Lost Something</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm">
                Submit a report with details and photos. Our AI will notify you when a match is found.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/lost-and-found/report/found" className="group">
          <Card className="h-full transition-all hover:border-emerald-300 hover:shadow-md bg-gradient-to-br from-white to-emerald-50/50">
            <CardHeader>
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PlusCircle className="w-6 h-6" />
              </div>
              <CardTitle>I Found Something</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm">
                Report an item you found. Keep private details hidden to verify the true owner.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/lost-and-found/browse" className="group">
          <Card className="h-full transition-all hover:border-blue-300 hover:shadow-md bg-gradient-to-br from-white to-blue-50/50">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6" />
              </div>
              <CardTitle>Browse Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm">
                View the directory of all recently found and lost items across the campus.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
