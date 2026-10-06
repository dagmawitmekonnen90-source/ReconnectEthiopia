import API_BASE from "../api.js";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GlobalControls from "../components/GlobalControls";
import SiteNavbar from "../components/SiteNavbar";
import PageHeader from "../components/PageHeader";
import "./MissingPersons.css";

function MissingPersons() {
  const { t } = useTranslation();

  const [missingPersons, setMissingPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");

  useEffect(() => {
    const fetchMissingPersons = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(
          `${API_BASE}/api/missing-persons`,
          { headers }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load missing persons.");
        }

        setMissingPersons(Array.isArray(data) ? data : data.missing_persons || []);
      } catch (err) {
        console.error("Missing persons error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMissingPersons();
  }, []);

  const normalizeStatus = (status) => {
    const value = String(status || "active").trim().toLowerCase();
    if (value === "missing" || value === "active") return "missing";
    if (value === "information_received" || value === "information received") return "information_received";
    if (value === "under_investigation" || value === "under investigation") return "under_investigation";
    if (value === "found") return "found";
    if (value === "reunited" || value === "reunited with family") return "reunited";
    if (value === "closed" || value === "case closed") return "closed";
    return value;
  };

  const getStatusInfo = (status) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case "missing": return { label: t("missingPersons.statusMissing"), className: "status-missing", icon: "●" };
      case "information_received": return { label: t("missingPersons.statusInfoReceived"), className: "status-information", icon: "●" };
      case "under_investigation": return { label: t("missingPersons.statusUnderInvestigation"), className: "status-investigation", icon: "●" };
      case "found": return { label: t("missingPersons.statusFound"), className: "status-found", icon: "●" };
      case "reunited": return { label: t("missingPersons.statusReunited"), className: "status-reunited", icon: "●" };
      case "closed": return { label: t("missingPersons.statusClosed"), className: "status-closed", icon: "●" };
      default: return { label: t("missingPersons.statusMissing"), className: "status-missing", icon: "●" };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t("missingPersons.notProvided");
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatGender = (gender) => {
    if (!gender) return t("missingPersons.notProvided");
    const value = String(gender).toLowerCase();
    if (value === "male" || value === "m") return t("missingPersons.male");
    if (value === "female" || value === "f") return t("missingPersons.female");
    return gender;
  };

  const locationOptions = useMemo(() => {
    const locations = missingPersons
      .map((p) => p.last_seen_location)
      .filter(Boolean)
      .map((l) => String(l).trim())
      .filter(Boolean);
    return [...new Set(locations)].sort((a, b) => a.localeCompare(b));
  }, [missingPersons]);

  const filteredPersons = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const filtered = missingPersons.filter((person) => {
      const name = String(person.full_name || "").toLowerCase();
      const location = String(person.last_seen_location || "").toLowerCase();
      const description = String(person.description || "").toLowerCase();
      const matchesSearch = !search || name.includes(search) || location.includes(search) || description.includes(search) || String(person.id || "").includes(search);
      const matchesGender = genderFilter === "all" || String(person.gender || "").toLowerCase() === genderFilter;
      const matchesStatus = statusFilter === "all" || normalizeStatus(person.status) === statusFilter;
      const age = Number(person.age);
      let matchesAge = true;
      if (ageFilter !== "all") {
        if (Number.isNaN(age)) matchesAge = false;
        else if (ageFilter === "child") matchesAge = age <= 12;
        else if (ageFilter === "teen") matchesAge = age >= 13 && age <= 17;
        else if (ageFilter === "adult") matchesAge = age >= 18 && age <= 59;
        else if (ageFilter === "senior") matchesAge = age >= 60;
      }
      const matchesLocation = locationFilter === "all" || String(person.last_seen_location || "").trim().toLowerCase() === locationFilter.toLowerCase();
      return matchesSearch && matchesGender && matchesStatus && matchesAge && matchesLocation;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || a.last_seen_date || 0).getTime();
      const dateB = new Date(b.created_at || b.last_seen_date || 0).getTime();
      return sortOrder === "oldest" ? dateA - dateB : dateB - dateA;
    });
  }, [missingPersons, searchTerm, genderFilter, statusFilter, ageFilter, locationFilter, sortOrder]);

  const totalCases = missingPersons.length;
  const missingCases = missingPersons.filter((p) => normalizeStatus(p.status) === "missing").length;
  const foundCases = missingPersons.filter((p) => normalizeStatus(p.status) === "found").length;
  const reunitedCases = missingPersons.filter((p) => normalizeStatus(p.status) === "reunited").length;

  const clearFilters = () => {
    setSearchTerm("");
    setGenderFilter("all");
    setStatusFilter("all");
    setAgeFilter("all");
    setLocationFilter("all");
    setSortOrder("recent");
  };

  const hasActiveFilters = searchTerm || genderFilter !== "all" || statusFilter !== "all" || ageFilter !== "all" || locationFilter !== "all";

  return (
    <div className="missing-page">

      <GlobalControls />
      <SiteNavbar />

      <PageHeader
        eyebrow={t("missingPersons.eyebrow")}
        title={t("missingPersons.title")}
        subtitle={t("missingPersons.desc")}
        action={
          <Link to="/report-missing" className="missing-report-button">
            <span>+</span>
            {t("missingPersons.reportBtn")}
          </Link>
        }
      />

      <main className="missing-content">
        {!loading && !error && (
          <>
            <section className="missing-statistics">
              <div className="missing-stat-card">
                <div className="missing-stat-icon">◎</div>
                <div><strong>{totalCases}</strong><span>{t("missingPersons.totalCases")}</span></div>
              </div>
              <div className="missing-stat-card">
                <div className="missing-stat-icon missing-stat-red">●</div>
                <div><strong>{missingCases}</strong><span>{t("missingPersons.missing")}</span></div>
              </div>
              <div className="missing-stat-card">
                <div className="missing-stat-icon missing-stat-green">●</div>
                <div><strong>{foundCases}</strong><span>{t("missingPersons.found")}</span></div>
              </div>
              <div className="missing-stat-card missing-stat-gold-card">
                <div className="missing-stat-icon missing-stat-gold">♥</div>
                <div><strong>{reunitedCases}</strong><span>{t("missingPersons.reunited")}</span></div>
              </div>
            </section>

            <section className="missing-search-panel">
              <div className="missing-search-heading">
                <div>
                  <span>{t("missingPersons.searchLabel")}</span>
                  <h2>{t("missingPersons.searchTitle")}</h2>
                </div>
                {hasActiveFilters && (
                  <button type="button" className="missing-clear-button" onClick={clearFilters}>
                    {t("missingPersons.clearFilters")}
                  </button>
                )}
              </div>

              <div className="missing-search-box">
                <span className="missing-search-icon">⌕</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("missingPersons.searchPlaceholder")}
                />
              </div>

              <div className="missing-filter-grid">
                <div className="missing-filter">
                  <label>{t("missingPersons.filterGender")}</label>
                  <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                    <option value="all">{t("missingPersons.allGenders")}</option>
                    <option value="male">{t("missingPersons.male")}</option>
                    <option value="female">{t("missingPersons.female")}</option>
                  </select>
                </div>

                <div className="missing-filter">
                  <label>{t("missingPersons.filterAge")}</label>
                  <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)}>
                    <option value="all">{t("missingPersons.allAges")}</option>
                    <option value="child">{t("missingPersons.child")}</option>
                    <option value="teen">{t("missingPersons.teen")}</option>
                    <option value="adult">{t("missingPersons.adult")}</option>
                    <option value="senior">{t("missingPersons.senior")}</option>
                  </select>
                </div>

                <div className="missing-filter">
                  <label>{t("missingPersons.filterStatus")}</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">{t("missingPersons.allStatuses")}</option>
                    <option value="missing">{t("missingPersons.statusMissing")}</option>
                    <option value="information_received">{t("missingPersons.statusInfoReceived")}</option>
                    <option value="under_investigation">{t("missingPersons.statusUnderInvestigation")}</option>
                    <option value="found">{t("missingPersons.statusFound")}</option>
                    <option value="reunited">{t("missingPersons.statusReunited")}</option>
                    <option value="closed">{t("missingPersons.statusClosed")}</option>
                  </select>
                </div>

                <div className="missing-filter">
                  <label>{t("missingPersons.filterLocation")}</label>
                  <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                    <option value="all">{t("missingPersons.allLocations")}</option>
                    {locationOptions.map((location) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                <div className="missing-filter">
                  <label>{t("missingPersons.filterSort")}</label>
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                    <option value="recent">{t("missingPersons.sortRecent")}</option>
                    <option value="oldest">{t("missingPersons.sortOldest")}</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="missing-results-header">
              <div>
                <span className="missing-results-label">{t("missingPersons.directoryLabel")}</span>
                <h2>{hasActiveFilters ? t("missingPersons.searchResults") : t("missingPersons.recentlyReported")}</h2>
              </div>
              <span className="missing-results-count">
                {t("missingPersons.casesFound_other", { count: filteredPersons.length })}
              </span>
            </section>
          </>
        )}

        {loading && (
          <div className="missing-message">
            <div className="missing-loading-spinner"></div>
            <h2>{t("missingPersons.loadingTitle")}</h2>
            <p>{t("missingPersons.loadingDesc")}</p>
          </div>
        )}

        {error && !loading && (
          <div className="missing-message error">
            <div className="empty-icon">!</div>
            <h2>{t("missingPersons.errorTitle")}</h2>
            <p>{error}</p>
            <button type="button" className="missing-retry-button" onClick={() => window.location.reload()}>
              {t("missingPersons.tryAgain")}
            </button>
          </div>
        )}

        {!loading && !error && filteredPersons.length === 0 && (
          <div className="missing-message">
            <div className="empty-icon">⌕</div>
            <h2>{t("missingPersons.emptyTitle")}</h2>
            <p>{t("missingPersons.emptyDesc")}</p>
            <button type="button" className="missing-empty-button" onClick={clearFilters}>
              {t("missingPersons.clearSearch")}
            </button>
          </div>
        )}

        {!loading && !error && filteredPersons.length > 0 && (
          <div className="missing-grid">
            {filteredPersons.map((person) => {
              const status = getStatusInfo(person.status);
              return (
                <article className="missing-card" key={person.id}>
                  <div className="missing-photo">
                    {person.photo_url ? (
                      <img
                        src={person.photo_url.startsWith("http") ? person.photo_url : `${API_BASE}${person.photo_url}`}
                        alt={person.full_name}
                      />
                    ) : (
                      <span>👤</span>
                    )}
                    <div className={`missing-photo-status ${status.className}`}>
                      <span>{status.icon}</span>
                      {status.label}
                    </div>
                  </div>

                  <div className="missing-card-body">
                    <div className="missing-card-top">
                      <span className="missing-case-label">{t("missingPersons.cardLabel")}</span>
                      {person.created_at && (
                        <span className="missing-reported-date">
                          {t("missingPersons.reported")} {formatDate(person.created_at)}
                        </span>
                      )}
                    </div>

                    <h2>{person.full_name}</h2>

                    <div className="missing-basic-info">
                      <span><strong>{person.age || "—"}</strong> {t("missingPersons.years")}</span>
                      <span className="missing-info-divider">•</span>
                      <span>{formatGender(person.gender)}</span>
                    </div>

                    <div className="missing-details">
                      <div className="missing-detail-row">
                        <span className="missing-detail-icon">📍</span>
                        <div>
                          <small>{t("missingPersons.lastSeen")}</small>
                          <p>{person.last_seen_location || t("missingPersons.locationNotProvided")}</p>
                        </div>
                      </div>
                      <div className="missing-detail-row">
                        <span className="missing-detail-icon">📅</span>
                        <div>
                          <small>{t("missingPersons.missingSince")}</small>
                          <p>{formatDate(person.last_seen_date)}</p>
                        </div>
                      </div>
                    </div>

                    {person.description && <p className="missing-description">{person.description}</p>}

                    <div className="missing-card-actions">
                      <Link to={`/missing-persons/${person.id}`} className="missing-view-button">
                        {t("missingPersons.viewCase")} <span>→</span>
                      </Link>
                      <Link to={`/missing-persons/${person.id}`} className="missing-information-button">
                        {t("missingPersons.haveInfo")}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <footer className="missing-footer">
        <span>{t("missingPersons.footer")}</span>
        <span>{t("missingPersons.footerTagline")}</span>
      </footer>

    </div>
  );
}

export default MissingPersons;
