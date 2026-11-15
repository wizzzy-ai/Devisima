"use client";
import { useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";

export function ProfileEditor({ name, image }: { name: string; image: string | null }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const { update } = useSession();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(""); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/accounts/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), image: form.get("image") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Could not save your profile.");
      await update({ name: result.name, image: result.image });
      setMessage("Your profile has been updated.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "A network error occurred."); }
    finally { setPending(false); }
  }
  const field = "mt-2 h-12 w-full rounded-xl border border-[#d9dedb] bg-white px-4 text-sm outline-none focus:border-[#0F4C5C] focus:ring-4 focus:ring-[#0F4C5C]/10";
  return <form onSubmit={submit} className="space-y-5 rounded-2xl border bg-card p-6 sm:p-8">
    <label className="block text-sm font-semibold" htmlFor="name">Full name<input id="name" name="name" defaultValue={name} required minLength={2} maxLength={80} className={field}/></label>
    <label className="block text-sm font-semibold" htmlFor="image">Avatar image URL <span className="font-normal text-muted-foreground">(optional)</span><input id="image" name="image" type="url" defaultValue={image ?? ""} maxLength={2048} placeholder="https://example.com/avatar.jpg" className={field}/></label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}{message && <p role="status" className="text-sm text-emerald-800">{message}</p>}
    <button disabled={pending} className="h-11 rounded-xl bg-[#0F4C5C] px-5 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Saving changes..." : "Save changes"}</button>
  </form>;
}
