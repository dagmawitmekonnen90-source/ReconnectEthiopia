from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import User, MissingPerson, Sighting


dashboard_reports_bp = Blueprint(
    "dashboard_reports",
    __name__,
    url_prefix="/api/dashboard"
)


@dashboard_reports_bp.route("/my-reports", methods=["GET"])
@jwt_required()
def get_my_reports():
    """
    Return all missing-person reports and sighting reports
    submitted by the currently logged-in user.
    """

    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    # ============================================================
    # GET USER'S MISSING-PERSON REPORTS
    # ============================================================

    missing_persons = (
        MissingPerson.query
        .filter_by(reported_by=user_id)
        .order_by(MissingPerson.created_at.desc())
        .all()
    )

    missing_reports = []

    for person in missing_persons:

        missing_reports.append({
            "id": person.id,
            "type": "missing_person",
            "full_name": person.full_name,
            "age": person.age,
            "gender": person.gender,
            "description": person.description,
            "last_seen_location": person.last_seen_location,

            "last_seen_date": (
                person.last_seen_date.isoformat()
                if person.last_seen_date
                else None
            ),

            "status": person.status,

            # Photo used by the dashboard
            "photo_url": person.photo_url,

            "created_at": (
                person.created_at.isoformat()
                if person.created_at
                else None
            )
        })


    # ============================================================
    # GET USER'S SIGHTING REPORTS
    # ============================================================

    sightings = (
        Sighting.query
        .filter_by(reported_by=user_id)
        .order_by(Sighting.created_at.desc())
        .all()
    )

    sighting_reports = []

    for sighting in sightings:

        missing_person = db.session.get(
            MissingPerson,
            sighting.missing_person_id
        )

        sighting_reports.append({
            "id": sighting.id,
            "type": "sighting",

            "missing_person_id": sighting.missing_person_id,

            "missing_person_name": (
                missing_person.full_name
                if missing_person
                else None
            ),

            "description": sighting.description,

            "location": sighting.location,

            "sighting_date": (
                sighting.sighting_date.isoformat()
                if sighting.sighting_date
                else None
            ),

            "created_at": (
                sighting.created_at.isoformat()
                if sighting.created_at
                else None
            )
        })


    # ============================================================
    # RETURN COMBINED MY REPORTS
    # ============================================================

    return jsonify({

        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email
        },

        "summary": {
            "total_missing_reports": len(missing_reports),

            "total_sighting_reports": len(sighting_reports),

            "total_reports": (
                len(missing_reports)
                + len(sighting_reports)
            )
        },

        "missing_reports": missing_reports,

        "sighting_reports": sighting_reports

    }), 200