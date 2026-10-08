import { createApplicationClient } from "@/lib/supabase/server";
import { readDb, writeDb, canTransition } from "@smart-campus/lost-and-found";

type ItemRow = Record<string, any>;
type ImageRow = Record<string, any>;
type MatchRow = Record<string, any>;

const configured = () => Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder"),
);

const mock = () => process.env.NODE_ENV === "test" || (!configured() && process.env.AUTH_MODE === "mock");

function assertMode() {
  if (!configured() && !mock()) {
    throw new Error("Lost & Found persistence requires Supabase configuration (or AUTH_MODE=mock).");
  }
}

function publicItem(item: ItemRow, images: ImageRow[] = []) {
  return {
    id: item.id, type: item.type, category: item.category, subcategory: item.subcategory ?? null,
    title: item.title, public_description: item.public_description,
    location_id: item.location_id ?? null, location_description: item.location_description ?? null,
    event_date: item.event_date, status: item.status, is_sensitive: Boolean(item.is_sensitive),
    created_at: item.created_at, updated_at: item.updated_at ?? item.created_at,
    images: images.filter((image) => !image.is_sensitive).map(({ storage_path: _storage, ...safe }) => safe),
  };
}

async function supabase() {
  assertMode();
  return createApplicationClient();
}

function checked<T extends { error: any; data: any }>(result: T, operation: string): NonNullable<T["data"]> {
  if (result.error) throw new Error(`Lost & Found ${operation} failed: ${result.error.message}`);
  return result.data as NonNullable<T["data"]>;
}

function mockRows() {
  const db = readDb();
  db.lost_found_items ??= [];
  db.lost_found_item_images ??= [];
  db.lost_found_matches ??= [];
  db.lost_found_item_events ??= [];
  return db;
}

export async function getClaim(id: string) {
  if (mock()) {
    const db = mockRows();
    const claim = db.lost_found_claims.find((c: any) => c.id === id);
    return claim ? { claim, item: db.lost_found_items.find((i: any) => i.id === claim.item_id), db } : null;
  }
  const client = await supabase();
  const result = await client.from("lost_found_claims").select("*, item:lost_found_items!item_id(*, lost_found_item_images(*)), match:lost_found_matches(*, found:lost_found_items!found_item_id(reporter_id))").eq("id", id).maybeSingle();
  const claim = checked(result, "claim read") as any;
  if (!claim) return null;
  if (claim.match?.found?.reporter_id) claim.finder_id = claim.match.found.reporter_id;
  return { claim, item: claim.item, match: claim.match };
}

export async function createClaim(input: { matchId: string; claimantId: string; claimText: string }) {
  if (mock()) {
    const db = mockRows(); const match = db.lost_found_matches.find((m: any) => m.id === input.matchId);
    if (!match) return null;
    const lost = db.lost_found_items.find((i: any) => i.id === match.lost_item_id); const found = db.lost_found_items.find((i: any) => i.id === match.found_item_id);
    if (!lost || !found) return null;
    if (db.lost_found_claims.some((c: any) => c.match_id === input.matchId && ["pending", "approved", "handover"].includes(c.status))) throw new Error("A claim already exists for this match");
    const claim = { id: crypto.randomUUID(), item_id: found.id, claimant_id: input.claimantId, finder_id: found.reporter_id, match_id: input.matchId, status: "pending", claim_text: input.claimText, handover_mode: "campus_security", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    db.lost_found_claims.push(claim); lost.status = "in_claim"; found.status = "in_claim";
    db.lost_found_item_events.push({ id: crypto.randomUUID(), item_id: found.id, event_type: "claim_created", actor_id: input.claimantId, details: { claim_id: claim.id }, created_at: new Date().toISOString() }); writeDb(db); return claim;
  }
  const client = await supabase();
  const match = checked(await client.from("lost_found_matches").select("*, lost:lost_found_items!lost_item_id(*), found:lost_found_items!found_item_id(*)").eq("id", input.matchId).maybeSingle(), "match read") as any;
  if (!match?.lost || !match?.found) return null;
  const existing = checked(await client.from("lost_found_claims").select("id").eq("match_id", input.matchId).in("status", ["pending", "approved", "handover"]).limit(1), "claim duplicate check") as any[];
  if (existing.length) throw new Error("A claim already exists for this match");
  const claim = checked(await client.from("lost_found_claims").insert({ item_id: match.found.id, claimant_id: input.claimantId, match_id: input.matchId, status: "pending", claim_text: input.claimText }).select().single(), "claim insert") as any;
  for (const item of [match.lost, match.found]) {
    if (!canTransition(item.status, "in_claim")) throw new Error(`Illegal state transition from '${item.status}' to 'in_claim'`);
    checked(await client.from("lost_found_items").update({ status: "in_claim", updated_at: new Date().toISOString() }).eq("id", item.id).eq("status", item.status), "claim item update");
    checked(await client.from("lost_found_item_events").insert({ item_id: item.id, event_type: "claim_created", actor_id: input.claimantId, details: { claim_id: claim.id } }), "claim event insert");
  }
  return { ...claim, finder_id: match.found.reporter_id };
}

export async function saveClaimAnswers(id: string, claimantId: string, answers: unknown) {
  if (mock()) { const db = mockRows(); const c = db.lost_found_claims.find((x: any) => x.id === id); if (!c) return null; if (c.claimant_id !== claimantId) throw new Error("Forbidden"); c.verification_answers = answers; c.updated_at = new Date().toISOString(); writeDb(db); return c; }
  const client = await supabase(); return checked(await client.from("lost_found_claims").update({ verification_answers: answers, updated_at: new Date().toISOString() }).eq("id", id).eq("claimant_id", claimantId).select().maybeSingle(), "verification answer update");
}

export async function decideClaim(id: string, actorId: string, decision: "approved" | "rejected", notes?: string) {
  if (mock()) { const db = mockRows(); const c = db.lost_found_claims.find((x: any) => x.id === id); if (!c) return null; if (c.status !== "pending") throw new Error(`Claim is already ${c.status}`); c.status = decision; c.decision_notes = notes; c.decided_by = actorId; c.decided_at = new Date().toISOString(); c.updated_at = c.decided_at; const item = db.lost_found_items.find((i: any) => i.id === c.item_id); if (item) item.status = decision === "approved" ? "handover" : "open"; writeDb(db); return c; }
  const client = await supabase();
  const current = await getClaim(id); if (!current) return null;
  const item = current.item as any; const next = decision === "approved" ? "handover" : "open";
  if (!item || !canTransition(item.status, next)) throw new Error(`Illegal state transition from '${item?.status}' to '${next}'`);
  const claim = checked(await client.from("lost_found_claims").update({ status: decision, decision_notes: notes ?? null, decided_by: actorId, decided_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).eq("status", "pending").select().maybeSingle(), "claim decision update");
  if (!claim) throw new Error("Claim is no longer pending");
  checked(await client.from("lost_found_items").update({ status: next, updated_at: new Date().toISOString() }).eq("id", item.id).eq("status", item.status), "decision item update");
  checked(await client.from("lost_found_item_events").insert({ item_id: item.id, event_type: `claim_${decision}`, actor_id: actorId, details: { claim_id: id, notes: notes ?? null } }), "decision event insert"); return claim;
}

export async function handoverClaim(id: string, actorId: string, mode: string) {
  if (mock()) { const db = mockRows(); const c = db.lost_found_claims.find((x: any) => x.id === id); if (!c) return null; if (![c.claimant_id, c.finder_id].includes(actorId)) throw new Error("Forbidden"); if (c.status !== "approved") throw new Error("Claim must be approved before handover"); c.status = "handover"; c.handover_mode = mode; c.updated_at = new Date().toISOString(); writeDb(db); return c; }
  const client = await supabase(); const current = await getClaim(id); if (!current) return null; const c = current.claim as any; if (c.claimant_id !== actorId) throw new Error("Forbidden"); if (c.status !== "approved") throw new Error("Claim must be approved before handover"); return checked(await client.from("lost_found_claims").update({ status: "handover", handover_mode: mode, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "approved").select().maybeSingle(), "handover update");
}

export async function updateItemStatus(id: string, actorId: string, next: string) {
  if (mock()) { const db = mockRows(); const i = db.lost_found_items.find((x: any) => x.id === id); if (!i) return null; if (!canTransition(i.status, next as any)) throw new Error(`Illegal state transition from '${i.status}' to '${next}'`); i.status = next; db.lost_found_item_events.push({ id: crypto.randomUUID(), item_id: id, event_type: "status_changed", actor_id: actorId, details: { nextStatus: next }, created_at: new Date().toISOString() }); writeDb(db); return i; }
  const client = await supabase(); const i = checked(await client.from("lost_found_items").select("id,status").eq("id", id).maybeSingle(), "item read") as any; if (!i) return null; if (!canTransition(i.status, next as any)) throw new Error(`Illegal state transition from '${i.status}' to '${next}'`); const updated = checked(await client.from("lost_found_items").update({ status: next, updated_at: new Date().toISOString() }).eq("id", id).eq("status", i.status).select("id,status").maybeSingle(), "item status update"); if (!updated) throw new Error("Item status changed concurrently"); checked(await client.from("lost_found_item_events").insert({ item_id: id, event_type: "status_changed", actor_id: actorId, details: { previousStatus: i.status, nextStatus: next } }), "status event insert"); return updated;
}

export async function dismissMatch(id: string, actorId: string) {
  if (mock()) { const db = mockRows(); const m = db.lost_found_matches.find((x: any) => x.id === id); if (!m) return null; m.is_dismissed = true; m.dismissed_at = new Date().toISOString(); m.dismissed_by = actorId; writeDb(db); return m; }
  const client = await supabase(); return checked(await client.from("lost_found_matches").update({ is_dismissed: true, dismissed_by: actorId }).eq("id", id).eq("is_dismissed", false).select().maybeSingle(), "match dismissal");
}

export async function revealContact(id: string, actorId: string) {
  const current = await getClaim(id); if (!current) return null; const c = current.claim as any; const party = c.claimant_id === actorId ? (c.finder_id ?? (current.match as any)?.found_item_id) : c.claimant_id;
  if (mock()) { const db = mockRows(); db.lost_found_contact_reveals.push({ id: crypto.randomUUID(), claim_id: id, revealed_to: actorId, revealed_party_id: party, reason: "Handover facilitation", expires_at: c.contact_window_expires_at ?? new Date(Date.now() + 86400000).toISOString(), created_at: new Date().toISOString() }); writeDb(db); return true; }
  const client = await supabase(); checked(await client.from("lost_found_contact_reveals").insert({ claim_id: id, revealed_to: actorId, revealed_party_id: party, reason: "Handover facilitation", expires_at: new Date(Date.now() + 86400000).toISOString() }), "contact reveal"); return true;
}

export async function listLogs() {
  if (mock()) { const db = mockRows(); return [...(db.lost_found_contact_reveals ?? []).map((r: any) => ({ id: r.id, type: "contact_reveal", created_at: r.created_at, action: `Contact Info Revealed: ${r.reason}`, actor_id: `Authorized By: ${r.revealed_to}` })), ...(db.lost_found_item_events ?? []).map((e: any) => ({ id: e.id, type: "item_event", created_at: e.created_at, action: `Item ${e.event_type.toUpperCase()}`, actor_id: `Actor: ${e.actor_id}` }))].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)); }
  const client = await supabase(); const [events, reveals, claims] = await Promise.all([client.from("lost_found_item_events").select("*"), client.from("lost_found_contact_reveals").select("*"), client.from("lost_found_claims").select("id,match_id,claimant_id,created_at")]); const rows = [...checked(events, "event logs"), ...checked(reveals, "reveal logs"), ...checked(claims, "claim logs")].map((r: any) => ({ id: r.id, type: r.event_type ? "item_event" : r.claim_id ? "contact_reveal" : "claim", created_at: r.created_at, action: r.event_type ? `Item ${r.event_type.toUpperCase()}` : r.claim_id ? `Contact Info Revealed: ${r.reason}` : `Claim filed for match ${r.match_id}`, actor_id: r.actor_id ?? r.revealed_to ?? r.claimant_id })); return rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

export async function listItems(filters: {
  type?: string | null; category?: string | null; status?: string | null; q?: string | null;
  page?: number; limit?: number;
}) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  if (mock()) {
    const db = mockRows();
    let rows = [...db.lost_found_items];
    rows = filters.status && filters.status !== "all" ? rows.filter((r: ItemRow) => r.status === filters.status) :
      !filters.status ? rows.filter((r: ItemRow) => r.status === "open" || r.status === "processing") : rows;
    if (filters.type) rows = rows.filter((r: ItemRow) => r.type === filters.type);
    if (filters.category) rows = rows.filter((r: ItemRow) => r.category === filters.category);
    if (filters.q) { const q = filters.q.toLowerCase(); rows = rows.filter((r: ItemRow) => `${r.title} ${r.public_description} ${r.location_description ?? ""}`.toLowerCase().includes(q)); }
    rows.sort((a: ItemRow, b: ItemRow) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const total = rows.length;
    rows = rows.slice((page - 1) * limit, page * limit);
    return { items: rows.map((r: ItemRow) => publicItem(r, db.lost_found_item_images.filter((i: ImageRow) => i.item_id === r.id))), total, page, limit };
  }
  const client = await supabase();
  let query = client.from("lost_found_items").select("*, lost_found_item_images(*)", { count: "exact" }).order("created_at", { ascending: false });
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  else if (!filters.status) query = query.in("status", ["open", "processing"]);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.q) query = query.or(`title.ilike.%${filters.q}%,public_description.ilike.%${filters.q}%,location_description.ilike.%${filters.q}%`);
  const result = await query.range((page - 1) * limit, page * limit - 1);
  const rows = checked(result, "item list");
  return { items: rows.map((r: ItemRow) => publicItem(r, r.lost_found_item_images ?? [])), total: result.count ?? rows.length, page, limit };
}

export async function getItem(id: string) {
  if (mock()) { const db = mockRows(); const item = db.lost_found_items.find((r: ItemRow) => r.id === id); return item ? { row: item, public: publicItem(item, db.lost_found_item_images.filter((i: ImageRow) => i.item_id === id)) } : null; }
  const client = await supabase();
  const result = await client.from("lost_found_items").select("*, lost_found_item_images(*)").eq("id", id).maybeSingle();
  const row = checked(result, "item read");
  return row ? { row, public: publicItem(row, row.lost_found_item_images ?? []) } : null;
}

export async function createItem(input: { reporter_id: string; type: "lost" | "found"; category: string; subcategory?: string; title: string; public_description: string; private_description?: string; identifying_marks?: string; location_id?: string; location_description?: string; event_date: string; is_sensitive: boolean; images?: ImageRow[] }) {
  const { images = [], ...item } = input;
  const id = crypto.randomUUID();
  if (mock()) {
    const db = mockRows(); const row = { ...item, id, status: "processing", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    db.lost_found_items.push(row);
    db.lost_found_item_images.push(...images.map((image, index) => ({ ...image, id: image.id ?? crypto.randomUUID(), item_id: id, storage_path: image.storage_path ?? image.public_url, is_primary: image.is_primary ?? index === 0, is_sensitive: image.is_sensitive ?? false, created_at: new Date().toISOString() })));
    db.lost_found_item_events.push({ id: crypto.randomUUID(), item_id: id, event_type: "created", actor_id: input.reporter_id, details: {}, created_at: new Date().toISOString() }); writeDb(db);
    return { row, public: publicItem(row, db.lost_found_item_images.filter((i: ImageRow) => i.item_id === id)) };
  }
  const client = await supabase();
  const row = checked(await client.from("lost_found_items").insert({ ...item, id, status: "processing" }).select().single(), "item insert");
  // Image storage remains owned by the existing caller/storage integration; this
  // persistence layer records supplied URLs and does not upload or transform them.
  if (images.length) checked(await client.from("lost_found_item_images").insert(images.map((image, index) => ({ ...image, item_id: id, storage_path: image.storage_path ?? image.public_url, is_primary: image.is_primary ?? index === 0, is_sensitive: image.is_sensitive ?? false }))), "image insert");
  checked(await client.from("lost_found_item_events").insert({ item_id: id, event_type: "created", actor_id: input.reporter_id, details: {} }), "event insert");
  return { row, public: publicItem(row, images) };
}

export async function getMatchesForItem(id: string) {
  if (mock()) { const db = mockRows(); return db.lost_found_matches.filter((m: MatchRow) => m.lost_item_id === id || m.found_item_id === id).map((m: MatchRow) => ({ ...m, lost: db.lost_found_items.find((i: ItemRow) => i.id === m.lost_item_id), found: db.lost_found_items.find((i: ItemRow) => i.id === m.found_item_id) })); }
  const client = await supabase();
  const result = await client.from("lost_found_matches").select("*, lost:lost_found_items!lost_item_id(*, lost_found_item_images(*)), found:lost_found_items!found_item_id(*, lost_found_item_images(*))").or(`lost_item_id.eq.${id},found_item_id.eq.${id}`);
  return checked(result, "match list");
}

export async function getMatch(id: string) {
  if (mock()) { const db = mockRows(); const m = db.lost_found_matches.find((r: MatchRow) => r.id === id); return m ? { ...m, lost: db.lost_found_items.find((i: ItemRow) => i.id === m.lost_item_id), found: db.lost_found_items.find((i: ItemRow) => i.id === m.found_item_id) } : null; }
  const client = await supabase();
  return checked(await client.from("lost_found_matches").select("*, lost:lost_found_items!lost_item_id(*, lost_found_item_images(*)), found:lost_found_items!found_item_id(*, lost_found_item_images(*))").eq("id", id).maybeSingle(), "match read");
}

export { publicItem };
