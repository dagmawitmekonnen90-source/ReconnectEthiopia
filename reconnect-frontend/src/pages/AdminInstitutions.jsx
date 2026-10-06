import API_BASE from "../api.js";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import "./AdminInstitutions.css";

const API = API_BASE;

const STATUS_META = {
  pending:  { color: "#d4a017", bg: "#2e2415", label: "Pending" },
  approved: { color: "#4db8af", bg: "#1a3530", label: "Approved" },
  rejected: { color: "#e89090", bg: "#2e1a1a", label: "Rejected" },
};

export default function AdminInstitutions() {
  const [institutions, setInstitutions] = useState([]);
  const [records, setRecords]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [recLoading, setRecLoading]     = useState(true);
  const [error, setError]               = useState("");
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tab, setTab]                   = useState("institutions"); // "institutions" | "records"
  const [toast, setToast]               = useState(null);
  const [updatingId, setUpdatingId]     = useState(null);

  const token = localStorage.getItem("access_token");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchInstitutions();
    fetchRecords();
  }, []);

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/institutions/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load institutions.");
      setInstitutions(data.institutions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    setRecLoading(true);
    try {
      const res = await fetch(`${API}/api/institutions/admin/records`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load records.");
      setRecords(data.records || []);
    } catch {
      /* non-critical, don't block the page */
    } finally {
      setRecLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API}/api/institutions/admin/${id}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed.");
      setInstitutions(prev => prev.map(i => i.id === id ? data.institution : i));
      showToast(`Institution ${status}.`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const stats = useMemo(() => ({
    total:    institutions.length,
    pending:  institutions.filter(i => i.status === "pending").length,
    approved: institutions.filter(i => i.status === "approved").length,
    rejected: institutions.filter(i => i.status === "rejected").length,
  }), [institutions]);

  const filteredInstitutions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return institutions.filter(i => {
      const matchSearch = !term ||
        (i.facility_name || "").toLowerCase().includes(term) ||
        (i.city || "").toLowerCase().includes(term) ||
        (i.region || "").toLowerCase().includes(term);
      const matchStatus = statusFilter === "all" || i.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [institutions, search, statusFilter]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter(r =>
      (r.found_location || "").toLowerCase().includes(term) ||
      (r.physical_description || "").toLowerCase().includes(term) ||
      String(r.id).includes(term)
    );
  }, [records, search]);

  return (
    <AdminLayout
      title="Institutions"
      subtitle="Manage hospital and police station registrations and their unidentified records."
    >

      {/* Toast */}
      {toast && (
        <div className={`ai-toast ai-toast--${toast.type}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Stats */}
      <div className="ai-stats">
        {[
          { label: "Total",    value: stats.total,    color: "#4db8af" },
          { label: "Pending",  value: stats.pending,  color: "#d4a017" },
          { label: "Approved", value: stats.approved, color: "#6ecf92" },
          { label: "Rejected", value: stats.rejected, color: "#e89090" },
          { label: "Records",  value: records.length, color: "#8fa8a3" },
        ].map(s => (
          <div className="ai-stat" key={s.label}>
            <strong style={{ color: s.color }}>{s.value}</strong>
            <small>{s.label}</small>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="ai-tabs">
        <button className={`ai-tab${tab === "institutions" ? " active" : ""}`} onClick={() => setTab("institutions")}>
          🏥 Institutions ({institutions.length})
        </button>
        <button className={`ai-tab${tab === "records" ? " active" : ""}`} onClick={() => setTab("records")}>
          📋 Unidentified Records ({records.length})
        </button>
      </div>

      {/* Toolbar */}
      <div className="ai-toolbar">
        <div className="ai-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder={tab === "institutions" ? "Search by name, city, region…" : "Search by location, description, ID…"}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch("")} className="ai-clear">×</button>}
        </div>

        {tab === "institutions" && (
          <div className="ai-filters">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="ai-refresh-btn" onClick={fetchInstitutions} disabled={loading}>↻ Refresh</button>
          </div>
        )}
      </div>

      {error && <div className="ai-error">{error}</div>}

      {/* ===== INSTITUTIONS TAB ===== */}
      {tab === "institutions" && (
        <>
          {loading ? (
            <div className="ai-state"><div className="ai-spinner" /><p>Loading institutions…</p></div>
          ) : filteredInstitutions.length === 0 ? (
            <div className="ai-state">
              <span style={{ fontSize: "2rem" }}>🏥</span>
              <p>{search || statusFilter !== "all" ? "No matching institutions." : "No institution registrations yet."}</p>
            </div>
          ) : (
            <div className="ai-table-wrap">
              <table className="ai-table">
                <thead>
                  <tr>
                    <th>Facility</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Contact</th>
                    <th>Registered</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstitutions.map(inst => {
                    const sm = STATUS_META[inst.status] || STATUS_META.pending;
                    return (
                      <tr key={inst.id}>
                        <td>
                          <strong className="ai-facility-name">{inst.facility_name}</strong>
                        </td>
                        <td>
                          <span className="ai-type-badge">
                            {inst.facility_type === "hospital" ? "🏥 Hospital" : "🚔 Police"}
                          </span>
                        </td>
                        <td>
                          <span className="ai-location">{inst.city}, {inst.region}</span>
                          {inst.address && <small>{inst.address}</small>}
                        </td>
                        <td className="ai-contact">{inst.contact_phone || "—"}</td>
                        <td className="ai-date">{formatDate(inst.created_at)}</td>
                        <td>
                          <span className="ai-status-badge" style={{ background: sm.bg, color: sm.color }}>
                            {sm.label}
                          </span>
                        </td>
                        <td>
                          <div className="ai-actions">
                            {inst.status !== "approved" && (
                              <button
                                className="ai-btn ai-btn--approve"
                                disabled={updatingId === inst.id}
                                onClick={() => updateStatus(inst.id, "approved")}
                              >
                                {updatingId === inst.id ? "…" : "Approve"}
                              </button>
                            )}
                            {inst.status !== "rejected" && (
                              <button
                                className="ai-btn ai-btn--reject"
                                disabled={updatingId === inst.id}
                                onClick={() => updateStatus(inst.id, "rejected")}
                              >
                                {updatingId === inst.id ? "…" : "Reject"}
                              </button>
                            )}
                            {inst.status !== "pending" && (
                              <button
                                className="ai-btn ai-btn--pending"
                                disabled={updatingId === inst.id}
                                onClick={() => updateStatus(inst.id, "pending")}
                              >
                                Reset
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
        </>
      )}

      {/* ===== RECORDS TAB ===== */}
      {tab === "records" && (
        <>
          {recLoading ? (
            <div className="ai-state"><div className="ai-spinner" /><p>Loading records…</p></div>
          ) : filteredRecords.length === 0 ? (
            <div className="ai-state">
              <span style={{ fontSize: "2rem" }}>📋</span>
              <p>{search ? "No matching records." : "No unidentified records submitted yet."}</p>
            </div>
          ) : (
            <div className="ai-table-wrap">
              <table className="ai-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Institution</th>
                    <th>Gender</th>
                    <th>Est. Age</th>
                    <th>Found Location</th>
                    <th>Found Date</th>
                    <th>Condition</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(rec => {
                    const sm = STATUS_META[rec.status] || STATUS_META.pending;
                    return (
                      <tr key={rec.id}>
                        <td><span className="ai-rec-id">#{rec.id}</span></td>
                        <td>
                          {rec.institution ? (
                            <div className="ai-inst-cell">
                              <strong>{rec.institution.facility_name}</strong>
                              <small>{rec.institution.city}</small>
                            </div>
                          ) : "—"}
                        </td>
                        <td className="ai-capitalize">{rec.gender || "unknown"}</td>
                        <td>
                          {rec.estimated_age_min || rec.estimated_age_max
                            ? `${rec.estimated_age_min ?? "?"}–${rec.estimated_age_max ?? "?"}`
                            : "—"}
                        </td>
                        <td>{rec.found_location}</td>
                        <td className="ai-date">{formatDate(rec.found_date)}</td>
                        <td className="ai-capitalize">{rec.condition || "unknown"}</td>
                        <td>
                          <span className="ai-status-badge" style={{ background: sm.bg, color: sm.color }}>
                            {sm.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

    </AdminLayout>
  );
}
