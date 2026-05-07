import type { SupabaseClient } from "@supabase/supabase-js";
import type { Persona, PersonaInsert } from "../types.js";

export async function createPersona(
  db: SupabaseClient,
  data: PersonaInsert
): Promise<Persona> {
  const { data: row, error } = await db
    .from("personas")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`createPersona failed: ${error.message}`);
  return row as Persona;
}

export async function getPersonaById(
  db: SupabaseClient,
  id: string
): Promise<Persona | null> {
  const { data, error } = await db
    .from("personas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Persona;
}

export async function listPersonas(db: SupabaseClient): Promise<Persona[]> {
  const { data, error } = await db
    .from("personas")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`listPersonas failed: ${error.message}`);
  return (data ?? []) as Persona[];
}
