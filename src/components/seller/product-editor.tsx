"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product, ProductAsset } from "@prisma/client";
import { WebsitePreview } from "@/components/marketplace/website-preview";
import { formatProductListItems, parseProductListText } from "@/lib/products/list-format";

type Category = { id: string; name: string };
type EditableProduct = Product & { assets: ProductAsset[] };
type AssetItem = Pick<ProductAsset, "id" | "kind" | "fileName" | "sizeBytes" | "isCover">;
type Values = {
  title: string; shortDescription: string; description: string; categoryId: string; productType: Product["productType"];
  price: number; compareAtPrice: string | number; licenseType: Product["licenseType"]; framework: string;
  technologies: string; features: string; tags: string; requirements: string; demoUrl: string; githubUrl: string;
  videoUrl: string; documentationUrl: string; version: string; changelog: string; supportPeriod: string; supportInformation: string;
};

export function ProductEditor({ categories, product }: { categories: Category[]; product?: EditableProduct }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingReview, setPendingReview] = useState(product?.status === "PENDING_REVIEW");
  const [id, setId] = useState(product?.id || "");
  const [assets, setAssets] = useState<AssetItem[]>(product?.assets || []);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({
    title: product?.title || "", shortDescription: product?.shortDescription || "", description: product?.description || "",
    categoryId: product?.categoryId || categories[0]?.id || "", productType: product?.productType || "TEMPLATE", price: product?.price || 0,
    compareAtPrice: product?.compareAtPrice ?? "", licenseType: product?.licenseType || "PERSONAL", framework: product?.framework || "",
    technologies: (product?.technologies || []).join(", "), features: formatProductListItems(product?.features || []).join("\n"), tags: (product?.tags || []).join(", "),
    requirements: formatProductListItems(product?.requirements || []).join("\n"), demoUrl: product?.demoUrl || "", githubUrl: product?.githubUrl || "",
    videoUrl: product?.videoUrl || "", documentationUrl: product?.documentationUrl || "", version: product?.version || "1.0.0",
    changelog: product?.changelog || "", supportPeriod: product?.supportPeriod || "", supportInformation: product?.supportInformation || "",
  });
  const set = (key: keyof Values, value: string) => setValues((old) => ({ ...old, [key]: key === "price" ? Number(value) || 0 : value }));
  const inputClass = "mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";
  const label = (title: string, key: keyof Values, type = "text", placeholder = "") => <label className="block text-sm font-semibold text-foreground">{title}<input className={inputClass} type={type} value={values[key] as string | number} placeholder={placeholder} onChange={(e) => set(key, e.target.value)} /></label>;
  const steps = ["Basics", "Details", "Media", "Pricing", "Files", "Version & support", "Review"];

  async function save() {
    setBusy(true); setMessage("");
    try {
      const payload = { ...values, compareAtPrice: values.compareAtPrice === "" ? null : Number(values.compareAtPrice), technologies: values.technologies.split(",").map((x) => x.trim()).filter(Boolean), features: parseProductListText(values.features), tags: values.tags.split(",").map((x) => x.trim()).filter(Boolean), requirements: parseProductListText(values.requirements) };
      const response = await fetch(id ? `/api/seller/products/${id}` : "/api/seller/products", { method: id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Product could not be saved.");
      const savedId = id || data.product.id;
      setPendingReview(false);
      setId(savedId); setMessage(data.message || "Draft saved.");
      if (!id) router.replace(`/seller/products/${savedId}/edit`);
      return savedId;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Product could not be saved."); return null; }
    finally { setBusy(false); }
  }
  async function upload(kind: "IMAGE" | "FILE", file?: File) {
    if (!file) return;
    const productId = id || (await save()) || "";
    if (!productId) return;
    setBusy(true); setMessage("");
    try {
      const mimeType = kind === "FILE" ? "application/zip" : file.type;
      const planResponse = await fetch(`/api/seller/products/${productId}/assets/upload-url`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, fileName: file.name, mimeType, sizeBytes: file.size }),
      });
      const plan = await planResponse.json();
      if (!planResponse.ok) throw new Error(plan.message || "Upload could not be authorized.");
      let response: Response;
      if (plan.mode === "direct") {
        const uploadResponse = await fetch(plan.uploadUrl, { method: "PUT", headers: plan.headers, body: file });
        if (!uploadResponse.ok) throw new Error("The file could not be uploaded to private storage.");
        response = await fetch(`/api/seller/products/${productId}/assets`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ uploadToken: plan.uploadToken, kind }),
        });
      } else {
        const form = new FormData(); form.set("kind", kind); form.set("file", file);
        response = await fetch(`/api/seller/products/${productId}/assets`, { method: "POST", body: form });
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed.");
      setAssets((old) => [...old.map((asset) => kind === "IMAGE" && data.asset.isCover ? { ...asset, isCover: false } : asset), data.asset]);
      setMessage(`${data.asset.fileName} uploaded.`); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { setBusy(false); }
  }
  async function removeAsset(asset: AssetItem) {
    if (!id || !window.confirm(`Remove ${asset.fileName}?`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/seller/products/${id}/assets/${asset.id}`, { method: "DELETE" }); const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not remove file.");
      setAssets((old) => old.filter((item) => item.id !== asset.id)); setMessage(data.message); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not remove file."); }
    finally { setBusy(false); }
  }
  async function setCover(asset: AssetItem) {
    if (!id || asset.kind !== "IMAGE") return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/seller/products/${id}/assets/${asset.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isCover: true }) }); const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update cover image.");
      setAssets((old) => old.map((item) => item.kind === "IMAGE" ? { ...item, isCover: item.id === asset.id } : item)); setMessage(data.message); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update cover image."); }
    finally { setBusy(false); }
  }
  async function submit() {
    const productId = await save(); if (!productId) return;
    setBusy(true); setMessage("");
    try { const response = await fetch(`/api/seller/products/${productId}/submit`, { method: "POST" }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "Submission failed."); setPendingReview(true); setMessage(data.message); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Submission failed."); }
    finally { setBusy(false); }
  }

  return <section className="mx-auto max-w-6xl px-4 py-8 pb-16 sm:px-8 sm:py-12">
    <div className="relative isolate overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
      <div className="pointer-events-none absolute -right-16 -top-32 -z-10 h-72 w-72 rounded-full border-[36px] border-border/20" />
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Seller studio <span className="mx-2 text-primary-foreground/30">/</span> {product ? "Edit listing" : "New listing"}</p>
      <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{product ? "Make your product shine." : "Let’s get your product out there."}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/70 sm:text-base">Tell the story, add the details, and set your price. You can save a draft whenever you like.</p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-card/5 px-3 py-2 text-xs font-medium text-primary-foreground/75"><span className="h-2 w-2 rounded-full bg-accent" /> Your listing stays private until it’s approved</div>
    </div>
    <div className="my-7 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Step {step+1} of {steps.length}</p><p className="mt-1 text-sm font-semibold text-foreground">{steps[step]}</p></div><p className="text-xs text-muted-foreground">{Math.round(((step+1)/steps.length)*100)}% complete</p></div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent transition-all" style={{width:`${((step+1)/steps.length)*100}%`}} /></div>
      <div className="flex gap-2 overflow-x-auto pb-1">{steps.map((name, i)=><button type="button" key={name} onClick={()=>setStep(i)} aria-current={step===i?"step":undefined} className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:px-4 ${step===i?"bg-primary text-primary-foreground":"bg-muted text-muted-foreground"}`}><span className="mr-1.5 opacity-65">{String(i+1).padStart(2,"0")}</span>{name}</button>)}</div>
    </div>
    <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-lg">
      <div className="space-y-6 p-5 sm:p-8">
      {step===0 && <>{label("Product name", "title", "text", "A clear name for your product")}{label("Short description", "shortDescription", "text", "Shown in marketplace cards")}<label className="block text-sm font-medium">Full description<textarea className={`${inputClass} min-h-40`} value={values.description} onChange={(e)=>set("description",e.target.value)} /></label><label className="block text-sm font-medium">Category<select className={inputClass} value={values.categoryId} onChange={(e)=>set("categoryId",e.target.value)}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="block text-sm font-medium">Product type<select className={inputClass} value={values.productType} onChange={(e)=>set("productType",e.target.value as Values["productType"])}>{["STARTER_PROJECT","UI_COMPONENT","TEMPLATE","COMPLETE_APPLICATION","BUSINESS_SYSTEM","SAAS","API","PLUGIN"].map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select></label></>}
      {step===1 && <>{label("Framework", "framework")}{label("Technologies (comma separated)", "technologies")}<label className="block text-sm font-semibold text-foreground">Features<textarea className={`${inputClass} min-h-36`} value={values.features} placeholder={"Paste a bulleted list or enter one feature per line"} onChange={(e)=>set("features",e.target.value)} /></label><p className="-mt-4 text-xs leading-5 text-muted-foreground">Pasted bullets, numbered lists, and new lines are formatted into separate feature cards automatically.</p>{label("Tags (comma separated)", "tags")}<label className="block text-sm font-semibold text-foreground">Requirements<textarea className={`${inputClass} min-h-32`} value={values.requirements} placeholder={"Paste a bulleted list or enter one requirement per line"} onChange={(e)=>set("requirements",e.target.value)} /></label><p className="-mt-4 text-xs leading-5 text-muted-foreground">Paste a list or use one requirement per line; the product page will display each item clearly.</p></>}
      {step===2 && <><label className="block text-sm font-medium">Cover image and screenshots (optional when you add a live website below; PNG, JPEG, WebP, GIF; max 10 MB each)<input className={inputClass} type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={busy} onChange={(e)=>void upload("IMAGE",e.target.files?.[0])}/></label>{label("Demo/live URL", "demoUrl", "url", "https://your-product.com")}{values.demoUrl&&/^https?:\/\//i.test(values.demoUrl)&&<div className="overflow-hidden rounded-2xl border border-border bg-muted"><div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3"><div><p className="text-sm font-semibold text-foreground">Website preview</p><p className="max-w-[16rem] truncate text-xs text-muted-foreground">{values.demoUrl}</p></div><a href={values.demoUrl} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-primary underline">Open website</a></div><WebsitePreview key={values.demoUrl} siteUrl={values.demoUrl} title={values.title || "Product"} fallbackSrc={assets.find((asset)=>asset.kind==="IMAGE"&&asset.isCover)?`/api/products/assets/${assets.find((asset)=>asset.kind==="IMAGE"&&asset.isCover)!.id}`:undefined} className="h-72 w-full bg-card object-cover sm:h-96" /></div>}<p className="text-xs text-muted-foreground">The website image preview will appear on your marketplace listing. If it can’t be generated, upload a cover image as a fallback.</p>{label("Optional video URL", "videoUrl", "url")}</>}
      {step===3 && <><label className="block text-sm font-medium">Product price (NGN)<input className={inputClass} type="number" min="0" value={values.price} onChange={(e)=>set("price",e.target.value)} /></label><label className="block text-sm font-medium">Compare at price (optional)<input className={inputClass} type="number" min="0" value={values.compareAtPrice} onChange={(e)=>set("compareAtPrice",e.target.value)} /></label><p className="-mt-4 text-xs leading-5 text-muted-foreground">Set a higher original price to show a discount badge (e.g., price ₦55,000, compare at ₦70,000 = 21% off)</p><label className="block text-sm font-medium">License<select className={inputClass} value={values.licenseType} onChange={(e)=>set("licenseType",e.target.value as Values["licenseType"])}>{["PERSONAL","COMMERCIAL","EXTENDED"].map(x=><option key={x}>{x}</option>)}</select></label>{label("Support period", "supportPeriod", "text", "e.g. 6 months")}</>}
      {step===4 && <><label className="block text-sm font-medium">Private product ZIP files (max 25 MB each)<input className={inputClass} type="file" accept=".zip,application/zip" disabled={busy} onChange={(e)=>void upload("FILE",e.target.files?.[0])}/></label><p className="text-xs text-muted-foreground">ZIP files are stored privately. They are never published as direct file URLs.</p>{assets.filter((asset)=>asset.kind==="FILE").map((asset)=><div key={asset.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3 text-sm"><span>{asset.fileName}</span><button type="button" disabled={busy} onClick={()=>void removeAsset(asset)} className="text-red-700 underline">Remove</button></div>)}</>}
      {step===5 && <>{label("Version", "version", "text", "1.0.0")}<label className="block text-sm font-medium">Changelog<textarea className={inputClass} value={values.changelog} onChange={(e)=>set("changelog",e.target.value)} /></label>{label("Documentation URL", "documentationUrl", "url")}{label("GitHub URL", "githubUrl", "url")}<label className="block text-sm font-medium">Support information<textarea className={inputClass} value={values.supportInformation} onChange={(e)=>set("supportInformation",e.target.value)} /></label></>}
      {step===6 && <div className="space-y-3 text-sm"><h2 className="text-xl font-semibold">Review your product</h2><p>Submission sends your product and private files to moderation. It will be public only after approval.</p><p><strong>Product:</strong> {values.title || "Untitled"}</p><p><strong>Category:</strong> {categories.find((c)=>c.id===values.categoryId)?.name || "Not selected"}</p><p><strong>Price:</strong> ₦{Number(values.price).toLocaleString()}</p><p><strong>Version:</strong> {values.version}</p><p><strong>Cover:</strong> {assets.some((a)=>a.kind==="IMAGE"&&a.isCover)?"Uploaded":values.demoUrl?"Live website preview":"Required"}</p><p><strong>ZIP file:</strong> {assets.some((a)=>a.kind==="FILE")?"Uploaded":"Required"}</p><div className="rounded-lg bg-muted p-4"><p className="font-semibold">Description preview</p><p className="mt-2 whitespace-pre-wrap">{values.description || "Add a description."}</p></div></div>}
      {assets.filter((asset)=>asset.kind==="IMAGE").length>0&&(step===2||step===6)&&<div className="flex flex-wrap gap-3">{assets.filter((asset)=>asset.kind==="IMAGE").map((asset)=><div key={asset.id} className="rounded-lg border p-2 text-xs">{asset.isCover?"Cover · ":""}{asset.fileName}{!asset.isCover&&<button type="button" disabled={busy} onClick={()=>void setCover(asset)} className="ml-2 underline">Set as cover</button>}<button type="button" disabled={busy} onClick={()=>void removeAsset(asset)} className="ml-2 text-red-700 underline">Remove</button></div>)}</div>}
      {message&&<p role="status" className={`rounded-xl p-4 text-sm leading-6 ${pendingReview ? "border border-[#35D0BA]/40 bg-[#35D0BA]/10 text-[#0F4C5C]" : "bg-muted text-foreground"}`}>{pendingReview&&<strong className="mb-1 block">Your product is pending review</strong>}{message}</p>}
      <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-5"><button type="button" disabled={busy} onClick={()=>void save()} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50">{busy?"Saving / uploading…":"Save draft"}</button><div className="flex gap-2">{step>0&&<button type="button" onClick={()=>setStep(step-1)} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground">Back</button>}{step<steps.length-1?<button type="button" onClick={()=>setStep(step+1)} className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition hover:bg-accent/90">Continue</button>:<button type="button" disabled={busy||pendingReview} onClick={()=>void submit()} className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50">{pendingReview?"Pending review":"Submit for review"}</button>}</div></div>
      </div>
    </div></section>;
}
