import api from "./api.js";
import { supabase } from "./supabaseClient.js";

export async function getGoogleAuthUrl() {
  const response = await api.get("/api/auth/google");
  return response.data;
}

export async function logout() {
  await api.get("/api/auth/logout").catch(() => {});
  await supabase.auth.signOut();
}

export async function me() {
  const response = await api.get("/api/auth/me");
  return response.data;
}
