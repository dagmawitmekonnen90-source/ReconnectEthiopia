import API_BASE from "../api.js";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AdminLayout from "../components/AdminLayout";
import "./AdminSightings.css";

const API_BASE = API_BASE;

function AdminSightings() {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSighting, setSelectedSighting] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const token = localStorage.getItem("access_token");
  const { t } = useTranslation();

  const fetchSightings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/admin/sightings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.msg || "Failed to load sightings."
        );
      }

      setSightings(data.sightings || []);
    } catch (err) {
      setError(err.message || "Failed to load reported sightings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSightings();
  }, []);

  const filteredSightings = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return sightings;
    }

    return sightings.filter((sighting) => {
      return (
        String(sighting.id || "").toLowerCase().includes(search) ||
        String(sighting.missing_person_id || "")
          .toLowerCase()
          .includes(search) ||
        String(sighting.missing_person_name || "")
          .toLowerCase()
          .includes(search) ||
        String(sighting.location || "").toLowerCase().includes(search) ||
        String(sighting.description || "").toLowerCase().includes(search) ||
        String(sighting.reported_by_name || "")
          .toLowerCase()
          .includes(search) ||
        String(sighting.reported_by_email || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [sightings, searchTerm]);

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString();
  };

  const handleDelete = async (sighting) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete sighting #${sighting.id}?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(sighting.id);

      const response = await fetch(
        `${API_BASE}/api/admin/sightings/${sighting.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.msg || "Failed to delete sighting."
        );
      }

      setSightings((current) =>
        current.filter((item) => item.id !== sighting.id)
      );

      if (selectedSighting?.id === sighting.id) {
        setSelectedSighting(null);
      }
    } catch (err) {
      alert(err.message || "Failed to delete sighting.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout title="Reported Sightings" subtitle="Review and manage sightings reported by users.">
      <div className="admin-sightings-toolbar-row">
        <button
          className="admin-sightings-refresh-button"
          onClick={fetchSightings}
          disabled={loading}
          style={{ marginBottom: "20px" }}
        >
          ↻ Refresh
        </button>
      </div>

      <main className="admin-sightings-content">
        <section className="admin-sightings-summary">
          <div className="admin-sightings-stat-card">
            <span className="stat-icon">◉</span>

            <div>
              <span className="stat-label">Total Sightings</span>
              <strong>{sightings.length}</strong>
            </div>
          </div>

          <div className="admin-sightings-stat-card">
            <span className="stat-icon">⌕</span>

            <div>
              <span className="stat-label">Showing</span>
              <strong>{filteredSightings.length}</strong>
            </div>
          </div>
        </section>

        <section className="admin-sightings-panel">
          <div className="admin-sightings-toolbar">
            <div>
              <h2>All Reported Sightings</h2>
              <p>
                Search by missing person, location, reporter, or sighting ID.
              </p>
            </div>

            <div className="admin-sightings-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search sightings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="clear-search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="admin-sightings-state">
              <div className="loading-spinner"></div>
              <p>Loading reported sightings...</p>
            </div>
          ) : error ? (
            <div className="admin-sightings-state error-state">
              <div className="state-icon">!</div>
              <h3>Unable to load sightings</h3>
              <p>{error}</p>

              <button
                className="retry-button"
                onClick={fetchSightings}
              >
                Try Again
              </button>
            </div>
          ) : filteredSightings.length === 0 ? (
            <div className="admin-sightings-state">
              <div className="empty-icon">⌕</div>

              <h3>
                {searchTerm
                  ? "No matching sightings found"
                  : "No reported sightings yet"}
              </h3>

              <p>
                {searchTerm
                  ? "Try using a different search term."
                  : "Reported sightings will appear here when users submit them."}
              </p>
            </div>
          ) : (
            <div className="admin-sightings-table-wrapper">
              <table className="admin-sightings-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Missing Person</th>
                    <th>Location</th>
                    <th>Sighting Date</th>
                    <th>Reported By</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSightings.map((sighting) => (
                    <tr key={sighting.id}>
                      <td>
                        <span className="sighting-id">
                          #{sighting.id}
                        </span>
                      </td>

                      <td>
                        <div className="person-cell">
                          <strong>
                            {sighting.missing_person_name ||
                              `Person #${sighting.missing_person_id}`}
                          </strong>

                          <span>
                            Case #{sighting.missing_person_id}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="location-cell">
                          📍 {sighting.location || "Not provided"}
                        </span>
                      </td>

                      <td>
                        {formatDate(sighting.sighting_date)}
                      </td>

                      <td>
                        <div className="reporter-cell">
                          <strong>
                            {sighting.reported_by_name || "Unknown"}
                          </strong>

                          <span>
                            {sighting.reported_by_email || "—"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="description-cell">
                          {sighting.description || "No description"}
                        </div>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="view-button"
                            onClick={() =>
                              setSelectedSighting(sighting)
                            }
                          >
                            View
                          </button>

                          <button
                            className="delete-button"
                            onClick={() => handleDelete(sighting)}
                            disabled={deletingId === sighting.id}
                          >
                            {deletingId === sighting.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {selectedSighting && (
        <div
          className="sighting-modal-overlay"
          onClick={() => setSelectedSighting(null)}
        >
          <div
            className="sighting-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sighting-modal-header">
              <div>
                <p>REPORTED SIGHTING</p>
                <h2>Sighting #{selectedSighting.id}</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setSelectedSighting(null)}
              >
                ×
              </button>
            </div>

            <div className="sighting-modal-body">
              <div className="detail-highlight">
                <span>Missing Person</span>
                <strong>
                  {selectedSighting.missing_person_name ||
                    `Person #${selectedSighting.missing_person_id}`}
                </strong>
                <small>
                  Case #{selectedSighting.missing_person_id}
                </small>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <span>Location</span>
                  <strong>
                    {selectedSighting.location || "Not provided"}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Sighting Date</span>
                  <strong>
                    {formatDate(selectedSighting.sighting_date)}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Reporter</span>
                  <strong>
                    {selectedSighting.reported_by_name || "Unknown"}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Reporter Email</span>
                  <strong>
                    {selectedSighting.reported_by_email || "—"}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Reported By User ID</span>
                  <strong>
                    #{selectedSighting.reported_by || "—"}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Created At</span>
                  <strong>
                    {formatDate(selectedSighting.created_at)}
                  </strong>
                </div>
              </div>

              <div className="description-section">
                <span>Observation / Description</span>

                <p>
                  {selectedSighting.description ||
                    "No additional description was provided."}
                </p>
              </div>
            </div>

            <div className="sighting-modal-footer">
              <button
                className="modal-secondary-button"
                onClick={() => setSelectedSighting(null)}
              >
                Close
              </button>

              <button
                className="modal-delete-button"
                onClick={() => handleDelete(selectedSighting)}
                disabled={deletingId === selectedSighting.id}
              >
                {deletingId === selectedSighting.id
                  ? "Deleting..."
                  : "Delete Sighting"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminSightings;