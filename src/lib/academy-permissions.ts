import type { Session } from "next-auth";

export const ACADEMY_EDIT_ROLES = ["superadmin", "ceo"] as const;

type AcademyEditRole = (typeof ACADEMY_EDIT_ROLES)[number];

export function canEditAcademy(role: string | null | undefined): boolean {
  if (!role) return false;
  return (ACADEMY_EDIT_ROLES as readonly string[]).includes(role.toLowerCase());
}

/**
 * Forward-looking server helper. Today all Academy persistence is
 * `localStorage` so this is unused. When the persistence layer moves
 * to server endpoints, call this at the top of every mutation handler.
 *
 * Throws a 403 Response when the session's role is not in
 * ACADEMY_EDIT_ROLES.
 */
export function requireAcademyEditor(session: Session | null): void {
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!canEditAcademy(role)) {
    throw new Response("Forbidden", { status: 403 });
  }
}

export type { AcademyEditRole };
