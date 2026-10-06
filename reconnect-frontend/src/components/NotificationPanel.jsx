import API_BASE from "../api.js";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./NotificationPanel.css";

const API = API_BASE;

const TYPE_META = {
  sighting_reported:   { icon: "👁", color: "#4db8af", label: "New Sighting" },
  institutional_match: { icon: "🏥", color: "#d4a017", label: "Potential Match" },
};

export default function NotificationPanel() {
  const [open, setOpen]         = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(false);
  const panelRef                = useRef(null);

  const token = localStorage.getItem("access_token");

  // Fetch unread count on mount (lightweight)
  useEffect(() => {
    if (!token) return;
    fetchCount();
    // Poll every 60 s while page is open
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchCount = async () => {
    try {
      const res = await fetch(`${API}/api/notifications?unread_only=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setUnread(data.unread_count || 0);
    } catch {}
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnread(data.unread_count || 0);
    } catch {}
    setLoading(false);
  };

  const togglePanel = () => {
    if (!open) fetchAll();
    setOpen(v => !v);
  };

  const markRead = async (id) => {
    try {
      await fetch(`${API}/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API}/api/notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {}
  };

  const deleteNotif = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`${API}/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60)   return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div className="notif-wrapper" ref={panelRef}>
      {/* Bell button */}
      <button
        className="notif-bell"
        onClick={togglePanel}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <span className="notif-bell-icon">🔔</span>
        {unread > 0 && (
          <span className="notif-badge">{unread > 99 ? "99+" : unread}</span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="notif-panel">
          <div className="notif-panel__header">
            <h3>Notifications {unread > 0 && <span className="notif-count-label">{unread} new</span>}</h3>
            {unread > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>
            )}
          </div>

          <div className="notif-panel__body">
            {loading && (
              <div className="notif-loading"><div className="notif-spinner" /></div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="notif-empty">
                <span>🔔</span>
                <p>No notifications yet</p>
              </div>
            )}

            {!loading && notifications.map(n => {
              const meta = TYPE_META[n.notification_type] || { icon: "●", color: "#888", label: "Notification" };
              const link = n.missing_person_id ? `/missing-persons/${n.missing_person_id}` : null;

              const content = (
                <div
                  className={`notif-item${n.is_read ? "" : " notif-item--unread"}`}
                  onClick={() => !n.is_read && markRead(n.id)}
                  key={n.id}
                >
                  <div className="notif-item__icon" style={{ background: meta.color + "22", color: meta.color }}>
                    {meta.icon}
                  </div>
                  <div className="notif-item__content">
                    <span className="notif-item__type" style={{ color: meta.color }}>{meta.label}</span>
                    <strong className="notif-item__title">{n.title}</strong>
                    <p className="notif-item__msg">{n.message}</p>
                    <small className="notif-item__time">{formatTime(n.created_at)}</small>
                  </div>
                  <button
                    className="notif-item__delete"
                    onClick={(e) => deleteNotif(n.id, e)}
                    aria-label="Dismiss"
                  >×</button>
                </div>
              );

              return link ? (
                <Link to={link} className="notif-item-link" key={n.id} onClick={() => { setOpen(false); if (!n.is_read) markRead(n.id); }}>
                  {content}
                </Link>
              ) : content;
            })}
          </div>

          {notifications.length > 0 && (
            <div className="notif-panel__footer">
              {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
