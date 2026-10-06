import API_BASE from "../api.js";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GlobalControls from "../components/GlobalControls";
import SiteNavbar from "../components/SiteNavbar";
import PageHeader from "../components/PageHeader";
import "./MissingPersonDetails.css";

function MissingPersonDetails() {
  const { id } = useParams();
  const { t } = useTranslation();

  const [person, setPerson] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        const personResponse = await fetch(
          `${API_BASE}/api/missing-persons/${id}`,
          { headers: authHeaders }
        );

        const personData = await personResponse.json();

        if (!personResponse.ok) {
          throw new Error(personData.message || personData.error || "Failed to load missing person.");
        }

        setPerson(personData.missing_person || personData);

        try {
          const sightingsResponse = await fetch(
            `${API_BASE}/api/sightings?missing_person_id=${id}`,
            { headers: authHeaders }
          );
          if (sightingsResponse.ok) {
            const sightingsData = await sightingsResponse.json();
            setSightings(Array.isArray(sightingsData) ? sightingsData : sightingsData.sightings || []);
          }
        } catch {
          setSightings([]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="details-page">
        <GlobalControls />
        <SiteNavbar />
        <div className="details-message">{t("missingPersonDetails.loading")}</div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="details-page">
        <GlobalControls />
        <SiteNavbar />
        <div className="details-message error">
          <h2>{t("missingPersonDetails.errorTitle")}</h2>
          <p>{error || t("missingPersonDetails.errorDefault")}</p>
          <Link to="/missing-persons" className="details-back-button">
            {t("missingPersonDetails.backBtn")}
          </Link>
        </div>
      </div>
    );
  }

  const photoUrl = person.photo_url
    ? person.photo_url.startsWith("http") ? person.photo_url : `${API_BASE}${person.photo_url}`
    : null;

  return (
    <div className="details-page">

      <GlobalControls />
      <SiteNavbar />

      <PageHeader
        eyebrow={t("missingPersonDetails.eyebrow")}
        title={t("missingPersonDetails.title")}
        subtitle={t("missingPersonDetails.desc")}
        action={
          <Link to="/missing-persons" className="details-back-button">
            ← {t("missingPersonDetails.backBtn")}
          </Link>
        }
      />

      <main className="details-content">

        <section className="person-profile">
          <div className="person-photo">
            {photoUrl ? (
              <img src={photoUrl} alt={person.full_name} />
            ) : (
              <div className="person-photo-placeholder">👤</div>
            )}
          </div>

          <div className="person-information">
            <div className="person-title-row">
              <div>
                <p className="case-id">{t("missingPersonDetails.caseLabel", { id: person.id })}</p>
                <h2>{person.full_name}</h2>
              </div>
              <span className={`details-status ${person.status?.toLowerCase() === "active" ? "status-active" : "status-other"}`}>
                {person.status || "active"}
              </span>
            </div>

            <div className="information-grid">
              <div>
                <span>{t("missingPersonDetails.ageLabel")}</span>
                <strong>{person.age || t("missingPersonDetails.notProvided")}</strong>
              </div>
              <div>
                <span>{t("missingPersonDetails.genderLabel")}</span>
                <strong>{person.gender || t("missingPersonDetails.notProvided")}</strong>
              </div>
              <div>
                <span>{t("missingPersonDetails.locationLabel")}</span>
                <strong>{person.last_seen_location || t("missingPersonDetails.notProvided")}</strong>
              </div>
              <div>
                <span>{t("missingPersonDetails.dateLabel")}</span>
                <strong>{person.last_seen_date || t("missingPersonDetails.notProvided")}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="details-section">
          <div className="section-heading">
            <div>
              <p>{t("missingPersonDetails.caseInfoLabel")}</p>
              <h2>{t("missingPersonDetails.descriptionTitle")}</h2>
            </div>
          </div>
          <div className="description-box">
            {person.description ? (
              <p>{person.description}</p>
            ) : (
              <p className="muted">{t("missingPersonDetails.noDescription")}</p>
            )}
          </div>
        </section>

        <section className="details-section">
          <div className="section-heading">
            <div>
              <p>{t("missingPersonDetails.sightingsLabel")}</p>
              <h2>{t("missingPersonDetails.sightingsTitle")}</h2>
            </div>
            <Link to="/report-sighting" className="sighting-button">
              + {t("missingPersonDetails.reportSightingBtn")}
            </Link>
          </div>

          {sightings.length === 0 ? (
            <div className="no-sightings">
              <div>👁</div>
              <h3>{t("missingPersonDetails.noSightingsTitle")}</h3>
              <p>{t("missingPersonDetails.noSightingsDesc")}</p>
            </div>
          ) : (
            <div className="sightings-list">
              {sightings.map((sighting) => (
                <div className="sighting-card" key={sighting.id}>
                  <div className="sighting-marker">👁</div>
                  <div className="sighting-information">
                    <h3>{sighting.location || t("missingPersonDetails.locationNotProvided")}</h3>
                    <p>{sighting.description || t("missingPersonDetails.noSightingDesc")}</p>
                    <div className="sighting-meta">
                      <span>{t("missingPersonDetails.sightingDate")} {sighting.sighting_date || t("missingPersonDetails.notProvided")}</span>
                      {sighting.id && <span>Sighting #{sighting.id}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="details-actions">
          <Link to="/missing-persons" className="secondary-action">
            {t("missingPersonDetails.actionsBack")}
          </Link>
          <Link to="/report-sighting" className="primary-action">
            {t("missingPersonDetails.actionsSighting")}
          </Link>
        </section>

      </main>
    </div>
  );
}

export default MissingPersonDetails;
