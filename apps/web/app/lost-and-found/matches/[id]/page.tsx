"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button
} from "@smart-campus/ui";
import { ArrowLeft, CheckCircle, ShieldAlert } from "lucide-react";

export default function MatchReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const res = await fetch(`/api/lost-found/matches/single/${id}`);
            if (res.ok) {
                const data = await res.json();
                setMatch(data.match);
            }
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [id]);

  const handleClaim = async () => {
      if (!consent) return alert("You must agree to the privacy policy");
      setClaiming(true);
      try {
          const res = await fetch(`/api/lost-found/matches/${id}/claim`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ownerConsent: true })
          });
          if (res.ok) {
              const data = await res.json();
              router.push(`/lost-and-found/claims/${data.claim.id}`);
          } else {
              const data = await res.json();
              alert(data.error?.message || "Failed to start claim");
          }
      } catch (err) {
          console.error(err);
      } finally {
          setClaiming(false);
      }
  };

  if (loading) return <div className="p-8 text-center">Loading match details...</div>;
  if (!match) return <div className="p-8 text-center text-red-500">Match not found.</div>;

  const foundItem = match.found_item;
  const matchScore = (match.overall_score * 100).toFixed(0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
       <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Item
       </button>

       <Card className="border-purple-200">
          <CardHeader className="bg-purple-50 rounded-t-xl border-b border-purple-100 flex flex-row items-start justify-between">
             <div>
                <CardTitle className="text-purple-900 flex items-center gap-2">
                   <CheckCircle className="text-purple-600" />
                   AI Match Review
                </CardTitle>
                <p className="text-sm text-purple-700 mt-1">
                   Our system thinks this found item matches your lost report.
                </p>
             </div>
             <Badge className="bg-purple-600 text-white text-base py-1 px-3">
                 {matchScore}% Match
             </Badge>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
              
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Found Item Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                          <p className="text-slate-500 mb-1">Title</p>
                          <p className="font-medium">{foundItem.title}</p>
                      </div>
                      <div>
                          <p className="text-slate-500 mb-1">Found Location</p>
                          <p className="font-medium">{foundItem.location_description}</p>
                      </div>
                      <div className="col-span-2">
                          <p className="text-slate-500 mb-1">Public Description</p>
                          <p className="font-medium">{foundItem.public_description}</p>
                      </div>
                  </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex gap-3 text-orange-800">
                  <ShieldAlert className="shrink-0 mt-0.5" />
                  <div className="text-sm">
                      <p className="font-semibold mb-1">Before you claim</p>
                      <ul className="list-disc pl-4 space-y-1">
                          <li>You will need to answer a verification question set by the AI or the finder.</li>
                          <li>The finder will review your answer.</li>
                          <li>Your contact details will <b>only</b> be shared if the claim is approved.</li>
                      </ul>
                  </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                  <label className="flex items-start gap-3 cursor-pointer">
                      <input 
                         type="checkbox" 
                         className="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                         checked={consent}
                         onChange={(e) => setConsent(e.target.checked)}
                      />
                      <span className="text-sm text-slate-700">
                          I consent to starting the verification process and agree to share my contact information securely with the finder if this claim is approved.
                      </span>
                  </label>

                  <Button 
                     onClick={handleClaim} 
                     disabled={!consent || claiming} 
                     className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                      {claiming ? "Starting Claim..." : "Start Claim Process"}
                  </Button>
              </div>

          </CardContent>
       </Card>
    </div>
  );
}
