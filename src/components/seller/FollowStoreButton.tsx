'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, LockKeyhole, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function FollowStoreButton({ sellerId, isFollowing: initialFollowing, followerCount: initialCount }: { sellerId: string; isFollowing: boolean; followerCount: number }) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleFollow = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sellers/${sellerId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      });

      if (response.status === 401) {
        // Show authentication dialog
        setShowAuthDialog(true);
        setLoading(false);
        return;
      }

      if (!response.ok) throw new Error('Failed to update follow status');
      const data = await response.json();
      setIsFollowing(!isFollowing);
      setFollowerCount(data.followerCount);
    } catch (error) {
      console.error('Failed to follow/unfollow store:', error);
    } finally {
      setLoading(false);
    }
  };

  const callbackUrl = `/sellers/${sellerId}`;
  const query = `?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <>
      <div className="flex flex-col items-start gap-2">
        <button
          onClick={handleFollow}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/50 disabled:opacity-50"
        >
          <Users className="h-4 w-4" />
          {loading ? 'Loading...' : isFollowing ? 'Following' : 'Follow Store'}
        </button>
        <p className="text-xs text-white/70">
          {followerCount.toLocaleString()} follower{followerCount === 1 ? '' : 's'} - {isFollowing ? 'New product alerts on' : 'Get notified about new products'}
        </p>
      </div>

      {/* Authentication Dialog - consistent with website style */}
      {showAuthDialog && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] grid place-items-center bg-foreground/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAuthDialog(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="signin-prompt-title" className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-2xl sm:p-8">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><LockKeyhole className="h-5 w-5" /></div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">Your Devisima account</p>
            <h2 id="signin-prompt-title" className="mt-2 text-2xl font-bold tracking-tight">Sign in to follow this store</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Sign in with your email address and password to follow this store. New here? Create an account with your name, email, and password. We&apos;ll bring you back to this store afterward.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href={`/login${query}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Sign in <ArrowRight className="h-4 w-4" /></Link>
              <Link href={`/register${query}`} className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted">Create account</Link>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">Your account keeps your followed shops and purchases together.</p>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
