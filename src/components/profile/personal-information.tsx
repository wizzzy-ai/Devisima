"use client";

import { useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, LoaderCircle, Trash2 } from "lucide-react";

interface PersonalInformationProps {
  user: {
    name: string;
    email: string;
    image: string | null;
  };
}

const maxAvatarBytes = 4 * 1024 * 1024;

export function PersonalInformation({ user }: PersonalInformationProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [avatarPending, setAvatarPending] = useState(false);
  const [avatar, setAvatar] = useState(user.image);
  const fileInput = useRef<HTMLInputElement>(null);
  const { update } = useSession();
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/accounts/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.get("name") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Could not save your profile.");
      await update({ name: result.name });
      router.refresh();
      setMessage("Your profile has been updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A network error occurred.");
    } finally {
      setPending(false);
    }
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage("");
    setError("");
    if (!(["image/png", "image/jpeg", "image/webp"].includes(file.type))) {
      setError("Choose a PNG, JPEG, or WebP photo.");
      return;
    }
    if (file.size > maxAvatarBytes) {
      setError("Profile photos must be 4 MB or smaller.");
      return;
    }

    setAvatarPending(true);
    try {
      const body = new FormData();
      body.set("avatar", file);
      const response = await fetch("/api/accounts/profile/avatar", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Could not upload your photo.");
      setAvatar(result.image);
      await update({ image: result.image });
      router.refresh();
      setMessage("Your profile photo has been updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A network error occurred.");
    } finally {
      setAvatarPending(false);
    }
  }

  async function removeAvatar() {
    setAvatarPending(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/accounts/profile/avatar", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Could not remove your photo.");
      setAvatar(null);
      await update({ image: null });
      router.refresh();
      setMessage("Your profile photo has been removed.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A network error occurred.");
    } finally {
      setAvatarPending(false);
    }
  }

  const fieldClass = "mt-2 h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground transition focus:border-primary focus:ring-4 focus:ring-primary/10";
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Profile details</p>
        <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Personal information</h3>
        <p className="mt-1 text-sm text-muted-foreground">Manage your personal information and profile photo.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/40 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-2xl font-semibold text-primary-foreground shadow-sm">
            {avatar ? <Image src={avatar} alt="Your profile photo" width={96} height={96} unoptimized className="h-full w-full object-cover" /> : initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Profile photo</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">PNG, JPEG, or WebP · up to 4 MB. Your photo appears on your account and seller listings.</p>
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={uploadAvatar} disabled={avatarPending || pending} />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => fileInput.current?.click()} disabled={avatarPending || pending} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">
                {avatarPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {avatarPending ? "Updating photo…" : avatar ? "Change photo" : "Upload photo"}
              </button>
              {avatar && <button type="button" onClick={removeAvatar} disabled={avatarPending || pending} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-background disabled:opacity-60"><Trash2 className="h-4 w-4" /> Remove</button>}
            </div>
          </div>
        </div>

        <label className="block text-sm font-semibold text-foreground" htmlFor="name">
          Full name
          <input id="name" name="name" defaultValue={user.name} required minLength={2} maxLength={80} className={fieldClass} />
        </label>

        <label className="block text-sm font-semibold text-foreground" htmlFor="email">
          Email address
          <input id="email" name="email" type="email" value={user.email} disabled className={fieldClass + " cursor-not-allowed bg-muted text-muted-foreground"} />
          <p className="mt-1 text-xs text-muted-foreground">Contact support to change your email address.</p>
        </label>

        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="rounded-lg bg-accent/20 px-4 py-3 text-sm text-foreground">{message}</p>}

        <div className="flex flex-wrap gap-3 border-t border-border pt-6">
          <button disabled={pending || avatarPending} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60">
            {pending && <LoaderCircle className="animate-spin" size={17} />}
            {pending ? "Saving changes…" : "Save changes"}
          </button>
          <button type="button" disabled={pending || avatarPending} onClick={(event) => { (event.currentTarget.form)?.reset(); setMessage(""); setError(""); }} className="h-12 rounded-xl border border-border px-6 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60">Cancel</button>
        </div>
      </form>
    </div>
  );
}
