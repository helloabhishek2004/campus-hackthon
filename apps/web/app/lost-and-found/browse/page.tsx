import React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from "@smart-campus/ui";
import { ArrowLeft, Search } from "lucide-react";

export default function BrowseLostFoundPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/lost-and-found"
        className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Lost & Found
      </Link>

      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Browse Campus Items
          </h1>
          <p className="text-sm text-slate-600">
            Search and filter active lost and found reports.
          </p>
        </div>
        <Badge variant="outline">Skeleton Directory</Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-600" />
            <CardTitle className="text-base">
              Directory Filter & Search
            </CardTitle>
          </div>
          <CardDescription>
            Category filters, zone/building selectors, date range, and keyword
            search.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-slate-500 border border-dashed rounded-lg">
            Item cards with masked private details and claim buttons will be
            populated here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
