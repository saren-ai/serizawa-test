import { createClient } from "@/lib/supabase/server";
import type { User, UserRole } from "@/lib/supabase/types";

/**
 * Fetch the current authenticated user's profile row from the users table.
 * Returns null if not authenticated or profile doesn't exist yet.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  return data ?? null;
}

/** Returns the current user's role, or 'member' for anonymous visitors. */
export async function getCurrentRole(): Promise<UserRole> {
  const user = await getCurrentUser();
  return user?.role ?? "member";
}

export async function isLoggedIn(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

export async function isCritic(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.is_critic ?? false;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.is_admin ?? false;
}

/**
 * Require admin role in API routes.
 * Throws a Response with 403 if the user is not an admin.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Response("Forbidden", { status: 403 });
  }
}
