import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Pet,
  PetInsert,
  Session,
  SessionInsert,
  SessionStatus,
  ConversationTurn,
  ConversationTurnInsert,
  GeneratedAsset,
  GeneratedAssetInsert,
} from "../types.js";

// ─── Pets ─────────────────────────────────────────────────────────────────────

export async function createPet(
  db: SupabaseClient,
  data: PetInsert
): Promise<Pet> {
  const { data: row, error } = await db
    .from("pets")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`createPet failed: ${error.message}`);
  return row as Pet;
}

export async function getPetById(
  db: SupabaseClient,
  id: string
): Promise<Pet | null> {
  const { data, error } = await db
    .from("pets")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Pet;
}

export async function listPetsByOwner(
  db: SupabaseClient,
  ownerId: string
): Promise<Pet[]> {
  const { data, error } = await db
    .from("pets")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listPetsByOwner failed: ${error.message}`);
  return (data ?? []) as Pet[];
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(
  db: SupabaseClient,
  data: SessionInsert
): Promise<Session> {
  const { data: row, error } = await db
    .from("sessions")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`createSession failed: ${error.message}`);
  return row as Session;
}

export async function getSessionById(
  db: SupabaseClient,
  id: string
): Promise<Session | null> {
  const { data, error } = await db
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Session;
}

export async function updateSessionStatus(
  db: SupabaseClient,
  id: string,
  status: SessionStatus
): Promise<void> {
  const { error } = await db
    .from("sessions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`updateSessionStatus failed: ${error.message}`);
}

export async function listSessionsByOwner(
  db: SupabaseClient,
  ownerId: string
): Promise<Session[]> {
  const { data, error } = await db
    .from("sessions")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listSessionsByOwner failed: ${error.message}`);
  return (data ?? []) as Session[];
}

export async function listSessionsByPet(
  db: SupabaseClient,
  petId: string
): Promise<Session[]> {
  const { data, error } = await db
    .from("sessions")
    .select("*")
    .eq("pet_id", petId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listSessionsByPet failed: ${error.message}`);
  return (data ?? []) as Session[];
}

// ─── Conversation Turns ───────────────────────────────────────────────────────

export async function createConversationTurn(
  db: SupabaseClient,
  data: ConversationTurnInsert
): Promise<ConversationTurn> {
  const { data: row, error } = await db
    .from("conversation_turns")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`createConversationTurn failed: ${error.message}`);
  return row as ConversationTurn;
}

export async function getConversationTurns(
  db: SupabaseClient,
  sessionId: string
): Promise<ConversationTurn[]> {
  const { data, error } = await db
    .from("conversation_turns")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`getConversationTurns failed: ${error.message}`);
  return (data ?? []) as ConversationTurn[];
}

// ─── Generated Assets ─────────────────────────────────────────────────────────

export async function createGeneratedAsset(
  db: SupabaseClient,
  data: GeneratedAssetInsert
): Promise<GeneratedAsset> {
  const { data: row, error } = await db
    .from("generated_assets")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`createGeneratedAsset failed: ${error.message}`);
  return row as GeneratedAsset;
}

export async function listGeneratedAssetsForSession(
  db: SupabaseClient,
  sessionId: string
): Promise<GeneratedAsset[]> {
  const { data, error } = await db
    .from("generated_assets")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listGeneratedAssetsForSession failed: ${error.message}`);
  return (data ?? []) as GeneratedAsset[];
}
