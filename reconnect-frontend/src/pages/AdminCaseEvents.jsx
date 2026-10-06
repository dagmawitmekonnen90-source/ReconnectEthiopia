import API_BASE from "../api.js";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import "./AdminCaseEvents.css";

function AdminCaseEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const getToken = () => localStorage.getItem("access_token");

  const loadEvents = async () => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("You are not logged in.");
      }

      const response = await fetch(
        `${API_BASE}/api/case-events/admin/all`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.msg || data.message || "Failed to load case events."
        );
      }

      setEvents(data.events || []);
    } catch (err) {
      console.error("Admin case events error:", err);
      setError(err.message || "Failed to load case events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const eventTypes = useMemo(() => {
    const types = events
      .map((event) => event.event_type)
      .filter(Boolean)
      .map((type) => String(type).trim());

    return [...new Set(types)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [events]);

  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase();

    let result = events.filter((event) => {
      const matchesSearch =
        !term ||
        String(event.id || "")
          .toLowerCase()
          .includes(term) ||
        String(event.missing_person_id || "")
          .toLowerCase()
          .includes(term) ||
        String(event.missing_person_name || "")
          .toLowerCase()
          .includes(term) ||
        String(event.event_type || "")
          .toLowerCase()
          .includes(term) ||
        String(event.description || "")
          .toLowerCase()
          .includes(term) ||
        String(event.created_by || "")
          .toLowerCase()
          .includes(term);

      const matchesType =
        eventTypeFilter === "all" ||
        String(event.event_type || "") === eventTypeFilter;

      return matchesSearch && matchesType;
    });

    result.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      if (sortOrder === "oldest") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });

    return result;
  }, [events, search, eventTypeFilter, sortOrder]);

  const uniqueCases = useMemo(() => {
    return new Set(
      events
        .map((event) => event.missing_person_id)
        .filter(
          (id) => id !== null && id !== undefined && id !== ""
        )
    ).size;
  }, [events]);

  const uniqueEventTypes = useMemo(() => {
    return new Set(
      events
        .map((event) => event.event_type)
        .filter(Boolean)
    ).size;
  }, [events]);

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  };

  const formatShortDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name) => {
    if (!name) {
      return "?";
    }

    const words = String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  };

  const getEventTypeClass = (type) => {
    const normalized = String(type || "")
      .toLowerCase()
      .replace(/\s+/g, "-");

    if (
      normalized.includes("sighting") ||
      normalized.includes("found")
    ) {
      return "event-type-green";
    }

    if (
      normalized.includes("update") ||
      normalized.includes("updated")
    ) {
      return "event-type-teal";
    }

    if (
      normalized.includes("status") ||
      normalized.includes("change")
    ) {
      return "event-type-gold";
    }

    if (
      normalized.includes("report") ||
      normalized.includes("created")
    ) {
      return "event-type-brown";
    }

    return "event-type-neutral";
  };

  const handleDelete = async (eventId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this case event? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(eventId);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("You are not logged in.");
      }

      const response = await fetch(
        `${API_BASE}/api/case-events/admin/${eventId}`,
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
          data.msg || data.message || "Failed to delete case event."
        );
      }

      setEvents((currentEvents) =>
        currentEvents.filter((event) => event.id !== eventId)
      );

      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null);
      }
    } catch (err) {
      console.error("Delete case event error:", err);
      setError(err.message || "Failed to delete case event.");
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setEventTypeFilter("all");
    setSortOrder("newest");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    eventTypeFilter !== "all" ||
    sortOrder !== "newest";

  return (
    <AdminLayout title="Case Events" subtitle="Monitor the complete activity history for all missing-person cases.">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px", gap: "8px" }}>
        <button
          type="button"
          className="admin-events-refresh-button"
          onClick={loadEvents}
          disabled={loading}
        >
          <span className={loading ? "refresh-spinning" : ""}>↻</span>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <main className="admin-events-content">
        <section className="admin-events-summary">
          <div className="admin-event-stat-card">
            <div className="admin-event-stat-icon events-icon">
              ◈
            </div>

            <div className="admin-event-stat-content">
              <span>Total Events</span>
              <strong>{events.length}</strong>
              <small>All recorded activities</small>
            </div>
          </div>

          <div className="admin-event-stat-card">
            <div className="admin-event-stat-icon cases-icon">
              ◉
            </div>

            <div className="admin-event-stat-content">
              <span>Cases Represented</span>
              <strong>{uniqueCases}</strong>
              <small>Unique missing-person cases</small>
            </div>
          </div>

          <div className="admin-event-stat-card">
            <div className="admin-event-stat-icon types-icon">
              ◆
            </div>

            <div className="admin-event-stat-content">
              <span>Event Types</span>
              <strong>{uniqueEventTypes}</strong>
              <small>Different activity categories</small>
            </div>
          </div>

          <div className="admin-event-stat-card">
            <div className="admin-event-stat-icon showing-icon">
              ▣
            </div>

            <div className="admin-event-stat-content">
              <span>Showing</span>
              <strong>{filteredEvents.length}</strong>
              <small>
                {hasActiveFilters
                  ? "After applying filters"
                  : "Currently displayed"}
              </small>
            </div>
          </div>
        </section>

        <section className="admin-events-toolbar">
          <div className="admin-events-toolbar-heading">
            <div className="admin-events-section-label">
              CASE MANAGEMENT
            </div>

            <h2>Case Activity Timeline</h2>

            <p>
              Review every recorded activity connected to a
              missing-person case.
            </p>
          </div>

          <div className="admin-events-controls">
            <div className="admin-events-search">
              <span className="admin-events-search-icon">⌕</span>

              <input
                type="text"
                placeholder="Search events, cases, people..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {search && (
                <button
                  type="button"
                  className="admin-events-clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <select
              className="admin-events-filter"
              value={eventTypeFilter}
              onChange={(e) =>
                setEventTypeFilter(e.target.value)
              }
            >
              <option value="all">All event types</option>

              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              className="admin-events-filter admin-events-sort"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </section>

        {hasActiveFilters && (
          <div className="admin-events-filter-summary">
            <div>
              <span className="filter-summary-dot"></span>
              Showing{" "}
              <strong>{filteredEvents.length}</strong> of{" "}
              <strong>{events.length}</strong> events
            </div>

            <button
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}

        {error && (
          <div className="admin-events-error">
            <div className="admin-events-error-icon">!</div>

            <div>
              <strong>Something went wrong</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={loadEvents}
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="admin-events-state">
            <div className="admin-events-spinner"></div>

            <h3>Loading case events</h3>

            <p>
              Retrieving the latest case activity records...
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="admin-events-empty">
            <div className="admin-events-empty-icon">
              ◌
            </div>

            <h3>
              {hasActiveFilters
                ? "No matching case events"
                : "No case events yet"}
            </h3>

            <p>
              {hasActiveFilters
                ? "Try changing your search or filter settings."
                : "Case timeline events will appear here when they are recorded."}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                className="admin-events-empty-button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <section className="admin-events-table-card">
            <div className="admin-events-table-top">
              <div>
                <span className="admin-events-record-count">
                  {filteredEvents.length}
                </span>

                <span>
                  {filteredEvents.length === 1
                    ? " case event"
                    : " case events"}
                </span>
              </div>

              <span className="admin-events-live-indicator">
                <span></span>
                Records loaded
              </span>
            </div>

            <div className="admin-events-table-wrapper">
              <table className="admin-events-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Case / Person</th>
                    <th>Event Type</th>
                    <th>Activity</th>
                    <th>Created By</th>
                    <th>Date & Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <div className="admin-events-event-id">
                          <span className="admin-events-event-dot"></span>

                          <div>
                            <strong>#{event.id}</strong>
                            <small>Event record</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="admin-events-case">
                          <div className="admin-events-person-avatar">
                            {getInitials(
                              event.missing_person_name
                            )}
                          </div>

                          <div className="admin-events-case-info">
                            <strong>
                              {event.missing_person_name ||
                                "Unknown Person"}
                            </strong>

                            <span>
                              Case #
                              {event.missing_person_id || "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-events-type ${getEventTypeClass(
                            event.event_type
                          )}`}
                        >
                          {event.event_type || "Unspecified"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-events-description">
                          {event.description || (
                            <span className="muted-text">
                              No description provided
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="admin-events-creator">
                          <span className="creator-icon">
                            U
                          </span>

                          <span>
                            User #
                            {event.created_by || "—"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="admin-events-date">
                          <strong>
                            {formatShortDate(
                              event.created_at
                            )}
                          </strong>

                          <span>
                            {event.created_at
                              ? new Date(
                                  event.created_at
                                ).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : "—"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="admin-events-actions">
                          <button
                            type="button"
                            className="admin-events-view-button"
                            onClick={() =>
                              setSelectedEvent(event)
                            }
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="admin-events-delete-button"
                            onClick={() =>
                              handleDelete(event.id)
                            }
                            disabled={
                              deletingId === event.id
                            }
                          >
                            {deletingId === event.id
                              ? "..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {selectedEvent && (
        <div
          className="admin-events-modal-overlay"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="admin-events-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-events-modal-header">
              <div className="admin-events-modal-heading">
                <div className="admin-events-modal-icon">
                  ◈
                </div>

                <div>
                  <p>CASE EVENT RECORD</p>
                  <h2>
                    Event #{selectedEvent.id}
                  </h2>

                  <span>
                    Recorded case activity
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="admin-events-close-button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="admin-events-modal-case-banner">
              <div className="admin-events-modal-person-avatar">
                {getInitials(
                  selectedEvent.missing_person_name
                )}
              </div>

              <div>
                <span>RELATED MISSING-PERSON CASE</span>

                <strong>
                  {selectedEvent.missing_person_name ||
                    "Unknown Person"}
                </strong>

                <small>
                  Case #
                  {selectedEvent.missing_person_id || "—"}
                </small>
              </div>

              <span
                className={`admin-events-type modal-event-type ${getEventTypeClass(
                  selectedEvent.event_type
                )}`}
              >
                {selectedEvent.event_type ||
                  "Unspecified"}
              </span>
            </div>

            <div className="admin-events-modal-body">
              <div className="admin-events-detail">
                <span>Event ID</span>

                <strong>
                  #{selectedEvent.id}
                </strong>
              </div>

              <div className="admin-events-detail">
                <span>Case ID</span>

                <strong>
                  #{selectedEvent.missing_person_id || "—"}
                </strong>
              </div>

              <div className="admin-events-detail">
                <span>Event Type</span>

                <strong>
                  {selectedEvent.event_type ||
                    "Unspecified"}
                </strong>
              </div>

              <div className="admin-events-detail">
                <span>Created By</span>

                <strong>
                  User #
                  {selectedEvent.created_by || "—"}
                </strong>
              </div>

              <div className="admin-events-detail">
                <span>Date</span>

                <strong>
                  {formatShortDate(
                    selectedEvent.created_at
                  )}
                </strong>
              </div>

              <div className="admin-events-detail">
                <span>Time</span>

                <strong>
                  {selectedEvent.created_at
                    ? new Date(
                        selectedEvent.created_at
                      ).toLocaleTimeString()
                    : "—"}
                </strong>
              </div>

              <div className="admin-events-detail admin-events-detail-full">
                <span>Activity Description</span>

                <div className="admin-events-detail-description">
                  {selectedEvent.description ||
                    "No description available for this event."}
                </div>
              </div>

              <div className="admin-events-record-note">
                <span className="record-note-icon">✓</span>

                <div>
                  <strong>Administrative record</strong>

                  <p>
                    This event is part of the official case
                    activity history maintained by
                    ReConnect Ethiopia.
                  </p>
                </div>
              </div>
            </div>

            <div className="admin-events-modal-footer">
              <button
                type="button"
                className="admin-events-modal-delete"
                onClick={() =>
                  handleDelete(selectedEvent.id)
                }
                disabled={
                  deletingId === selectedEvent.id
                }
              >
                {deletingId === selectedEvent.id
                  ? "Deleting..."
                  : "Delete Event"}
              </button>

              <button
                type="button"
                className="admin-events-modal-cancel"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminCaseEvents;