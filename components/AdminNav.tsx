"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminNav() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="admin-nav">
      <div className="admin-links">
        <Link className="btn secondary" href="/admin/dashboard">
          Dashboard
        </Link>
        <Link className="btn secondary" href="/admin/templates">
          Templates
        </Link>
        <Link className="btn secondary" href="/admin/users">
          Users
        </Link>
      </div>
      <button className="btn" onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  );
}