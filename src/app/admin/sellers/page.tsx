import Link from "next/link";
import { Prisma, SellerApplicationStatus, UserStatus } from "@prisma/client";
import { AlertTriangle, BadgeCheck, Search, Store, Users } from "lucide-react";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { getSellerBalances } from "@/lib/earnings/balance";

export const metadata: Metadata = {
  title: "Sellers | Devisima Admin",
  description: "Manage seller accounts, applications, products, and earnings.",
  robots: "noindex",
};

const pageSize = 20;
const applicationStatuses = ["ALL", ...Object.values(SellerApplicationStatus)] as const;
type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminSellersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const search = first(params.search)?.trim().slice(0, 120) ?? "";
  const rawStatus = first(params.applicationStatus);
  const applicationStatus = applicationStatuses.includes(rawStatus as typeof applicationStatuses[number])
    ? rawStatus as typeof applicationStatuses[number]
    : "ALL";
  const accountStatus = first(params.accountStatus) === "ACTIVE" || first(params.accountStatus) === "SUSPENDED"
    ? first(params.accountStatus)
    : "ALL";
  const from = parseDate(first(params.from));
  const to = parseDate(first(params.to));
  const requestedSort = first(params.sortBy);
  const sortBy: "name" | "email" | "createdAt" = requestedSort === "name" || requestedSort === "email" ? requestedSort : "createdAt";
  const sortOrder = first(params.sortOrder) === "asc" ? "asc" : "desc";
  const requestedPage = Number(first(params.page) ?? 1);
  const requestedPageNumber = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const createdAt: Prisma.DateTimeFilter = {};
  if (from) createdAt.gte = from;
  if (to) createdAt.lt = new Date(to.getTime() + 24 * 60 * 60 * 1000);
  const userFilter: Prisma.UserWhereInput = accountStatus === "ACTIVE"
    ? { status: UserStatus.ACTIVE, sellerSuspendedAt: null }
    : accountStatus === "SUSPENDED"
      ? { OR: [{ status: UserStatus.SUSPENDED }, { sellerSuspendedAt: { not: null } }] }
      : {};
  const where: Prisma.SellerApplicationWhereInput = {
    ...(applicationStatus !== "ALL" ? { status: applicationStatus } : {}),
    ...(from || to ? { createdAt } : {}),
    ...(Object.keys(userFilter).length ? { user: userFilter } : {}),
    ...(search ? {
      OR: [
        { storeName: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ],
    } : {}),
  };

  const [totalApproved, pendingApplications, activeSellers, restrictedSellers, filteredTotal] = await Promise.all([
    db.user.count({ where: { sellerApplications: { some: { status: "APPROVED" } } } }),
    db.sellerApplication.count({ where: { status: "PENDING" } }),
    db.user.count({ where: { role: "SELLER", status: "ACTIVE", sellerSuspendedAt: null } }),
    db.user.count({
      where: {
        sellerApplications: { some: { status: "APPROVED" } },
        OR: [{ sellerSuspendedAt: { not: null } }, { status: "SUSPENDED" }],
      },
    }),
    db.sellerApplication.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
  const page = Math.min(requestedPageNumber, totalPages);
  const orderBy: Prisma.SellerApplicationOrderByWithRelationInput[] = sortBy === "name"
    ? [{ user: { name: sortOrder } }, { createdAt: "desc" }]
    : sortBy === "email"
      ? [{ user: { email: sortOrder } }, { createdAt: "desc" }]
      : [{ createdAt: sortOrder }, { id: "desc" }];
  const applications = await db.sellerApplication.findMany({
    where,
    orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      storeName: true,
      status: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          role: true,
          status: true,
          sellerSuspendedAt: true,
        },
      },
    },
  });
  const sellerIds = [...new Set(applications.map(({ user }) => user.id))];
  const [productCounts, balances] = await Promise.all([
    sellerIds.length
      ? db.product.groupBy({
          by: ["sellerId"],
          where: { sellerId: { in: sellerIds }, status: "PUBLISHED", adminRestrictedAt: null },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    getSellerBalances(sellerIds),
  ]);
  const productCountBySeller = new Map(productCounts.map((row) => [row.sellerId, row._count._all]));

  return (
    <AdminShell user={admin}>
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Marketplace operations</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Sellers</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review seller accounts, monitor marketplace activity, and manage account restrictions without changing financial records.
            </p>
          </div>
          <Link href="/admin/seller-applications" className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted">
            <Store className="h-4 w-4 text-primary" /> Review applications
          </Link>
        </header>

        <section aria-label="Seller summary" className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Summary icon={Users} label="Approved sellers" value={totalApproved} detail="Accounts with an approved application" />
          <Summary icon={Store} label="Pending applications" value={pendingApplications} detail="Awaiting an administrator decision" />
          <Summary icon={BadgeCheck} label="Active sellers" value={activeSellers} detail="Seller tools and listings enabled" />
          <Summary icon={AlertTriangle} label="Suspended or restricted" value={restrictedSellers} detail="Seller access restricted; buyer access retained" />
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">Seller directory</h2>
                <p className="mt-1 text-sm text-muted-foreground">Search applications, filter by status or date, then open a record for full account details.</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-foreground">{filteredTotal.toLocaleString("en-NG")}</span>
                <span className="text-muted-foreground">results</span>
              </div>
            </div>
            <form action="/admin/sellers" className="mt-6 grid gap-4 bg-background/50 rounded-xl p-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              <label className="relative xl:col-span-2">
                <span className="sr-only">Search sellers</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input 
                  name="search" 
                  defaultValue={search} 
                  placeholder="Search name, email, or store" 
                  className="w-full rounded-lg border border-border bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" 
                />
              </label>
              <label>
                <span className="sr-only">Application status</span>
                <select 
                  name="applicationStatus" 
                  defaultValue={applicationStatus} 
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm appearance-none cursor-pointer"
                >
                  <option value="ALL">All statuses</option>
                  {Object.values(SellerApplicationStatus).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                </select>
              </label>
              <label>
                <span className="sr-only">Account status</span>
                <select 
                  name="accountStatus" 
                  defaultValue={accountStatus} 
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm appearance-none cursor-pointer"
                >
                  <option value="ALL">All accounts</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </label>
              <label>
                <span className="sr-only">Applied from</span>
                <input 
                  type="date" 
                  name="from" 
                  defaultValue={first(params.from)} 
                  aria-label="Applied from" 
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" 
                />
              </label>
              <label>
                <span className="sr-only">Applied through</span>
                <input 
                  type="date" 
                  name="to" 
                  defaultValue={first(params.to)} 
                  aria-label="Applied through" 
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" 
                />
              </label>
              <input type="hidden" name="sortBy" value={sortBy} />
              <input type="hidden" name="sortOrder" value={sortOrder} />
              <div className="flex gap-3 xl:col-span-6 lg:col-span-4">
                <button className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                  Apply filters
                </button>
                <Link 
                  href="/admin/sellers" 
                  className="flex-1 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors text-center"
                >
                  Clear
                </Link>
              </div>
            </form>
          </div>

          {applications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted"><Store className="h-6 w-6 text-muted-foreground" /></span>
              <h3 className="mt-4 text-base font-semibold text-foreground">{filteredTotal === 0 ? "No sellers or applications yet" : "No matching sellers"}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{filteredTotal === 0 ? "New applications will appear here when submitted." : "Try changing the search or filters."}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-medium"><SortLink label="Seller" field="name" params={params} sortBy={sortBy} sortOrder={sortOrder} /></th>
                      <th scope="col" className="px-6 py-4 font-medium">Store / application</th>
                      <th scope="col" className="px-6 py-4 font-medium"><SortLink label="Applied" field="createdAt" params={params} sortBy={sortBy} sortOrder={sortOrder} /></th>
                      <th scope="col" className="px-6 py-4 font-medium">Email</th>
                      <th scope="col" className="px-6 py-4 font-medium text-right">Products</th>
                      <th scope="col" className="px-6 py-4 font-medium text-right">Sales</th>
                      <th scope="col" className="px-6 py-4 font-medium text-right">Net earnings</th>
                      <th scope="col" className="px-6 py-4 font-medium">Account</th>
                      <th scope="col" className="px-6 py-4 font-medium text-right"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {applications.map((application) => {
                      const user = application.user;
                      const suspended = Boolean(user.sellerSuspendedAt) || user.status === "SUSPENDED";
                      const balance = balances.get(user.id);
                      return (
                        <tr key={application.id} className="align-top hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <Link href={`/admin/sellers/${user.id}`} className="font-semibold text-foreground hover:text-primary hover:underline transition-colors">{user.name}</Link>
                            <p className="mt-1 text-xs text-muted-foreground break-all">{user.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-foreground">{application.storeName}</p>
                            <StatusBadge status={application.status} />
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{application.createdAt.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${user.emailVerified ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20" : "bg-amber-500/10 text-amber-700 border border-amber-500/20"}`}>
                              {user.emailVerified ? "Verified" : "Unverified"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-foreground">{productCountBySeller.get(user.id) ?? 0}</td>
                          <td className="px-6 py-4 text-right font-medium text-foreground">{balance?.totalSales ?? 0}</td>
                          <td className="px-6 py-4 text-right font-semibold tabular-nums text-foreground">{formatMoney(balance?.netEarnings ?? 0)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border ${suspended ? "bg-destructive/10 text-destructive border-destructive/20" : user.role === "SELLER" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"}`}>
                              {suspended ? "Restricted" : user.role === "SELLER" ? "Active seller" : "Applicant"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link 
                              href={`/admin/sellers/${user.id}`} 
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                            >
                              Manage<span className="sr-only"> {user.name}</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} params={params} total={filteredTotal} />
            </>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

function statusLabel(status: SellerApplicationStatus) {
  return status === "CHANGES_REQUESTED" ? "Changes requested" : status === "PENDING" ? "Pending review" : status.charAt(0) + status.slice(1).toLowerCase();
}

function Summary({ icon: Icon, label, value, detail }: { icon: typeof Users; label: string; value: number; detail: string }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value.toLocaleString("en-NG")}</p></div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: SellerApplicationStatus }) {
  const tone = status === "APPROVED" ? "bg-primary/10 text-primary"
    : status === "REJECTED" ? "bg-destructive/10 text-destructive"
      : "bg-amber-500/10 text-amber-700";
  return <span className={`mt-1.5 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{statusLabel(status)}</span>;
}

function SortLink({ label, field, params, sortBy, sortOrder }: {
  label: string;
  field: string;
  params: SearchParams;
  sortBy: string;
  sortOrder: string;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value && key !== "page") query.set(key, value);
  }
  query.set("sortBy", field);
  query.set("sortOrder", sortBy === field && sortOrder === "asc" ? "desc" : "asc");
  return <Link href={`/admin/sellers?${query.toString()}`} className="hover:text-foreground">{label} ↕</Link>;
}

function Pagination({ page, totalPages, params, total }: { page: number; totalPages: number; params: SearchParams; total: number }) {
  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value) query.set(key, value);
    }
    query.set("page", String(target));
    return `/admin/sellers?${query.toString()}`;
  };
  return (
    <nav aria-label="Seller results pages" className="flex flex-col gap-4 border-t border-border bg-muted/20 px-6 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">
        Showing <span className="font-medium text-foreground">{page}</span> of <span className="font-medium text-foreground">{totalPages}</span> · <span className="font-medium text-foreground">{total.toLocaleString("en-NG")}</span> results
      </p>
      <div className="flex gap-2">
        <Link 
          aria-disabled={page <= 1} 
          href={href(Math.max(1, page - 1))} 
          className={`rounded-lg border border-border bg-white px-4 py-2 font-medium transition-all ${page <= 1 ? "pointer-events-none opacity-50 cursor-not-allowed" : "hover:bg-muted hover:border-primary/30"}`}
        >
          Previous
        </Link>
        <Link 
          aria-disabled={page >= totalPages} 
          href={href(Math.min(totalPages, page + 1))} 
          className={`rounded-lg border border-border bg-white px-4 py-2 font-medium transition-all ${page >= totalPages ? "pointer-events-none opacity-50 cursor-not-allowed" : "hover:bg-muted hover:border-primary/30"}`}
        >
          Next
        </Link>
      </div>
    </nav>
  );
}
