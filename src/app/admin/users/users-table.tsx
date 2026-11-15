"use client";

import { useState, useEffect } from "react";
import { UserStatus, Role } from "@prisma/client";
import { Search, ShieldAlert, UserCheck, ChevronUp, ChevronDown, MoreVertical, Download, UserPlus, Trash2, Key, Eye, ShieldCheck, User } from "lucide-react";
import SquishSwitch from "@/components/ui/SquishSwitch";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  status: UserStatus;
  emailVerified: string | null;
  createdAt: string;
  image: string | null;
}

interface UsersResponse {
  users: UserRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

type UserAuditLog = {
  id: string;
  action: string;
  createdAt: string;
  metadata: string | null;
  admin: { name: string | null; email: string };
};

function buildUserParams(page: number, search: string, roleFilter: string, statusFilter: string, sortBy?: string, sortOrder?: string) {
  const params = new URLSearchParams({ page: page.toString(), limit: "20" });
  if (search) params.set("search", search);
  if (roleFilter) params.set("role", roleFilter);
  if (statusFilter) params.set("status", statusFilter);
  if (sortBy) params.set("sortBy", sortBy);
  if (sortOrder) params.set("sortOrder", sortOrder);
  return params;
}

async function requestUsers(params: URLSearchParams): Promise<UsersResponse> {
  const response = await fetch(`/api/admin/users?${params}`);
  const data = await response.json() as UsersResponse | { error?: string };
  if (!response.ok || !("users" in data) || !("pagination" in data)) {
    throw new Error("error" in data ? data.error : "Failed to fetch users.");
  }
  return data;
}

export function UsersTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserRow | null>(null);
  const [auditLogs, setAuditLogs] = useState<UserAuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    let active = true;
    const params = buildUserParams(page, appliedSearch, roleFilter, statusFilter, sortBy, sortOrder);
    void requestUsers(params)
      .then((data) => {
        if (active) {
          setUsers(data.users);
          setPagination(data.pagination);
        }
      })
      .catch((error: unknown) => console.error("Failed to fetch users:", error))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [appliedSearch, page, roleFilter, statusFilter, sortBy, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setLoading(true);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Role", "Status", "Email Verified", "Joined Date"];
    const rows = users.map(u => [
      u.name || "",
      u.email,
      u.role,
      u.status,
      u.emailVerified ? "Yes" : "No",
      new Date(u.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleViewAuditLog = async (userId: string) => {
    setLoadingAudit(true);
    setShowAuditModal(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/audit`);
      if (response.ok) {
        const data = await response.json() as { logs?: UserAuditLog[] };
        setAuditLogs(data.logs || []);
      } else {
        const error = await response.json() as { error?: string };
        alert(error.error || "Failed to fetch audit logs");
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      alert("Something went wrong");
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleAction = async (userId: string, action: "suspend" | "restore" | "delete" | "resetPassword" | "changeRole", reason?: string, newPassword?: string, newRole?: Role) => {
    setLoading(true);
    try {
      const body: Record<string, string> = { action, userId };
      if (reason) body.reason = reason;
      if (newPassword) body.newPassword = newPassword;
      if (newRole) body.role = newRole;

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const data = await requestUsers(buildUserParams(page, appliedSearch, roleFilter, statusFilter, sortBy, sortOrder));
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        const error = await response.json() as { error?: string };
        alert(error.error || "Action failed");
      }
    } catch (error) {
      console.error("Action failed:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Users</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage user accounts and access.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 border-border"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setLoading(true); setRoleFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Roles</option>
            <option value="USER">User</option>
            <option value="SELLER">Seller</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setLoading(true); setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg bg-primary/90 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {selectedUsers.size > 0 && (
        <div className="mb-4 rounded-xl bg-primary/10 border border-primary/20 p-4 flex items-center justify-between">
          <p className="text-sm font-medium text-primary">{selectedUsers.size} user(s) selected</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const newRole = prompt("Enter new role (USER, SELLER, ADMIN):");
                if (newRole && ["USER", "SELLER", "ADMIN"].includes(newRole)) {
                  // TODO: Implement bulk role change
                  alert("Bulk role change coming soon");
                }
              }}
              className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Change Role
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete ${selectedUsers.size} selected users?`)) {
                  // TODO: Implement bulk delete
                  alert("Bulk delete coming soon");
                }
              }}
              className="px-3 py-1.5 text-sm font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No users found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <SquishSwitch
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onChange={handleSelectAll}
                    ariaLabel="Select all users"
                    trackColor="#dce5e2" trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff" width={76} height={38} radius={19} speed={50} stretch={36} hoverScale={1.035} colorDuration={320}
                  />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("name")}
                >
                  User {sortBy === "name" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("role")}
                >
                  Role {sortBy === "role" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("status")}
                >
                  Status {sortBy === "status" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Verified</th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("createdAt")}
                >
                  Joined {sortBy === "createdAt" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="px-4 py-4">
                    <SquishSwitch
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      ariaLabel={`Select ${user.name || user.email}`}
                      trackColor="#dce5e2" trackOnColor="#174c43" thumbColor="#ffffff" thumbOnColor="#ffffff" width={76} height={38} radius={19} speed={50} stretch={36} hoverScale={1.035} colorDuration={320}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      user.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                      user.role === "SELLER" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      user.status === UserStatus.ACTIVE ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedUserForDetails(user);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {user.status === UserStatus.ACTIVE ? (
                        <button
                          onClick={() => {
                            const reason = prompt("Reason for suspension (optional):");
                            if (reason !== null) handleAction(user.id, "suspend", reason);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Suspend user"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const reason = prompt("Reason for restoration (optional):");
                            if (reason !== null) handleAction(user.id, "restore", reason);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Restore user"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm("Delete this user? This action cannot be undone.")) {
                            handleAction(user.id, "delete");
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const newPassword = prompt("Enter new password (min 8 characters):");
                          if (newPassword && newPassword.length >= 8) {
                            handleAction(user.id, "resetPassword", undefined, newPassword);
                          } else if (newPassword) {
                            alert("Password must be at least 8 characters");
                          }
                        }}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Reset password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setLoading(true); setPage(p => Math.max(1, p - 1)); }}
              disabled={pagination.page === 1}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => { setLoading(true); setPage(p => Math.min(pagination.totalPages, p + 1)); }}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New User</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  const response = await fetch("/api/admin/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "create",
                      name: formData.get("name"),
                      email: formData.get("email"),
                      password: formData.get("password"),
                      role: formData.get("role"),
                    }),
                  });
                  if (response.ok) {
                    setShowCreateModal(false);
                    const data = await requestUsers(buildUserParams(page, appliedSearch, roleFilter, statusFilter, sortBy, sortOrder));
                    setUsers(data.users);
                    setPagination(data.pagination);
                  } else {
                    const error = await response.json() as { error?: string };
                    alert(error.error || "Failed to create user");
                  }
                } catch (error) {
                  console.error("Failed to create user:", error);
                  alert("Something went wrong");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input name="name" required className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input name="email" type="email" required className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input name="password" type="password" required className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select name="role" required className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="USER">User</option>
                  <option value="SELLER">Seller</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUserForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">User Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-muted rounded-lg">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-semibold">
                  {selectedUserForDetails.name?.split(" ").map(n => n[0]).join("") || selectedUserForDetails.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-semibold">{selectedUserForDetails.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUserForDetails.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Role</p>
                  <p className="text-sm font-medium">{selectedUserForDetails.role}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Status</p>
                  <p className="text-sm font-medium">{selectedUserForDetails.status}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Email Verified</p>
                  <p className="text-sm font-medium">{selectedUserForDetails.emailVerified ? "Yes" : "No"}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Joined</p>
                  <p className="text-sm font-medium">{new Date(selectedUserForDetails.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newRole = prompt("Enter new role (USER, SELLER, ADMIN):");
                      if (newRole && ["USER", "SELLER", "ADMIN"].includes(newRole)) {
                        handleAction(selectedUserForDetails.id, "changeRole", undefined, undefined, newRole as Role);
                        setShowDetailsModal(false);
                      } else if (newRole) {
                        alert("Invalid role. Must be USER, SELLER, or ADMIN");
                      }
                    }}
                    className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
                  >
                    Change Role
                  </button>
                  <button
                    onClick={() => {
                      const newPassword = prompt("Enter new password (min 8 characters):");
                      if (newPassword && newPassword.length >= 8) {
                        handleAction(selectedUserForDetails.id, "resetPassword", undefined, newPassword);
                        setShowDetailsModal(false);
                      } else if (newPassword) {
                        alert("Password must be at least 8 characters");
                      }
                    }}
                    className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
                  >
                    Reset Password
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleViewAuditLog(selectedUserForDetails.id);
                    }}
                    className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
                  >
                    View Audit Log
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Audit Log</h2>
              <button onClick={() => setShowAuditModal(false)} className="p-2 hover:bg-muted rounded-lg">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            {loadingAudit ? (
              <div className="p-12 text-center text-muted-foreground">Loading audit logs...</div>
            ) : auditLogs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No audit logs found</div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{log.action}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      By: {log.admin?.name} ({log.admin?.email})
                    </p>
                    {log.metadata && (
                      <pre className="text-xs bg-background p-2 rounded mt-2 overflow-x-auto">
                        {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

