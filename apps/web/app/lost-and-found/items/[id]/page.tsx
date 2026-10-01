import React from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from "@smart-campus/ui";
import { ArrowLeft, Shield } from "lucide-react";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/lost-and-found/browse"
        className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Item Details: {id}</CardTitle>
            <Badge variant="outline">Item View</Badge>
          </div>
          <CardDescription>
            Detailed view with privacy redaction and verified claim initiation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-50 border rounded-lg text-sm text-slate-600">
            <p className="flex items-center gap-2 font-medium text-slate-800 mb-2">
              <Shield className="w-4 h-4 text-purple-600" /> Privacy Notice
            </p>
            <p className="text-xs">
              Private verification attributes and sensitive photos are redacted
              for unverified viewers.
            </p>
          </div>
          <Button disabled className="w-full">
            File Ownership Claim (Awaiting Implementation)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
