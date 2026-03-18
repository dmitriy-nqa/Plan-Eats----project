import "server-only";

import { createClient } from "@supabase/supabase-js";

export function readEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];

    if (value) {
      return value;
    }
  }

  throw new Error(`Missing required environment variable: ${names.join(" or ")}`);
}

export function getSupabaseConfigurationError() {
  try {
    readEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
    readEnv("SUPABASE_SERVICE_ROLE_KEY");
    readEnv("PLAN_EAT_FAMILY_ID");

    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Supabase configuration is missing.";
  }
}

export function isSupabaseConfigured() {
  return getSupabaseConfigurationError() === null;
}

export function getSupabaseServerClient() {
  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getCurrentFamilyId() {
  return readEnv("PLAN_EAT_FAMILY_ID");
}
