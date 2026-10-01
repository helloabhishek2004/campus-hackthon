"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button
} from "@smart-campus/ui";
import { ArrowLeft, MapPin, Calendar, Tag, Info, AlertTriangle } from "lucide-react";

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [item, setItem] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mocking current user ID for demonstration
  const currentUserId = "33333333-3333-3333-3333-333333330001";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/lost-found/items/${id}`);
        if (res.ok) {
          const data = await res.json();
          setItem(data.item);

          // If current user is the owner, fetch matches
          if (data.item.reporter_id === currentUserId) {
            const matchesRes = await fetch(`/api/lost-found/items/${id}/matches`);
            if (matchesRes.ok) {
              const matchesData = await matchesRes.json();
              setMatches(matchesData.matches);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch item details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!item) return <div className="p-8 text-center text-red-500">Item not found.</div>;

  const isOwner = item.reporter_id === currentUserId;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/lost-and-found/browse"
        className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Browse
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Col: Details */}
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant={item.type === "lost" ? "destructive" : "success"}>
                {item.type.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="capitalize">{item.status.replace('_', ' ')}</Badge>
            </div>
            <h1 className="text-3xl font-bold">{item.title}</h1>
          </div>

          {item.images?.length > 0 ? (
            <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
               <img src={item.images[0].public_url} alt={item.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-video bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400">
               No image provided
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <MapPin className="w-5 h-5 text-slate-400" />
                <div>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</p>
                   <p className="text-sm font-medium">{item.location_description}</p>
                </div>
             </div>
             <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</p>
                   <p className="text-sm font-medium">{format(new Date(item.event_date), "MMM d, yyyy - h:mm a")}</p>
                </div>
             </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <h3 className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
               <Info className="w-5 h-5" /> Description
            </h3>
            <p>{item.public_description}</p>
            
            {isOwner && item.private_description && (
               <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-purple-900 mb-1">
                     <AlertTriangle className="w-4 h-4" /> Private Description (Only visible to you & AI)
                  </h4>
                  <p className="text-sm text-purple-800 m-0">{item.private_description}</p>
               </div>
            )}
             {isOwner && item.identifying_marks && (
               <div className="mt-2 p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-purple-900 mb-1">
                     <AlertTriangle className="w-4 h-4" /> Identifying Marks (Only visible to you & AI)
                  </h4>
                  <p className="text-sm text-purple-800 m-0">{item.identifying_marks}</p>
               </div>
            )}
          </div>
        </div>

        {/* Right Col: Matches (if owner) */}
        {isOwner && (
          <div className="w-full md:w-80 space-y-4">
             <Card>
                <CardHeader className="bg-slate-50 border-b">
                   <CardTitle className="text-lg">AI Matches</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                   {matches.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">
                         No matches found yet. We'll notify you if something turns up.
                      </p>
                   ) : (
                      matches.map(match => {
                         const otherItem = item.type === "lost" ? match.found_item : match.lost_item;
                         if (!otherItem) return null;
                         
                         return (
                           <div key={match.id} className="border rounded-lg p-3 space-y-2 hover:border-purple-300 transition-colors cursor-pointer bg-white">
                              <div className="flex justify-between items-start">
                                 <h4 className="font-semibold text-sm line-clamp-1">{otherItem.title}</h4>
                                 <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 ml-2 shrink-0">
                                    {(match.overall_score * 100).toFixed(0)}% Match
                                 </Badge>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2">{otherItem.public_description}</p>
                              <div className="pt-2 border-t mt-2">
                                 <Link href={`/lost-and-found/matches/${match.id}`}>
                                    <Button size="sm" variant="outline" className="w-full text-xs">
                                       Review Match
                                    </Button>
                                 </Link>
                              </div>
                           </div>
                         )
                      })
                   )}
                </CardContent>
             </Card>
          </div>
        )}
      </div>
    </div>
  );
}
