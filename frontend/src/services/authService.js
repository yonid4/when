import api from "./api";
import { supabase } from "./supabaseClient";

export async function getGoogleAuthUrl() {
  const res = await api.get("/api/auth/google");
  return res.data;
}

export async function logout() {
  try {
    await api.get("/api/auth/logout");
  } finally {
    await supabase.auth.signOut();
  }
}

export async function me() {
  const res = await api.get("/api/auth/me");
  return res.data;
}


