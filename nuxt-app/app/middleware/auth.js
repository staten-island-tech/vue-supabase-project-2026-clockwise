import { supabase } from "../lib/supabase";

export default defineNuxtRouteMiddleware(async () => {
  if (process.server) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return navigateTo("/");
  }
});
