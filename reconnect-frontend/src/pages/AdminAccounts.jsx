import API_BASE from "../api.js";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import "./AdminAccounts.css";

const API = API_BASE;

function AdminAccounts() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [actionTarget, setActionTarget] = useState(null); // user being acted on
  const [actionType, setActionType] = useState(null);     // "ban"|"unban"|"role"|"view"
  const [banReason, setBanReason] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem("access_token");
  let currentUser = {};
  try { currentUser = JSON.parse(localStorage.getItem("user") || "{}"); } catch {}

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.msg || "Failed to load users.");
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === "admin").length,
    banned: users.filter(u => u.is_banned).length,
    active: users.filter(u => !u.is_banned && u.role === "user").length,
  }), [users]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter(u => {
      const matchSearch = !term ||
        String(u.id).includes(term) ||
        (u.full_name || "").toLowerCase().includes(term) ||
        (u.email || "").toLowerCase().includes(term);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus = statusFilter === "all" ||
        (statusFilter === "banned" && u.is_banned) ||
        (statusFilter === "active" && !u.is_banned);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const openAction = (user, type) => {
    setActionTarget(user);
    setActionType(type);
    setBanReason("");
    setNewRole(user.role);
  };

  const closeAction = () => {
    setActionTarget(null);
    setActionType(null);
  };

  const handleBan = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/users/${actionTarget.id}/ban`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: banReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to ban user.");
      setUsers(prev => prev.map(u => u.id === actionTarget.id ? { ...u, is_banned: true, ban_reason: banReason || "No reason provided." } : u));
      showToast(`${actionTarget.full_name} has been banned.`);
      closeAction();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUnban = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/users/${actionTarget.id}/unban`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unban user.");
      setUsers(prev => prev.map(u => u.id === actionTarget.id ? { ...u, is_banned: false, ban_reason: null } : u));
      showToast(`${actionTarget.full_name} has been unbanned.`);
      closeAction();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async () => {
    if (newRole === actionTarget.role) { closeAction(); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/users/${actionTarget.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role.");
      setUsers(prev => prev.map(u => u.id === actionTarget.id ? { ...u, role: newRole } : u));
      showToast(`Role updated to ${newRole} for ${actionTarget.full_name}.`);
      closeAction();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const getInitial = (u) => (u?.full_name || u?.email || "U").trim().charAt(0).toUpperCase();

  return (
    <AdminLayout title="Account Management" subtitle="Ban accounts, manage roles, and review user status.">

      {/* Toast */}
      {toast && (
        <div className={`acc-toast acc-toast--${toast.type}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Stats row */}
      <div className="acc-stats">
        <div className="acc-stat">
          <span className="acc-stat__icon acc-stat__icon--total">◎</span>
          <div><strong>{stats.total}</strong><small>Total Accounts</small></div>
        </div>
        <div className="acc-stat">
          <span className="acc-stat__icon acc-stat__icon--active">●</span>
          <div><strong>{stats.active}</strong><small>Active Users</small></div>
        </div>
        <div className="acc-stat">
          <span className="acc-stat__icon acc-stat__icon--admin">★</span>
          <div><strong>{stats.admins}</strong><small>Administrators</small></div>
        </div>
        <div className="acc-stat">
          <span className="acc-stat__icon acc-stat__icon--banned">⊘</span>
          <div><strong>{stats.banned}</strong><small>Banned Accounts</small></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="acc-toolbar">
        <div className="acc-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Search by name, email, or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch("")} className="acc-clear">×</button>}
        </div>

        <div className="acc-filters">
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="all">All roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>

          <button className="acc-refresh-btn" onClick={fetchUsers} disabled={loading}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="acc-count">{filtered.length} of {users.length} accounts</p>
      )}

      {/* States */}
      {loading && (
        <div className="acc-state">
          <div className="acc-spinner" />
          <p>Loading accounts…</p>
        </div>
      )}

      {error && !loading && (
        <div className="acc-state acc-state--error">
          <span>!</span>
          <p>{error}</p>
          <button onClick={fetchUsers}>Try Again</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="acc-state">
          <span style={{ fontSize: "2rem" }}>⌕</span>
          <p>No accounts match your filters.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="acc-table-wrap">
          <table className="acc-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const isSelf = Number(user.id) === Number(currentUser.id);
                return (
                  <tr key={user.id} className={user.is_banned ? "acc-row--banned" : ""}>
                    <td>
                      <div className="acc-user-cell">
                        <div className={`acc-avatar${user.role === "admin" ? " acc-avatar--admin" : ""}${user.is_banned ? " acc-avatar--banned" : ""}`}>
                          {getInitial(user)}
                        </div>
                        <div>
                          <strong>{user.full_name || "—"}</strong>
                          <small>#{user.id}{isSelf ? " · You" : ""}</small>
                        </div>
                      </div>
                    </td>
                    <td className="acc-email">{user.email}</td>
                    <td>
                      <span className={`acc-badge acc-badge--${user.role}`}>
                        {user.role === "admin" ? "★ Admin" : "User"}
                      </span>
                    </td>
                    <td>
                      {user.is_banned ? (
                        <span className="acc-badge acc-badge--banned" title={user.ban_reason}>⊘ Banned</span>
                      ) : (
                        <span className="acc-badge acc-badge--active">● Active</span>
                      )}
                    </td>
                    <td className="acc-date">{formatDate(user.created_at)}</td>
                    <td>
                      <div className="acc-actions">
                        <button className="acc-btn acc-btn--view" onClick={() => openAction(user, "view")}>
                          View
                        </button>
                        {!isSelf && user.role !== "admin" && !user.is_banned && (
                          <button className="acc-btn acc-btn--ban" onClick={() => openAction(user, "ban")}>
                            Ban
                          </button>
                        )}
                        {!isSelf && user.is_banned && (
                          <button className="acc-btn acc-btn--unban" onClick={() => openAction(user, "unban")}>
                            Unban
                          </button>
                        )}
                        {!isSelf && (
                          <button className="acc-btn acc-btn--role" onClick={() => openAction(user, "role")}>
                            Role
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* View modal */}
      {actionType === "view" && actionTarget && (
        <div className="acc-modal-overlay" onClick={closeAction}>
          <div className="acc-modal" onClick={e => e.stopPropagation()}>
            <div className="acc-modal__header">
              <div>
                <p className="acc-modal__label">ACCOUNT DETAILS</p>
                <h2>{actionTarget.full_name}</h2>
              </div>
              <button className="acc-modal__close" onClick={closeAction}>×</button>
            </div>
            <div className="acc-modal__body">
              <div className="acc-detail-grid">
                <div><span>User ID</span><strong>#{actionTarget.id}</strong></div>
                <div><span>Role</span><strong className={`acc-badge acc-badge--${actionTarget.role}`}>{actionTarget.role === "admin" ? "★ Admin" : "User"}</strong></div>
                <div><span>Email</span><strong>{actionTarget.email}</strong></div>
                <div><span>Registered</span><strong>{formatDate(actionTarget.created_at)}</strong></div>
                <div><span>Status</span>
                  <strong>{actionTarget.is_banned
                    ? <span className="acc-badge acc-badge--banned">⊘ Banned</span>
                    : <span className="acc-badge acc-badge--active">● Active</span>}
                  </strong>
                </div>
                {actionTarget.is_banned && (
                  <div className="acc-detail-full"><span>Ban Reason</span><strong>{actionTarget.ban_reason || "No reason provided."}</strong></div>
                )}
              </div>
            </div>
            <div className="acc-modal__footer">
              <button className="acc-btn acc-btn--view" onClick={closeAction}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Ban modal */}
      {actionType === "ban" && actionTarget && (
        <div className="acc-modal-overlay" onClick={closeAction}>
          <div className="acc-modal acc-modal--danger" onClick={e => e.stopPropagation()}>
            <div className="acc-modal__header">
              <div>
                <p className="acc-modal__label">BAN ACCOUNT</p>
                <h2>{actionTarget.full_name}</h2>
              </div>
              <button className="acc-modal__close" onClick={closeAction}>×</button>
            </div>
            <div className="acc-modal__body">
              <p className="acc-modal__warn">
                This will prevent <strong>{actionTarget.full_name}</strong> from logging in. You can unban them at any time.
              </p>
              <label className="acc-label">Reason (optional)</label>
              <textarea
                className="acc-textarea"
                rows={3}
                placeholder="e.g. Violation of platform terms…"
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
              />
            </div>
            <div className="acc-modal__footer">
              <button className="acc-btn acc-btn--view" onClick={closeAction} disabled={saving}>Cancel</button>
              <button className="acc-btn acc-btn--ban" onClick={handleBan} disabled={saving}>
                {saving ? "Banning…" : "Confirm Ban"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban modal */}
      {actionType === "unban" && actionTarget && (
        <div className="acc-modal-overlay" onClick={closeAction}>
          <div className="acc-modal" onClick={e => e.stopPropagation()}>
            <div className="acc-modal__header">
              <div>
                <p className="acc-modal__label">UNBAN ACCOUNT</p>
                <h2>{actionTarget.full_name}</h2>
              </div>
              <button className="acc-modal__close" onClick={closeAction}>×</button>
            </div>
            <div className="acc-modal__body">
              <p className="acc-modal__warn">
                This will restore access for <strong>{actionTarget.full_name}</strong> and allow them to log in again.
              </p>
              {actionTarget.ban_reason && (
                <div className="acc-ban-reason-box">
                  <span>Current ban reason:</span>
                  <p>{actionTarget.ban_reason}</p>
                </div>
              )}
            </div>
            <div className="acc-modal__footer">
              <button className="acc-btn acc-btn--view" onClick={closeAction} disabled={saving}>Cancel</button>
              <button className="acc-btn acc-btn--unban" onClick={handleUnban} disabled={saving}>
                {saving ? "Unbanning…" : "Confirm Unban"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role change modal */}
      {actionType === "role" && actionTarget && (
        <div className="acc-modal-overlay" onClick={closeAction}>
          <div className="acc-modal" onClick={e => e.stopPropagation()}>
            <div className="acc-modal__header">
              <div>
                <p className="acc-modal__label">CHANGE ROLE</p>
                <h2>{actionTarget.full_name}</h2>
              </div>
              <button className="acc-modal__close" onClick={closeAction}>×</button>
            </div>
            <div className="acc-modal__body">
              <p className="acc-modal__warn">
                Current role: <span className={`acc-badge acc-badge--${actionTarget.role}`}>{actionTarget.role}</span>
              </p>
              <label className="acc-label">New role</label>
              <select className="acc-select" value={newRole} onChange={e => setNewRole(e.target.value)}>
                <option value="user">User — Standard access</option>
                <option value="admin">Admin — Full administration access</option>
              </select>
              {newRole === "admin" && (
                <p className="acc-modal__warn acc-modal__warn--caution">
                  ⚠ Granting admin access gives full control over the platform. Only assign to trusted personnel.
                </p>
              )}
            </div>
            <div className="acc-modal__footer">
              <button className="acc-btn acc-btn--view" onClick={closeAction} disabled={saving}>Cancel</button>
              <button className="acc-btn acc-btn--role" onClick={handleRoleChange} disabled={saving}>
                {saving ? "Saving…" : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}

export default AdminAccounts;
