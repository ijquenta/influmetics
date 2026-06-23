import { createClient } from "./client";

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  role: string;
  company: string;
  country: string;
  created_at: string;
  updated_at: string;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return data;
}
