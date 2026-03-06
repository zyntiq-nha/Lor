import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Double check admin status on server-side for every admin page load
  const { data: adminRecord } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminRecord) {
    redirect("/login");
  }

  return (
    <main className="container page">
      <AdminNav />
      {children}
    </main>
  );
}