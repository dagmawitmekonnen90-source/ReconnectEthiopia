import API_BASE from "../api.js";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import "./AdminUsers.css";

const API_BASE = API_BASE;

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    role: "user",
  });

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const token = localStorage.getItem("access_token");

  let currentUser = {};

  try {
    currentUser = JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    currentUser = {};
  }

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.msg ||
            "Failed to load users."
        );
      }

      setUsers(data.users || []);
    } catch (err) {
      setError(
        err.message || "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return users;
    }

    return users.filter((user) => {
      return (
        String(user.id || "")
          .toLowerCase()
          .includes(search) ||
        String(user.full_name || "")
          .toLowerCase()
          .includes(search) ||
        String(user.email || "")
          .toLowerCase()
          .includes(search) ||
        String(user.role || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [users, searchTerm]);

  const adminCount = users.filter(
    (user) => user.role === "admin"
  ).length;

  const regularUserCount = users.filter(
    (user) => user.role === "user"
  ).length;

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString();
  };

  const getInitial = (user) => {
    const name =
      user?.full_name ||
      user?.email ||
      "U";

    return name
      .trim()
      .charAt(0)
      .toUpperCase();
  };

  const openEditModal = (user) => {
    setEditingUser(user);

    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
      role: user.role || "user",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    if (!editingUser) return;

    if (!editForm.full_name.trim()) {
      alert("Full name is required.");
      return;
    }

    if (!editForm.email.trim()) {
      alert("Email is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE}/api/admin/users/${editingUser.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: editForm.full_name.trim(),
            email: editForm.email.trim(),
            role: editForm.role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.msg ||
            "Failed to update user."
        );
      }

      const updatedUser = data.user;

      setUsers((current) =>
        current.map((user) =>
          user.id === editingUser.id
            ? updatedUser
            : user
        )
      );

      if (
        selectedUser?.id === editingUser.id
      ) {
        setSelectedUser(updatedUser);
      }

      /*
       * Keep the browser's stored user information
       * synchronized when the current account is edited.
       */
      if (
        Number(editingUser.id) ===
        Number(currentUser.id)
      ) {
        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );
      }

      setEditingUser(null);
    } catch (err) {
      alert(
        err.message ||
          "Failed to update user."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    const isCurrentUser =
      Number(user.id) ===
      Number(currentUser.id);

    if (isCurrentUser) {
      alert(
        "You cannot delete the administrator account currently being used."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${
        user.full_name || user.email
      }?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(user.id);

      const response = await fetch(
        `${API_BASE}/api/admin/users/${user.id}`,
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
          data.message ||
            data.msg ||
            "Failed to delete user."
        );
      }

      setUsers((current) =>
        current.filter(
          (item) => item.id !== user.id
        )
      );

      if (
        selectedUser?.id === user.id
      ) {
        setSelectedUser(null);
      }
    } catch (err) {
      alert(
        err.message ||
          "Failed to delete user."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout title="User Management" subtitle="Manage registered users, roles, and account access.">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
        <button
          className="admin-users-refresh-button"
          onClick={fetchUsers}
          disabled={loading}
        >
          <span className="refresh-icon">↻</span>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* CONTENT */}

        {/* PAGE INTRO */}

        <section className="admin-users-intro">
          <div>
            <span className="admin-users-section-label">
              ACCOUNT DIRECTORY
            </span>

            <h2>
              Platform users
            </h2>

            <p>
              Review account activity and maintain
              appropriate access levels across the
              ReConnect Ethiopia platform.
            </p>
          </div>

          <div className="admin-users-record-count">
            <span>Showing</span>
            <strong>{filteredUsers.length}</strong>
            <small>
              of {users.length} registered accounts
            </small>
          </div>
        </section>

        {/* STATISTICS */}

        <section className="admin-users-summary">

          <div className="admin-users-stat-card total-card">
            <div className="user-stat-icon">
              <span>◎</span>
            </div>

            <div className="user-stat-content">
              <span className="stat-label">
                Total Users
              </span>

              <strong>
                {users.length}
              </strong>

              <small>
                Registered accounts
              </small>
            </div>

            <div className="stat-accent"></div>
          </div>

          <div className="admin-users-stat-card regular-card">
            <div className="user-stat-icon">
              <span>◇</span>
            </div>

            <div className="user-stat-content">
              <span className="stat-label">
                Regular Users
              </span>

              <strong>
                {regularUserCount}
              </strong>

              <small>
                Standard platform access
              </small>
            </div>

            <div className="stat-accent"></div>
          </div>

          <div className="admin-users-stat-card admin-card">
            <div className="user-stat-icon">
              <span>★</span>
            </div>

            <div className="user-stat-content">
              <span className="stat-label">
                Administrators
              </span>

              <strong>
                {adminCount}
              </strong>

              <small>
                Elevated system access
              </small>
            </div>

            <div className="stat-accent"></div>
          </div>

        </section>

        {/* MAIN PANEL */}

        <section className="admin-users-panel">

          <div className="admin-users-toolbar">

            <div className="admin-users-toolbar-copy">

              <div className="toolbar-title-row">
                <span className="toolbar-dot"></span>

                <h2>
                  Registered Users
                </h2>
              </div>

              <p>
                Search users, review account details,
                manage roles, or remove accounts.
              </p>

            </div>

            <div className="admin-users-search">

              <span className="search-icon">
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search by name, email, role or ID..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
              />

              {searchTerm && (
                <button
                  type="button"
                  className="clear-user-search"
                  onClick={() =>
                    setSearchTerm("")
                  }
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}

            </div>

          </div>

          {/* LOADING */}

          {loading ? (
            <div className="admin-users-state">

              <div className="user-loading-spinner"></div>

              <h3>
                Loading user directory
              </h3>

              <p>
                Retrieving registered accounts...
              </p>

            </div>

          ) : error ? (

            /* ERROR */

            <div className="admin-users-state error-state">

              <div className="user-state-icon">
                !
              </div>

              <h3>
                Unable to load users
              </h3>

              <p>
                {error}
              </p>

              <button
                className="user-retry-button"
                onClick={fetchUsers}
              >
                Try Again
              </button>

            </div>

          ) : filteredUsers.length === 0 ? (

            /* EMPTY */

            <div className="admin-users-state">

              <div className="user-state-icon">
                ⌕
              </div>

              <h3>
                {searchTerm
                  ? "No matching users found"
                  : "No users found"}
              </h3>

              <p>
                {searchTerm
                  ? "Try a different name, email, role, or ID."
                  : "Registered users will appear here."}
              </p>

            </div>

          ) : (

            /* TABLE */

            <div className="admin-users-table-wrapper">

              <table className="admin-users-table">

                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredUsers.map((user) => {

                    const isCurrentUser =
                      Number(user.id) ===
                      Number(currentUser.id);

                    return (
                      <tr
                        key={user.id}
                        className={
                          isCurrentUser
                            ? "current-user-row"
                            : ""
                        }
                      >

                        <td>
                          <span className="user-id">
                            #{user.id}
                          </span>
                        </td>

                        <td>
                          <div className="user-name-cell">

                            <div
                              className={`user-avatar ${
                                user.role === "admin"
                                  ? "admin-avatar"
                                  : ""
                              }`}
                            >
                              {getInitial(user)}
                            </div>

                            <div className="user-name-info">

                              <strong>
                                {user.full_name ||
                                  "Unnamed User"}
                              </strong>

                              {isCurrentUser && (
                                <span className="current-user-label">
                                  <span className="current-dot"></span>
                                  Current account
                                </span>
                              )}

                            </div>

                          </div>
                        </td>

                        <td>
                          <span className="user-email">
                            {user.email}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`role-badge ${
                              user.role === "admin"
                                ? "role-admin"
                                : "role-user"
                            }`}
                          >
                            <span className="role-dot"></span>

                            {user.role === "admin"
                              ? "Administrator"
                              : "User"}
                          </span>
                        </td>

                        <td>
                          <span className="registered-date">
                            {formatDate(
                              user.created_at
                            )}
                          </span>
                        </td>

                        <td>

                          <div className="user-action-buttons">

                            <button
                              className="user-view-button"
                              onClick={() =>
                                setSelectedUser(user)
                              }
                            >
                              View
                            </button>

                            <button
                              className="user-edit-button"
                              onClick={() =>
                                openEditModal(user)
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="user-delete-button"
                              onClick={() =>
                                handleDelete(user)
                              }
                              disabled={
                                isCurrentUser ||
                                deletingId === user.id
                              }
                              title={
                                isCurrentUser
                                  ? "You cannot delete your current admin account"
                                  : "Delete user"
                              }
                            >
                              {deletingId === user.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

          {/* TABLE FOOTER */}

          {!loading &&
            !error &&
            filteredUsers.length > 0 && (
              <div className="admin-users-table-footer">

                <span>
                  Displaying{" "}
                  <strong>
                    {filteredUsers.length}
                  </strong>{" "}
                  {filteredUsers.length === 1
                    ? "account"
                    : "accounts"}
                </span>

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchTerm("")
                    }
                  >
                    Clear search
                  </button>
                )}

              </div>
            )}

        </section>

        {/* ADMIN NOTE */}

        <section className="admin-users-security-note">

          <div className="security-note-icon">
            ✓
          </div>

          <div>
            <strong>
              Administrator access
            </strong>

            <p>
              Administrator accounts have access to
              sensitive case-management functions.
              Assign elevated roles only to trusted
              personnel.
            </p>
          </div>

        </section>

      {/* VIEW USER MODAL */}

      {selectedUser && (
        <div
          className="admin-user-modal-overlay"
          onClick={() =>
            setSelectedUser(null)
          }
        >

          <div
            className="admin-user-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="admin-user-modal-header">

              <div>
                <p>
                  USER ACCOUNT
                </p>

                <h2>
                  Account #{selectedUser.id}
                </h2>
              </div>

              <button
                className="admin-user-modal-close"
                onClick={() =>
                  setSelectedUser(null)
                }
                aria-label="Close"
              >
                ×
              </button>

            </div>

            <div className="admin-user-modal-body">

              <div className="user-profile-highlight">

                <div
                  className={`large-user-avatar ${
                    selectedUser.role === "admin"
                      ? "admin-avatar"
                      : ""
                  }`}
                >
                  {getInitial(selectedUser)}
                </div>

                <div className="profile-main">

                  <h3>
                    {selectedUser.full_name ||
                      "Unnamed User"}
                  </h3>

                  <span>
                    {selectedUser.email}
                  </span>

                  <div className="profile-role">
                    <span
                      className={`role-badge ${
                        selectedUser.role ===
                        "admin"
                          ? "role-admin"
                          : "role-user"
                      }`}
                    >
                      <span className="role-dot"></span>

                      {selectedUser.role ===
                      "admin"
                        ? "Administrator"
                        : "Regular User"}
                    </span>

                    {Number(
                      selectedUser.id
                    ) ===
                      Number(
                        currentUser.id
                      ) && (
                      <span className="profile-current">
                        Current account
                      </span>
                    )}
                  </div>

                </div>

              </div>

              <div className="user-detail-grid">

                <div className="user-detail-item">
                  <span>
                    USER ID
                  </span>

                  <strong>
                    #{selectedUser.id}
                  </strong>
                </div>

                <div className="user-detail-item">
                  <span>
                    ACCOUNT ROLE
                  </span>

                  <strong>
                    {selectedUser.role ===
                    "admin"
                      ? "Administrator"
                      : "Regular User"}
                  </strong>
                </div>

                <div className="user-detail-item">
                  <span>
                    EMAIL ADDRESS
                  </span>

                  <strong>
                    {selectedUser.email}
                  </strong>
                </div>

                <div className="user-detail-item">
                  <span>
                    REGISTERED
                  </span>

                  <strong>
                    {formatDate(
                      selectedUser.created_at
                    )}
                  </strong>
                </div>

              </div>

              <div className="user-account-note">

                <span className="note-mark">
                  i
                </span>

                <p>
                  Account information is managed by
                  the administration panel. Password
                  credentials are not displayed here.
                </p>

              </div>

            </div>

            <div className="admin-user-modal-footer">

              <button
                className="user-modal-close-button"
                onClick={() =>
                  setSelectedUser(null)
                }
              >
                Close
              </button>

              <button
                className="user-modal-edit-button"
                onClick={() => {
                  setSelectedUser(null);
                  openEditModal(
                    selectedUser
                  );
                }}
              >
                Edit User
              </button>

            </div>

          </div>

        </div>
      )}

      {/* EDIT USER MODAL */}

      {editingUser && (
        <div
          className="admin-user-modal-overlay"
          onClick={() =>
            !saving &&
            setEditingUser(null)
          }
        >

          <div
            className="admin-user-modal edit-user-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="admin-user-modal-header">

              <div>
                <p>
                  USER MANAGEMENT
                </p>

                <h2>
                  Edit User
                </h2>
              </div>

              <button
                className="admin-user-modal-close"
                onClick={() =>
                  !saving &&
                  setEditingUser(null)
                }
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleUpdateUser}
            >

              <div className="admin-user-modal-body">

                <div className="edit-user-heading">

                  <div className="edit-user-avatar">
                    {getInitial(editingUser)}
                  </div>

                  <div>
                    <strong>
                      {editingUser.full_name ||
                        "Unnamed User"}
                    </strong>

                    <span>
                      Account #{editingUser.id}
                    </span>
                  </div>

                </div>

                <div className="edit-warning">

                  <span className="warning-icon">
                    !
                  </span>

                  <div>
                    <strong>
                      Access and account information
                    </strong>

                    <span>
                      Changes made here affect the
                      user's account information and
                      access level.
                    </span>
                  </div>

                </div>

                <div className="admin-user-form-group">

                  <label htmlFor="full_name">
                    Full Name
                  </label>

                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={editForm.full_name}
                    onChange={handleEditChange}
                    placeholder="Enter full name"
                    required
                  />

                </div>

                <div className="admin-user-form-group">

                  <label htmlFor="email">
                    Email Address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    placeholder="Enter email address"
                    required
                  />

                </div>

                <div className="admin-user-form-group">

                  <label htmlFor="role">
                    Account Role
                  </label>

                  <select
                    id="role"
                    name="role"
                    value={editForm.role}
                    onChange={handleEditChange}
                  >
                    <option value="user">
                      Regular User
                    </option>

                    <option value="admin">
                      Administrator
                    </option>
                  </select>

                  <small>
                    Administrators can access the
                    complete administration area.
                  </small>

                </div>

              </div>

              <div className="admin-user-modal-footer">

                <button
                  type="button"
                  className="user-modal-close-button"
                  onClick={() =>
                    setEditingUser(null)
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="user-modal-save-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving Changes..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </AdminLayout>
  );
}

export default AdminUsers;