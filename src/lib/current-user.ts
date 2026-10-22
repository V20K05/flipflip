import { cache } from "react";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { getUserProfile } from "@/lib/data/users";

/** Returns the signed-in, active user or redirects to /login. Always checked server-side. */
export const requireUser = cache(async function requireUser() {
  const id = await getSessionUserId();
  if (!id) redirect("/login");
  const user = await getUserProfile(getDb(), id);
  if (!user || user.status !== "ACTIVE") redirect("/login");
  return user;
});
