import API_BASE from "../api.js";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import "./AdminMissingPersons.css";

const API_BASE = API_BASE;

function AdminMissingPersons() {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [editing, setEditing] = useState(false);

  // SEARCH / FILTER / SORT
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // EDIT FORM
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    gender: "",
    description: "",
    last_seen_location: "",
    last_seen_date: "",
    status: "active",
  });

  // ============================================================
  // FETCH PERSONS
  // ============================================================

  const fetchPersons = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("You are not logged in.");
      }

      const response = await fetch(
        `${API_BASE}/api/admin/missing-persons`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.msg ||
            data.message ||
            "Failed to load missing persons."
        );
      }

      setPersons(data.missing_persons || []);
    } catch (err) {
      console.error("Fetch missing persons error:", err);
      setError(err.message || "Failed to load missing persons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  // ============================================================
  // FILTERED + SORTED PERSONS
  // ============================================================

  const filteredPersons = useMemo(() => {
    const term = search.trim().toLowerCase();

    let result = persons.filter((person) => {
      const matchesSearch =
        !term ||
        String(person.id || "")
          .toLowerCase()
          .includes(term) ||
        String(person.full_name || "")
          .toLowerCase()
          .includes(term) ||
        String(person.last_seen_location || "")
          .toLowerCase()
          .includes(term) ||
        String(person.gender || "")
          .toLowerCase()
          .includes(term) ||
        String(person.status || "")
          .toLowerCase()
          .includes(term) ||
        String(person.reported_by_name || "")
          .toLowerCase()
          .includes(term) ||
        String(person.reported_by_email || "")
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        String(person.status || "").toLowerCase() ===
          statusFilter.toLowerCase();

      const matchesGender =
        genderFilter === "all" ||
        String(person.gender || "").toLowerCase() ===
          genderFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesGender;
    });

    result.sort((a, b) => {
      if (sortBy === "name-asc") {
        return String(a.full_name || "").localeCompare(
          String(b.full_name || "")
        );
      }

      if (sortBy === "name-desc") {
        return String(b.full_name || "").localeCompare(
          String(a.full_name || "")
        );
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.last_seen_date || 0) -
          new Date(b.last_seen_date || 0)
        );
      }

      return (
        new Date(b.last_seen_date || 0) -
        new Date(a.last_seen_date || 0)
      );
    });

    return result;
  }, [
    persons,
    search,
    statusFilter,
    genderFilter,
    sortBy,
  ]);

  // ============================================================
  // STATISTICS
  // ============================================================

  const activeCount = persons.filter(
    (person) => person.status === "active"
  ).length;

  const investigationCount = persons.filter(
    (person) => person.status === "under_investigation"
  ).length;

  const foundCount = persons.filter(
    (person) => person.status === "found"
  ).length;

  const closedCount = persons.filter(
    (person) => person.status === "closed"
  ).length;

  const filtersActive =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    genderFilter !== "all" ||
    sortBy !== "newest";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setGenderFilter("all");
    setSortBy("newest");
  };

  // ============================================================
  // OPEN DETAILS
  // ============================================================

  const openDetails = (person) => {
    setSelectedPerson(person);
    setEditing(false);

    setFormData({
      full_name: person.full_name || "",
      age: person.age ?? "",
      gender: person.gender || "",
      description: person.description || "",
      last_seen_location: person.last_seen_location || "",
      last_seen_date: person.last_seen_date || "",
      status: person.status || "active",
    });
  };

  const closeDetails = () => {
    setSelectedPerson(null);
    setEditing(false);
  };

  const startEditing = () => {
    setEditing(true);
  };

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // UPDATE
  // ============================================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("You are not logged in.");
      }

      const response = await fetch(
        `${API_BASE}/api/admin/missing-persons/${selectedPerson.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            full_name: formData.full_name,
            age:
              formData.age === ""
                ? null
                : Number(formData.age),
            gender: formData.gender,
            description: formData.description,
            last_seen_location:
              formData.last_seen_location,
            last_seen_date:
              formData.last_seen_date || null,
            status: formData.status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.msg ||
            data.message ||
            "Failed to update report."
        );
      }

      alert(
        "Missing person report updated successfully."
      );

      setSelectedPerson(null);
      setEditing(false);

      await fetchPersons();
    } catch (err) {
      console.error("Update error:", err);
      alert(err.message);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (person) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the report for ${person.full_name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("You are not logged in.");
      }

      const response = await fetch(
        `${API_BASE}/api/admin/missing-persons/${person.id}`,
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
          data.error ||
            data.msg ||
            data.message ||
            "Failed to delete report."
        );
      }

      alert(
        "Missing person report deleted successfully."
      );

      setSelectedPerson(null);

      await fetchPersons();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.message);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <AdminLayout title="Missing Persons" subtitle="Manage all reported missing-person cases.">
        <div className="admin-missing-loading">
          <div className="loading-spinner"></div>
          <h2>Loading Missing Persons...</h2>
          <p>Please wait.</p>
        </div>
      </AdminLayout>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <AdminLayout title="Missing Persons" subtitle="Manage and monitor all missing-person reports.">

      {/* STATISTICS */}

      <section className="missing-statistics">

        <div className="missing-stat-card">
          <span>All Reports</span>
          <strong>{persons.length}</strong>
        </div>

        <div className="missing-stat-card active-stat">
          <span>Active Cases</span>
          <strong>{activeCount}</strong>
        </div>

        <div className="missing-stat-card investigation-stat">
          <span>Under Investigation</span>
          <strong>{investigationCount}</strong>
        </div>

        <div className="missing-stat-card found-stat">
          <span>Found</span>
          <strong>{foundCount}</strong>
        </div>

        <div className="missing-stat-card closed-stat">
          <span>Closed</span>
          <strong>{closedCount}</strong>
        </div>

      </section>

      {/* ERROR */}

      {error && (
        <div className="admin-missing-error">
          <strong>Error:</strong> {error}

          <button
            type="button"
            onClick={fetchPersons}
          >
            Try Again
          </button>
        </div>
      )}

      {/* SEARCH + FILTERS */}

      {!error && (
        <section className="missing-management-panel">

          <div className="management-heading">
            <div>
              <p className="section-kicker">
                CASE MANAGEMENT
              </p>

              <h2>Reported Missing Persons</h2>

              <p>
                Search, filter, review, and manage
                reported cases.
              </p>
            </div>

            <button
              type="button"
              className="refresh-button"
              onClick={fetchPersons}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          <div className="filter-row">

            <div className="search-box">
              <span className="search-icon">
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search by name, case ID, location, reporter..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>

            <div className="filter-control">
              <label>Status</label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
              >
                <option value="all">
                  All Statuses
                </option>

                <option value="active">
                  Active
                </option>

                <option value="under_investigation">
                  Under Investigation
                </option>

                <option value="found">
                  Found
                </option>

                <option value="closed">
                  Closed
                </option>
              </select>
            </div>

            <div className="filter-control">
              <label>Gender</label>

              <select
                value={genderFilter}
                onChange={(e) =>
                  setGenderFilter(e.target.value)
                }
              >
                <option value="all">
                  All Genders
                </option>

                <option value="male">
                  Male
                </option>

                <option value="female">
                  Female
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </div>

            <div className="filter-control">
              <label>Sort By</label>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
              >
                <option value="newest">
                  Newest First
                </option>

                <option value="oldest">
                  Oldest First
                </option>

                <option value="name-asc">
                  Name A–Z
                </option>

                <option value="name-desc">
                  Name Z–A
                </option>
              </select>
            </div>

          </div>

          <div className="filter-footer">

            <span>
              Showing{" "}
              <strong>
                {filteredPersons.length}
              </strong>{" "}
              of{" "}
              <strong>
                {persons.length}
              </strong>{" "}
              reports
            </span>

            {filtersActive && (
              <button
                type="button"
                className="clear-filters-button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}

          </div>

        </section>
      )}

      {/* EMPTY STATE */}

      {!error &&
        persons.length === 0 && (
          <div className="empty-state">

            <div className="empty-icon">
              ⌕
            </div>

            <h2>
              No Missing Person Reports
            </h2>

            <p>
              There are currently no
              missing-person reports.
            </p>

          </div>
        )}

      {/* NO SEARCH RESULTS */}

      {!error &&
        persons.length > 0 &&
        filteredPersons.length === 0 && (
          <div className="empty-state">

            <div className="empty-icon">
              ⌕
            </div>

            <h2>
              No Matching Reports
            </h2>

            <p>
              No missing-person reports match
              your current search or filters.
            </p>

            <button
              type="button"
              className="empty-clear-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>

          </div>
        )}

      {/* TABLE */}

      {!error &&
        filteredPersons.length > 0 && (
          <div className="admin-table-wrapper">

            <table className="admin-missing-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Missing Person</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Last Seen</th>
                  <th>Status</th>
                  <th>Reported By</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredPersons.map((person) => (

                  <tr key={person.id}>

                    <td className="case-id">
                      #{person.id}
                    </td>

                    <td>
                      <div className="person-cell">

                        <div className="person-avatar">

                          {person.photo_url ? (
                            <img
                              src={
                                person.photo_url.startsWith("http")
                                  ? person.photo_url
                                  : `${API_BASE}${person.photo_url}`
                              }
                              alt={person.full_name}
                            />
                          ) : (
                            <span>
                              {String(
                                person.full_name || "?"
                              )
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}

                        </div>

                        <div className="person-name-block">
                          <strong>
                            {person.full_name}
                          </strong>

                          <span>
                            Case #{person.id}
                          </span>
                        </div>

                      </div>
                    </td>

                    <td>
                      {person.age ?? "—"}
                    </td>

                    <td>
                      {person.gender || "—"}
                    </td>

                    <td>
                      <div className="last-seen">

                        <strong>
                          {person.last_seen_location ||
                            "Unknown"}
                        </strong>

                        <span>
                          {person.last_seen_date ||
                            "Date unknown"}
                        </span>

                      </div>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          person.status || "active"
                        }`}
                      >
                        <span className="status-dot"></span>

                        {person.status ===
                        "under_investigation"
                          ? "Under Investigation"
                          : person.status || "active"}
                      </span>
                    </td>

                    <td>
                      <div className="reporter">

                        <strong>
                          {person.reported_by_name ||
                            "Unknown"}
                        </strong>

                        <span>
                          {person.reported_by_email ||
                            ""}
                        </span>

                      </div>
                    </td>

                    <td>

                      <div className="action-buttons">

                        <button
                          type="button"
                          className="view-button"
                          onClick={() =>
                            openDetails(person)
                          }
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() =>
                            handleDelete(person)
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      {/* DETAILS / EDIT MODAL */}

      {selectedPerson && (

        <div
          className="modal-overlay"
          onClick={closeDetails}
        >

          <div
            className="person-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="modal-case-id">
                  CASE #{selectedPerson.id}
                </span>

                <h2>
                  {editing
                    ? "Edit Missing Person"
                    : selectedPerson.full_name}
                </h2>

              </div>

              <button
                type="button"
                className="close-button"
                onClick={closeDetails}
              >
                ×
              </button>

            </div>

            {/* EDIT FORM */}

            {editing ? (

              <form
                onSubmit={handleUpdate}
                className="edit-form"
              >

                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Full Name
                    </label>

                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Age
                    </label>

                    <input
                      type="number"
                      name="age"
                      min="0"
                      max="150"
                      value={formData.age}
                      onChange={handleChange}
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Gender
                    </label>

                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">
                        Select gender
                      </option>

                      <option value="Male">
                        Male
                      </option>

                      <option value="Female">
                        Female
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>

                  </div>

                  <div className="form-group">

                    <label>
                      Status
                    </label>

                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="active">
                        Active
                      </option>

                      <option value="under_investigation">
                        Under Investigation
                      </option>

                      <option value="found">
                        Found
                      </option>

                      <option value="closed">
                        Closed
                      </option>

                    </select>

                  </div>

                  <div className="form-group full-width">

                    <label>
                      Last Seen Location
                    </label>

                    <input
                      type="text"
                      name="last_seen_location"
                      value={
                        formData.last_seen_location
                      }
                      onChange={handleChange}
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Last Seen Date
                    </label>

                    <input
                      type="date"
                      name="last_seen_date"
                      value={
                        formData.last_seen_date
                      }
                      onChange={handleChange}
                    />

                  </div>

                  <div className="form-group full-width">

                    <label>
                      Description
                    </label>

                    <textarea
                      name="description"
                      rows="5"
                      value={
                        formData.description
                      }
                      onChange={handleChange}
                    />

                  </div>

                </div>

                <div className="modal-actions">

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() =>
                      setEditing(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="save-button"
                  >
                    Save Changes
                  </button>

                </div>

              </form>

            ) : (

              /* DETAILS VIEW */

              <div className="details-content">

                <div className="details-profile">

                  <div className="details-avatar">

                    {selectedPerson.photo_url ? (
                      <img
                        src={
                          selectedPerson.photo_url.startsWith(
                            "http"
                          )
                            ? selectedPerson.photo_url
                            : `${API_BASE}${selectedPerson.photo_url}`
                        }
                        alt={
                          selectedPerson.full_name
                        }
                      />
                    ) : (
                      <span>
                        {String(
                          selectedPerson.full_name ||
                            "?"
                        )
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}

                  </div>

                  <div>
                    <span className="profile-label">
                      MISSING PERSON
                    </span>

                    <h3>
                      {selectedPerson.full_name}
                    </h3>

                    <p>
                      Case #{selectedPerson.id}
                    </p>
                  </div>

                </div>

                <div className="details-grid">

                  <div>
                    <span>Age</span>

                    <strong>
                      {selectedPerson.age ?? "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Gender</span>

                    <strong>
                      {selectedPerson.gender ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>

                    <strong
                      className={`detail-status ${
                        selectedPerson.status
                      }`}
                    >
                      {selectedPerson.status ===
                      "under_investigation"
                        ? "Under Investigation"
                        : selectedPerson.status}
                    </strong>
                  </div>

                  <div>
                    <span>Reported By</span>

                    <strong>
                      {selectedPerson.reported_by_name ||
                        "Unknown"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Last Seen Location
                    </span>

                    <strong>
                      {selectedPerson.last_seen_location ||
                        "Unknown"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Last Seen Date
                    </span>

                    <strong>
                      {selectedPerson.last_seen_date ||
                        "Unknown"}
                    </strong>
                  </div>

                </div>

                <div className="description-box">

                  <span>
                    Description
                  </span>

                  <p>
                    {selectedPerson.description ||
                      "No description provided."}
                  </p>

                </div>

                <div className="reporter-box">

                  <span>
                    Reporter Information
                  </span>

                  <strong>
                    {selectedPerson.reported_by_name ||
                      "Unknown"}
                  </strong>

                  <p>
                    {selectedPerson.reported_by_email ||
                      "No email available"}
                  </p>

                </div>

                <div className="modal-actions">

                  <button
                    type="button"
                    className="edit-button"
                    onClick={startEditing}
                  >
                    Edit Report
                  </button>

                  <button
                    type="button"
                    className="delete-button large"
                    onClick={() =>
                      handleDelete(
                        selectedPerson
                      )
                    }
                  >
                    Delete Report
                  </button>

                </div>

              </div>

            )}

          </div>

        </div>

      )}

    </AdminLayout>
  );
}

export default AdminMissingPersons;