import crypto from "crypto";
import {
  ComplaintRecord,
  CreateComplaintRequest,
  COMPLAINT_EMERGENCY_THRESHOLD,
  ComplaintAttachment,
} from "@smart-campus/contracts";
import { findMatchingCluster, ExistingComplaintCandidate } from "./similarity-service";
import { createApplicationClient, createServiceClient } from "../supabase/server";

// Fallback in-memory store for offline/local hackathon mock mode
const inMemoryComplaints: ComplaintRecord[] = [
  {
    id: "cmp-seed-001",
    text: "Ceiling fan making strange squeaking noise and wobbling in Room 102.",
    status: "submitted",
    category: "infrastructure",
    subcategory: "electrical",
    location_building: "Block A",
    location_room: "102",
    attachments: [],
    cluster_id: "cluster_fan_102",
    is_emergency: false,
    similar_count: 1,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "cmp-seed-002",
    text: "Wi-Fi not accessible in Central Library 2nd floor reading hall.",
    status: "in_progress",
    category: "it_services",
    subcategory: "network",
    location_building: "Library",
    location_room: "Reading Hall 2",
    attachments: [],
    cluster_id: "cluster_wifi_lib",
    is_emergency: false,
    similar_count: 2,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "cmp-seed-003",
    text: "Cannot connect to campus wifi in library second floor.",
    status: "submitted",
    category: "it_services",
    subcategory: "network",
    location_building: "Library",
    location_room: "Reading Hall 2",
    attachments: [],
    cluster_id: "cluster_wifi_lib",
    is_emergency: false,
    similar_count: 2,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

function isSupabaseConfigured(): boolean {
  if (process.env.NODE_ENV === "test") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes("placeholder") &&
      !key.includes("placeholder") &&
      url.startsWith("http"),
  );
}

/**
 * Recomputes dynamic similar_count for all complaints in memory
 * based on the number of complaints sharing each cluster_id.
 */
function recalculateClusterCounts(records: ComplaintRecord[]): ComplaintRecord[] {
  const clusterCounts = new Map<string, number>();

  for (const r of records) {
    const count = (clusterCounts.get(r.cluster_id) || 0) + 1;
    clusterCounts.set(r.cluster_id, count);
  }

  return records.map((r) => {
    const count = clusterCounts.get(r.cluster_id) || 1;
    const isEmergency = count >= COMPLAINT_EMERGENCY_THRESHOLD;
    return {
      ...r,
      similar_count: count,
      is_emergency: isEmergency,
    };
  });
}

/**
 * Fetches all complaints and recalculates real-time group counts & emergency status.
 */
export async function getComplaints(
  view: "all" | "normal" | "emergency" = "all",
  viewer?: { userId: string; canViewAll: boolean },
): Promise<{
  complaints: ComplaintRecord[];
  counts: { total: number; normal: number; emergency: number };
}> {
  let records: ComplaintRecord[] = [];

  if (isSupabaseConfigured()) {
    try {
       const supabase = await createApplicationClient();
      let query = supabase.from("complaints").select("*");
      if (viewer && !viewer.canViewAll) query = query.eq("complainant_id", viewer.userId);
      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Complaint read failed: ${error.message}`);
      }
      if (data) {
        records = data.map((d: any) => ({
          id: d.id,
          complainant_id: d.complainant_id,
          text: d.text,
          status: d.status || "submitted",
          category: d.category,
          subcategory: d.subcategory,
          location_building: d.location_building,
          location_room: d.location_room,
          attachments: (d.attachments as ComplaintAttachment[]) || [],
          cluster_id: d.cluster_id || `cluster_${d.id}`,
          is_emergency: Boolean(d.is_emergency),
          similar_count: 1, // Will be recalculated below
          created_at: d.created_at,
          updated_at: d.updated_at,
        }));
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error("Complaint read failed");
    }
  } else {
    records = viewer && !viewer.canViewAll
      ? inMemoryComplaints.filter((record) => record.complainant_id === viewer.userId)
      : [...inMemoryComplaints];
  }

  // Calculate real-time counts from cluster_id
  const calculated = recalculateClusterCounts(records);

  // Compute summary stats
  const total = calculated.length;
  const emergency = calculated.filter((c) => c.is_emergency).length;
  const normal = total - emergency;

  // Filter based on requested view
  let filtered = calculated;
  if (view === "normal") {
    filtered = calculated.filter((c) => !c.is_emergency);
  } else if (view === "emergency") {
    filtered = calculated.filter((c) => c.is_emergency);
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    complaints: filtered,
    counts: { total, normal, emergency },
  };
}

/**
 * Creates a complaint with automatic text-only clustering and 5-item emergency transition.
 */
export async function createComplaint(data: CreateComplaintRequest): Promise<{
  complaint: ComplaintRecord;
  cluster: {
    cluster_id: string;
    group_count: number;
    is_emergency: boolean;
  };
}> {
  // 1. Get all current complaints for candidate matching
  const { complaints: allComplaints } = await getComplaints("all");

  const candidates: ExistingComplaintCandidate[] = allComplaints.map((c) => ({
    id: c.id,
    text: c.text,
    cluster_id: c.cluster_id,
  }));

  // 2. Perform text-only similarity matching (NO image ML)
  const matchResult = findMatchingCluster(data.text, candidates);
  const targetClusterId = matchResult.cluster_id;

  // 3. Calculate cluster count after this new complaint is added
  const existingGroupMembers = allComplaints.filter(
    (c) => c.cluster_id === targetClusterId,
  );
  const newGroupCount = existingGroupMembers.length + 1;
  const isEmergency = newGroupCount >= COMPLAINT_EMERGENCY_THRESHOLD;

  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  const newRecord: ComplaintRecord = {
    id: newId,
    complainant_id: data.complainant_id || null,
    text: data.text,
    status: "submitted",
    category: data.category || "other",
    subcategory: null,
    location_building: data.location_building || null,
    location_room: data.location_room || null,
    attachments: data.attachments || [],
    cluster_id: targetClusterId,
    is_emergency: isEmergency,
    similar_count: newGroupCount,
    created_at: now,
    updated_at: now,
  };

  // 4. Persistence
  if (isSupabaseConfigured()) {
    try {
       const supabase = await createApplicationClient();

      // If threshold reached, invoke safe SECURITY DEFINER function to cascade emergency state
      if (isEmergency) {
        const { error: rpcError } = await createServiceClient().rpc("cascade_complaint_emergency", {
          target_cluster_id: targetClusterId,
        });

        if (rpcError) throw new Error(`Complaint emergency cascade failed: ${rpcError.message}`);
      }

      const { error: insertError } = await supabase.from("complaints").insert({
        id: newRecord.id,
        complainant_id: newRecord.complainant_id,
        text: newRecord.text,
        status: newRecord.status,
        category: newRecord.category,
        location_building: newRecord.location_building,
        location_room: newRecord.location_room,
        attachments: newRecord.attachments,
        cluster_id: newRecord.cluster_id,
        is_emergency: newRecord.is_emergency,
        created_at: newRecord.created_at,
        updated_at: newRecord.updated_at,
      });
      if (insertError) {
        throw new Error(`Complaint persistence failed: ${insertError.message}`);
      }
    } catch (err) {
      // Do not report success or silently diverge from the database when a
      // configured backend rejects the write. Similarity was computed above,
      // but persistence must remain truthful.
      throw err instanceof Error ? err : new Error("Complaint persistence failed");
    }
  } else {
    persistToMemory(newRecord, targetClusterId, isEmergency);
  }

  return {
    complaint: newRecord,
    cluster: {
      cluster_id: targetClusterId,
      group_count: newGroupCount,
      is_emergency: isEmergency,
    },
  };
}

function persistToMemory(
  newRecord: ComplaintRecord,
  targetClusterId: string,
  isEmergency: boolean,
) {
  // If emergency threshold is crossed, update existing cluster peers
  if (isEmergency) {
    for (const item of inMemoryComplaints) {
      if (item.cluster_id === targetClusterId) {
        item.is_emergency = true;
      }
    }
  }

  inMemoryComplaints.unshift(newRecord);
}

/**
 * Helper to reset in-memory store for tests
 */
export function _resetStoreForTesting(initialRecords: ComplaintRecord[] = []) {
  inMemoryComplaints.length = 0;
  inMemoryComplaints.push(...initialRecords);
}
