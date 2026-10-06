from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity
from datetime import datetime

from app.extensions import db
from app.models import User, MissingPerson, Sighting
from app.utils.admin_required import admin_required


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
)


# ============================================================
# ADMIN DASHBOARD
# ============================================================

@admin_bp.route("/dashboard", methods=["GET"])
@admin_required()
def dashboard():

    total_users = User.query.count()
    total_missing_persons = MissingPerson.query.count()
    total_sightings = Sighting.query.count()

    active_cases = MissingPerson.query.filter_by(
        status="active"
    ).count()

    found_cases = MissingPerson.query.filter_by(
        status="found"
    ).count()

    closed_cases = MissingPerson.query.filter_by(
        status="closed"
    ).count()

    return jsonify({
        "message": "Admin dashboard data retrieved successfully",
        "statistics": {
            "total_users": total_users,
            "total_missing_persons": total_missing_persons,
            "total_sightings": total_sightings,
            "active_cases": active_cases,
            "found_cases": found_cases,
            "closed_cases": closed_cases
        }
    }), 200


# ============================================================
# ADMIN PROFILE
# ============================================================

@admin_bp.route("/me", methods=["GET"])
@admin_required()
def admin_profile():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if not user:
        return jsonify({
            "error": "Admin not found"
        }), 404

    return jsonify({
        "admin": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at.isoformat()
        }
    }), 200


# ============================================================
# GET ALL MISSING-PERSON REPORTS FOR ADMIN
# ============================================================

@admin_bp.route("/missing-persons", methods=["GET"])
@admin_required()
def admin_get_missing_persons():

    missing_persons = MissingPerson.query.order_by(
        MissingPerson.created_at.desc()
    ).all()

    results = []

    for person in missing_persons:

        # Find the user who submitted the report
        reporter = User.query.get(person.reported_by)

        results.append({
            "id": person.id,
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
            "reported_by": person.reported_by,
            "reported_by_name": (
                reporter.full_name
                if reporter
                else "Unknown"
            ),
            "reported_by_email": (
                reporter.email
                if reporter
                else None
            ),
            "created_at": person.created_at.isoformat()
        })

    return jsonify({
        "count": len(results),
        "missing_persons": results
    }), 200


# ============================================================
# GET ONE MISSING-PERSON REPORT FOR ADMIN
# ============================================================

@admin_bp.route("/missing-persons/<int:person_id>", methods=["GET"])
@admin_required()
def admin_get_missing_person(person_id):

    person = MissingPerson.query.get(person_id)

    if not person:
        return jsonify({
            "error": "Missing person report not found"
        }), 404

    reporter = User.query.get(person.reported_by)

    return jsonify({
        "missing_person": {
            "id": person.id,
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
            "reported_by": person.reported_by,
            "reported_by_name": (
                reporter.full_name
                if reporter
                else "Unknown"
            ),
            "reported_by_email": (
                reporter.email
                if reporter
                else None
            ),
            "created_at": person.created_at.isoformat()
        }
    }), 200


# ============================================================
# ADMIN UPDATE MISSING-PERSON REPORT
# ============================================================

@admin_bp.route(
    "/missing-persons/<int:person_id>",
    methods=["PUT"]
)
@admin_required()
def admin_update_missing_person(person_id):

    person = MissingPerson.query.get(person_id)

    if not person:
        return jsonify({
            "error": "Missing person report not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400


    # --------------------------------------------------------
    # Full name
    # --------------------------------------------------------

    if "full_name" in data:

        if not data["full_name"]:
            return jsonify({
                "error": "Full name cannot be empty"
            }), 400

        person.full_name = data["full_name"]


    # --------------------------------------------------------
    # Age
    # --------------------------------------------------------

    if "age" in data:

        age = data["age"]

        if age is not None:

            try:
                age = int(age)

                if age < 0 or age > 150:
                    return jsonify({
                        "error": "Age must be between 0 and 150"
                    }), 400

            except (ValueError, TypeError):

                return jsonify({
                    "error": "Age must be a valid number"
                }), 400

        person.age = age


    # --------------------------------------------------------
    # Gender
    # --------------------------------------------------------

    if "gender" in data:
        person.gender = data["gender"]


    # --------------------------------------------------------
    # Description
    # --------------------------------------------------------

    if "description" in data:
        person.description = data["description"]


    # --------------------------------------------------------
    # Last seen location
    # --------------------------------------------------------

    if "last_seen_location" in data:
        person.last_seen_location = data["last_seen_location"]


    # --------------------------------------------------------
    # Last seen date
    # --------------------------------------------------------

    if "last_seen_date" in data:

        if data["last_seen_date"]:

            try:
                person.last_seen_date = datetime.strptime(
                    data["last_seen_date"],
                    "%Y-%m-%d"
                ).date()

            except ValueError:

                return jsonify({
                    "error": "last_seen_date must use YYYY-MM-DD format"
                }), 400

        else:

            person.last_seen_date = None


    # --------------------------------------------------------
    # Status
    # --------------------------------------------------------

    if "status" in data:

        allowed_statuses = [
            "active",
            "found",
            "closed"
        ]

        if data["status"] not in allowed_statuses:

            return jsonify({
                "error": "Status must be active, found, or closed"
            }), 400

        person.status = data["status"]


    db.session.commit()

    return jsonify({
        "message": "Missing person report updated successfully",
        "missing_person": {
            "id": person.id,
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
            "reported_by": person.reported_by,
            "created_at": person.created_at.isoformat()
        }
    }), 200


# ============================================================
# ADMIN DELETE MISSING-PERSON REPORT
# ============================================================

@admin_bp.route(
    "/missing-persons/<int:person_id>",
    methods=["DELETE"]
)
@admin_required()
def admin_delete_missing_person(person_id):

    person = MissingPerson.query.get(person_id)

    if not person:
        return jsonify({
            "error": "Missing person report not found"
        }), 404

    db.session.delete(person)
    db.session.commit()

    return jsonify({
        "message": "Missing person report deleted successfully"
    }), 200