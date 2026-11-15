"use client";

import { useState } from "react";
import { AlertCircle, Bell, Building2, CreditCard, Mail, Save, User, Store, ShieldCheck, CheckCircle2, X, Upload, AlertTriangle, FileText, Lock, Trash2, Calendar, DollarSign, Clock, History, Eye, EyeOff, Camera } from "lucide-react";
import { PolicyModal } from "@/components/policies/PolicyModal";
import SquishSwitch from "@/components/ui/SquishSwitch";
import { SELLER_AGREEMENT_CONTENT } from "@/lib/policies/seller-agreement";
import { COMMISSION_RULES_CONTENT } from "@/lib/policies/commission-rules";
import { REFUND_POLICY_CONTENT } from "@/lib/policies/refund-policy";
import { PAYOUT_TERMS_CONTENT } from "@/lib/policies/payout-terms";

type SellerData = {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean | null;
  image: string | null;
  storeName: string | undefined;
  description: string | undefined;
  productTypes: string[] | undefined;
  technologies: string[] | undefined;
  portfolioUrl: string | undefined;
  githubUrl: string | undefined;
  // Profile fields
  username: string | null;
  displayName: string | null;
  bio: string | null;
  // Store fields
  storeLogo: string | null;
  storeBanner: string | null;
  storeUrl: string | null;
  storeCategory: string | null;
  storeAccentColor: string | null;
  socialLinks: {
    twitter: string | null;
    linkedin: string | null;
  } | null;
  supportEmail: string | null;
  storeVisibility: "public" | "private" | null;
  // Payout fields
  payoutAccount: {
    id: string;
    accountName: string | null;
    accountLast4: string | null;
    bankName: string | null;
    bankCode: string | null;
    isVerified: boolean | null;
    updatedAt: Date | null;
    payoutSchedule: string | null;
    minimumPayout: number | null;
    pendingEarnings: number | null;
    eligibleEarnings: number | null;
    paidEarnings: number | null;
    payoutHistory: Array<{
      id: string;
      amount: number;
      status: "pending" | "completed" | "failed";
      date: Date;
      failureReason?: string;
    }> | null;
  } | null;
  notificationPreference: {
    orderEmails: boolean | null;
    paymentEmails: boolean | null;
    purchaseEmails: boolean | null;
    reviewEmails: boolean | null;
    sellerEmails: boolean | null;
    payoutEmails: boolean | null;
    marketingEmails: boolean | null;
    systemEmails: boolean | null;
    newOrderInApp: boolean | null;
    successfulPaymentInApp: boolean | null;
    weeklyPayoutInApp: boolean | null;
    failedPayoutInApp: boolean | null;
    refundRequestInApp: boolean | null;
    chargebackAlertInApp: boolean | null;
    productApprovalInApp: boolean | null;
    securityAlertInApp: boolean | null;
  } | null;
  // Verification and status fields
  verificationStatus: {
    identityVerified: boolean | null;
    businessVerified: boolean | null;
    outstandingRequirements: string[] | null;
  } | null;
  accountStatus: "approved" | "restricted" | "suspended" | null;
  statusExplanation: string | null;
};

export function SellerSettings({ seller }: { seller: SellerData }) {
  const [activeTab, setActiveTab] = useState<"profile" | "store" | "payout" | "notifications">("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activePolicy, setActivePolicy] = useState<"seller-agreement" | "commission-rules" | "refund-policy" | "payout-terms" | null>(null);

  const [profileData, setProfileData] = useState({
    name: seller.name || "",
    email: seller.email,
    username: seller.username || "",
    displayName: seller.displayName || "",
    bio: seller.bio || "",
  });

  const [storeData, setStoreData] = useState({
    storeName: seller.storeName || "",
    storeDescription: seller.description || "",
    storeLogo: seller.storeLogo || "",
    storeBanner: seller.storeBanner || "",
    storeUrl: seller.storeUrl || "",
    storeCategory: seller.storeCategory || "",
    storeAccentColor: seller.storeAccentColor || "#35D0BA",
    storeTwitter: seller.socialLinks?.twitter || "",
    storeSupportEmail: seller.supportEmail || "",
    storeVisibility: seller.storeVisibility || "public",
  });

  const [payoutData, setPayoutData] = useState({
    accountName: seller.payoutAccount?.accountName || "",
    accountNumber: "",
    bankName: seller.payoutAccount?.bankName || "",
    bankCode: seller.payoutAccount?.bankCode || "",
    payoutSchedule: seller.payoutAccount?.payoutSchedule || "weekly",
  });

  const [notificationData, setNotificationData] = useState({
    orderEmails: seller.notificationPreference?.orderEmails ?? true,
    paymentEmails: seller.notificationPreference?.paymentEmails ?? true,
    purchaseEmails: seller.notificationPreference?.purchaseEmails ?? true,
    reviewEmails: seller.notificationPreference?.reviewEmails ?? true,
    sellerEmails: seller.notificationPreference?.sellerEmails ?? true,
    payoutEmails: seller.notificationPreference?.payoutEmails ?? true,
    marketingEmails: seller.notificationPreference?.marketingEmails ?? false,
    systemEmails: seller.notificationPreference?.systemEmails ?? true,
    newOrderInApp: seller.notificationPreference?.newOrderInApp ?? true,
    successfulPaymentInApp: seller.notificationPreference?.successfulPaymentInApp ?? true,
    weeklyPayoutInApp: seller.notificationPreference?.weeklyPayoutInApp ?? true,
    failedPayoutInApp: seller.notificationPreference?.failedPayoutInApp ?? true,
    refundRequestInApp: seller.notificationPreference?.refundRequestInApp ?? true,
    chargebackAlertInApp: seller.notificationPreference?.chargebackAlertInApp ?? true,
    productApprovalInApp: seller.notificationPreference?.productApprovalInApp ?? true,
    securityAlertInApp: seller.notificationPreference?.securityAlertInApp ?? true,
  });

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/seller/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch (error) {
      console.error("Failed to update profile:", error);
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStore = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/seller/settings/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update store settings");
      }

      setMessage({ type: "success", text: "Store settings updated successfully" });
    } catch (error) {
      console.error("Failed to update store settings:", error);
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to update store settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayout = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/seller/settings/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payoutData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update payout account");
      }

      setMessage({ type: "success", text: "Payout account updated successfully" });
    } catch (error) {
      console.error("Failed to update payout account:", error);
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to update payout account" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/seller/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update notification preferences");
      }

      setMessage({ type: "success", text: "Notification preferences updated successfully" });
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to update notification preferences" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl py-2">
      {message && (
        <div className={`mb-6 rounded-xl border p-4 flex items-start gap-3 ${
          message.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
            : "bg-destructive/10 border-destructive/20 text-destructive"
        }`}>
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">{message.text}</p>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="shrink-0 hover:opacity-70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border">
          <nav className="flex gap-1 px-6" aria-label="Settings tabs">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === "profile"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-4 w-4" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab("store")}
              className={`px-4 py-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === "store"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Store className="h-4 w-4" />
              Store
            </button>
            <button
              onClick={() => setActiveTab("payout")}
              className={`px-4 py-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === "payout"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Payout Account
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-4 py-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === "notifications"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bell className="h-4 w-4" />
              Notifications
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Seller Profile
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Profile Picture</label>
                    <div className="flex items-start gap-4">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-muted/30 flex items-center justify-center">
                        {seller.image ? (
                          <img src={seller.image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-10 w-10 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Your profile picture is managed in your account settings and is shared across your buyer and seller profiles.
                        </p>
                        <button
                          onClick={() => window.location.href = "/profile"}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
                        >
                          <Upload className="h-4 w-4" />
                          Change Profile Picture
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Seller Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Enter your seller name"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">This will be displayed as @{profileData.name.replace(/\s+/g, '').toLowerCase()} on your store</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Username</label>
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Choose a unique username"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">This will be used in your profile URL. Only letters, numbers, and underscores.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Public Display Name</label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="How customers will see your name"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">This name will be displayed publicly on your store and products.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Personal Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={4}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      placeholder="Tell customers a bit about yourself and your work..."
                      maxLength={500}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{profileData.bio.length}/500 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground outline-none cursor-not-allowed"
                      />
                      {seller.emailVerified && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed. Contact support if needed.</p>
                  </div>
                </div>
              </section>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "store" && (
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Store Branding
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Store Name</label>
                    <input
                      type="text"
                      value={storeData.storeName}
                      onChange={(e) => setStoreData({ ...storeData, storeName: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Your store name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Store Description</label>
                    <textarea
                      value={storeData.storeDescription}
                      onChange={(e) => setStoreData({ ...storeData, storeDescription: e.target.value })}
                      rows={4}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      placeholder="Describe your store and what you offer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Store Logo</label>
                    <div className="flex items-center gap-3">
                      {storeData.storeLogo && (
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border">
                          <img src={storeData.storeLogo} alt="Store logo" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <input
                        type="url"
                        value={storeData.storeLogo}
                        onChange={(e) => setStoreData({ ...storeData, storeLogo: e.target.value })}
                        className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="https://your-logo-url.png"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">URL to your store logo image (PNG, JPG, WebP recommended)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Store Banner</label>
                    <div className="flex items-center gap-3">
                      {storeData.storeBanner && (
                        <div className="h-16 w-32 shrink-0 overflow-hidden rounded-xl border border-border">
                          <img src={storeData.storeBanner} alt="Store banner" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <input
                        type="url"
                        value={storeData.storeBanner}
                        onChange={(e) => setStoreData({ ...storeData, storeBanner: e.target.value })}
                        className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="https://your-banner-url.png"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">URL to your store banner image (recommended: 1200x400px)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Store Category</label>
                    <input
                      type="text"
                      value={storeData.storeCategory}
                      onChange={(e) => setStoreData({ ...storeData, storeCategory: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="e.g., Web Development, UI Kits, Business Tools"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Brand Accent Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={storeData.storeAccentColor}
                        onChange={(e) => setStoreData({ ...storeData, storeAccentColor: e.target.value })}
                        className="h-10 w-10 rounded-lg border border-border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={storeData.storeAccentColor}
                        onChange={(e) => setStoreData({ ...storeData, storeAccentColor: e.target.value })}
                        className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="#35D0BA"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Select a color for accents (will be used sparingly, won't replace Devisima's teal)</p>
                  </div>
                </div>
              </section>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveStore}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "payout" && (
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payout Account
                </h3>
                {seller.payoutAccount?.isVerified && (
                  <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-700">Account Verified</p>
                        <p className="mt-1 text-xs text-emerald-600">
                          Your payout account was verified on {seller.payoutAccount.updatedAt?.toLocaleDateString("en-NG")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Account Name</label>
                    <input
                      type="text"
                      value={payoutData.accountName}
                      onChange={(e) => setPayoutData({ ...payoutData, accountName: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Account holder name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Account Number</label>
                    <input
                      type="text"
                      value={payoutData.accountNumber}
                      onChange={(e) => setPayoutData({ ...payoutData, accountNumber: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="10-digit account number"
                      maxLength={10}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Enter full account number. Only last 4 digits will be stored for security.
                    </p>
                    {seller.payoutAccount && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Current account ends in ****{seller.payoutAccount.accountLast4}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Bank Name</label>
                    <input
                      type="text"
                      value={payoutData.bankName}
                      onChange={(e) => setPayoutData({ ...payoutData, bankName: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="e.g., Access Bank, GTBank"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Bank Code</label>
                    <input
                      type="text"
                      value={payoutData.bankCode}
                      onChange={(e) => setPayoutData({ ...payoutData, bankCode: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="3-digit bank code"
                      maxLength={3}
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-end">
                <button
                  onClick={handleSavePayout}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  {([
                    ["orderEmails", "Order Emails", "Get notified when you receive new orders"],
                    ["paymentEmails", "Payment Emails", "Get notified about payment confirmations"],
                    ["purchaseEmails", "Purchase Emails", "Get notified about your purchases"],
                    ["reviewEmails", "Review Emails", "Get notified about product reviews"],
                    ["sellerEmails", "Seller Emails", "Get notified about seller-related updates"],
                    ["payoutEmails", "Payout Emails", "Get notified about payout status and transactions"],
                    ["marketingEmails", "Marketing Emails", "Receive promotional emails and updates"],
                    ["systemEmails", "System Emails", "Receive important system notifications"],
                  ] as const).map(([key, title, description]) => (
                    <div key={key} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
                      <div>
                        <p className="font-medium text-foreground">{title}</p>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <SquishSwitch
                        checked={notificationData[key]}
                        onChange={(checked) => setNotificationData((current) => ({ ...current, [key]: checked }))}
                        ariaLabel={title}
                        trackColor="#dce5e2"
                        trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff"
                        width={76}
                        height={38}
                        radius={19}
                        speed={50}
                        stretch={36}
                        hoverScale={1.035}
                        colorDuration={320}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotifications}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* Additional Seller-Specific Sections */}
          <div className="mt-8 space-y-6">
            {/* Seller Verification */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Seller Verification
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">Identity Verification</p>
                    <p className="text-sm text-muted-foreground">Verify your identity to build trust with buyers</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    seller.verificationStatus?.identityVerified
                      ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                  }`}>
                    {seller.verificationStatus?.identityVerified ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">Business Verification</p>
                    <p className="text-sm text-muted-foreground">Verify your business for higher limits</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    seller.verificationStatus?.businessVerified
                      ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                  }`}>
                    {seller.verificationStatus?.businessVerified ? "Verified" : "Pending"}
                  </span>
                </div>
                {seller.verificationStatus?.outstandingRequirements && seller.verificationStatus.outstandingRequirements.length > 0 && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm font-semibold text-amber-700 mb-2">Outstanding Requirements:</p>
                    <ul className="text-sm text-amber-600 list-disc list-inside space-y-1">
                      {seller.verificationStatus.outstandingRequirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            {/* Marketplace Policies */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Marketplace Policies
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">Seller Agreement</p>
                    <p className="text-xs text-muted-foreground">Last updated: January 2025</p>
                  </div>
                  <button
                    onClick={() => setActivePolicy("seller-agreement")}
                    className="text-sm text-primary hover:underline"
                  >
                    View
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">Commission Rules</p>
                    <p className="text-xs text-muted-foreground">15% commission on all sales</p>
                  </div>
                  <button
                    onClick={() => setActivePolicy("commission-rules")}
                    className="text-sm text-primary hover:underline"
                  >
                    View
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">Refund Policy</p>
                    <p className="text-xs text-muted-foreground">See policy for details</p>
                  </div>
                  <button
                    onClick={() => setActivePolicy("refund-policy")}
                    className="text-sm text-primary hover:underline"
                  >
                    View
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">Payout Terms</p>
                    <p className="text-xs text-muted-foreground">Weekly payouts (threshold pending)</p>
                  </div>
                  <button
                    onClick={() => setActivePolicy("payout-terms")}
                    className="text-sm text-primary hover:underline"
                  >
                    View
                  </button>
                </div>
              </div>
            </section>

            {/* Account Status */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Account Status
              </h3>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-foreground">Current Status</p>
                  <p className="text-sm text-muted-foreground capitalize">{seller.accountStatus || "Approved"}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  seller.accountStatus === "approved"
                    ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                    : seller.accountStatus === "restricted"
                    ? "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                    : "bg-red-500/10 text-red-700 border border-red-500/20"
                }`}>
                  {seller.accountStatus?.toUpperCase() || "APPROVED"}
                </span>
              </div>
              {seller.statusExplanation && (
                <div className="mt-3 p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">{seller.statusExplanation}</p>
                </div>
              )}
            </section>

            {/* Danger Zone */}
            <section className="rounded-xl border border-destructive/50 bg-destructive/5 p-6">
              <h3 className="text-lg font-semibold text-destructive mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-background">
                  <p className="font-medium text-foreground mb-2">Close Seller Account</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will <strong>only remove your seller access</strong>. Your buyer account will remain active, allowing you to continue purchasing products.
                    All your products will be removed from the marketplace. Outstanding orders must be fulfilled, and refunds processed.
                    This action cannot be undone.
                  </p>
                  <button className="rounded-lg border border-destructive bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20 transition-colors">
                    Close Seller Account
                  </button>
                </div>
                <div className="p-4 rounded-lg bg-background">
                  <p className="font-medium text-foreground mb-2">Close Entire Account</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will <strong>permanently close both your buyer and seller accounts</strong>. You will lose access to all purchases, downloads, and account data.
                    Go to your general account settings to close your entire account.
                  </p>
                  <button
                    onClick={() => window.location.href = "/profile/security"}
                    className="rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
                  >
                    Go to Account Settings
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Policy Modals */}
      <PolicyModal
        isOpen={activePolicy === "seller-agreement"}
        onClose={() => setActivePolicy(null)}
        title="Seller Agreement"
        effectiveDate="2026-10-10"
        lastUpdated="2026-10-10"
      >
        {SELLER_AGREEMENT_CONTENT}
      </PolicyModal>

      <PolicyModal
        isOpen={activePolicy === "commission-rules"}
        onClose={() => setActivePolicy(null)}
        title="Commission Rules"
        effectiveDate="2026-10-10"
        lastUpdated="2026-10-10"
      >
        {COMMISSION_RULES_CONTENT}
      </PolicyModal>

      <PolicyModal
        isOpen={activePolicy === "refund-policy"}
        onClose={() => setActivePolicy(null)}
        title="Refund Policy"
        effectiveDate="2026-10-10"
        lastUpdated="2026-10-10"
      >
        {REFUND_POLICY_CONTENT}
      </PolicyModal>

      <PolicyModal
        isOpen={activePolicy === "payout-terms"}
        onClose={() => setActivePolicy(null)}
        title="Payout Terms"
        effectiveDate="2026-10-10"
        lastUpdated="2026-10-10"
      >
        {PAYOUT_TERMS_CONTENT}
      </PolicyModal>
    </div>
  );
}


