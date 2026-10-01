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
import { ArrowLeft, Clock, CheckCircle2, XCircle, Users } from "lucide-react";

export default function ClaimReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<any>(null);

  // Mocking current user ID
  const currentUserId = "33333333-3333-3333-3333-333333330001";

  useEffect(() => {
    const fetchData = async () => {
        try {
            // Need a single claim fetch API. Wait, do we have one?
            // Let's create one or just use a mock for now.
            const res = await fetch(`/api/lost-found/claims/single/${id}`);
            if (res.ok) {
                const data = await res.json();
                setClaim(data.claim);
                
                if (data.claim.status === 'approved') {
                    const contactRes = await fetch(`/api/lost-found/claims/${id}/contact`);
                    if (contactRes.ok) {
                        const contactData = await contactRes.json();
                        setContact(contactData);
                    }
                }
            }
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [id]);

  const handleDecision = async (decision: 'approved' | 'rejected') => {
      try {
          const res = await fetch(`/api/lost-found/claims/${id}/decide`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ decision, notes: "Automated decision from UI" })
          });
          if (res.ok) {
              window.location.reload();
          } else {
              const data = await res.json();
              alert(data.error?.message || "Failed");
          }
      } catch (err) {
          console.error(err);
      }
  };

  if (loading) return <div className="p-8 text-center">Loading claim details...</div>;
  if (!claim) return <div className="p-8 text-center text-red-500">Claim not found.</div>;

  const isOwner = claim.claimant_id === currentUserId;
  const isFinder = claim.item?.reporter_id === currentUserId;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
       <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
       </button>

       <Card>
          <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between">
             <CardTitle>Claim Status</CardTitle>
             <Badge variant={
                 claim.status === 'approved' ? 'success' : 
                 claim.status === 'rejected' ? 'destructive' : 'default'
             } className="uppercase">
                 {claim.status.replace('_', ' ')}
             </Badge>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
              
              {/* State: Pending */}
              {claim.status === 'pending' && (
                  <div className="text-center py-6 space-y-4">
                      <Clock className="w-12 h-12 text-amber-500 mx-auto" />
                      <div>
                          <h3 className="font-semibold text-lg">Verification Pending</h3>
                          <p className="text-slate-600 text-sm">
                             {isOwner 
                               ? "Waiting for the finder to review your claim and ask a verification question."
                               : "A user is claiming this item. Review their request."}
                          </p>
                      </div>
                      
                      {isFinder && (
                          <div className="flex gap-3 justify-center pt-4 border-t mt-4">
                              <Button onClick={() => handleDecision('rejected')} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">Reject Claim</Button>
                              <Button onClick={() => handleDecision('approved')} className="bg-emerald-600 hover:bg-emerald-700 text-white">Approve Claim</Button>
                          </div>
                      )}
                  </div>
              )}

              {/* State: Approved */}
              {claim.status === 'approved' && (
                  <div className="space-y-6">
                      <div className="text-center py-4">
                          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                          <h3 className="font-semibold text-lg">Claim Approved!</h3>
                          <p className="text-slate-600 text-sm">Please coordinate the handover.</p>
                      </div>

                      {contact && (
                          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-3">
                              <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                                  <Users className="w-5 h-5" /> Contact Details Revealed
                              </h4>
                              {contact.mode === "in_person" ? (
                                  <div className="bg-white p-3 rounded-lg border border-blue-100 text-sm">
                                      <p className="text-slate-500 mb-1">{contact.contact.name}</p>
                                      <p className="font-mono text-lg font-medium text-slate-800">{contact.contact.phone}</p>
                                  </div>
                              ) : (
                                  <div className="bg-white p-3 rounded-lg border border-blue-100 text-sm">
                                      <p>Please proceed to <b>{contact.mode === 'campus_security' ? 'Campus Security Desk' : 'Department Office'}</b> to complete the handover.</p>
                                  </div>
                              )}
                              <p className="text-xs text-blue-700">These details are logged and will expire in 14 days.</p>
                          </div>
                      )}
                  </div>
              )}

              {/* State: Rejected */}
              {claim.status === 'rejected' && (
                  <div className="text-center py-6 space-y-4">
                      <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                      <div>
                          <h3 className="font-semibold text-lg">Claim Rejected</h3>
                          <p className="text-slate-600 text-sm">
                             The finder has rejected this claim.
                          </p>
                      </div>
                  </div>
              )}
          </CardContent>
       </Card>
    </div>
  );
}
