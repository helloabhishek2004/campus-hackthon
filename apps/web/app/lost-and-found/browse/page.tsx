"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from "@smart-campus/ui";
import { Search, MapPin, Calendar, Image as ImageIcon } from "lucide-react";

type Item = {
  id: string;
  type: "lost" | "found";
  title: string;
  category: string;
  public_description: string;
  location_description: string;
  event_date: string;
  status: string;
  images: any[];
};

export default function BrowseItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "lost" | "found">("all");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        let url = "/api/lost-found/items";
        if (filterType !== "all") {
          url += `?type=${filterType}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setItems(data.items);
        }
      } catch (err) {
        console.error("Failed to fetch items:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [filterType]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Directory</h1>
          <p className="text-slate-500">Browse recently reported lost and found items across campus.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${filterType === "all" ? "bg-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            All Items
          </button>
          <button
             onClick={() => setFilterType("lost")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${filterType === "lost" ? "bg-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            Lost Only
          </button>
          <button
             onClick={() => setFilterType("found")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${filterType === "found" ? "bg-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            Found Only
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search items (not implemented yet)..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-xl" />
            ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-500">No open items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Link key={item.id} href={`/lost-and-found/items/${item.id}`} className="group block">
              <Card className="h-full transition-shadow hover:shadow-md overflow-hidden">
                <div className="h-48 bg-slate-100 flex items-center justify-center text-slate-400 relative">
                  {item.images && item.images.length > 0 ? (
                      // Note: Next/Image would be better but requires configured domains
                      <img src={item.images[0].public_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                      <ImageIcon className="w-12 h-12 opacity-50" />
                  )}
                  <div className="absolute top-3 left-3">
                     <Badge variant={item.type === "lost" ? "destructive" : "success"} className="shadow-sm">
                        {item.type === "lost" ? "Lost" : "Found"}
                     </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-1 group-hover:text-purple-600 transition-colors">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600 line-clamp-2 min-h-[40px]">
                    {item.public_description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1 max-w-[50%]">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{item.location_description}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>{format(new Date(item.event_date), "MMM d, h:mm a")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
