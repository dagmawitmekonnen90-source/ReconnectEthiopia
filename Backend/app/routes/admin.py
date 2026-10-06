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

    under_investigation_cases = MissingPerson.query.filter_by(
        status="under_investigation"
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
            "under_investigation_cases": under_investigation_cases,
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
# GET ALL MISSING PERSON REPORTS
# ADMIN ONLY
# ============================================================

@admin_bp.route("/missing-persons", methods=["GET"])
@admin_required()
def admin_get_missing_persons():

    missing_persons = MissingPerson.query.order_by(
        MissingPerson.created_at.desc()
    ).all()

    results = []

    for person in missing_persons:

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
# GET ONE MISSING PERSON
# ADMIN ONLY
# ============================================================

@admin_bp.route(
    "/missing-persons/<int:person_id>",
    methods=["GET"]
)
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
# UPDATE MISSING PERSON
# ADMIN ONLY
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

    # Update full name
    if "full_name" in data:

        if not data["full_name"]:
            return jsonify({
                "error": "Full name cannot be empty"
            }), 400

        person.full_name = data["full_name"]

    # Update age
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

    # Update gender
    if "gender" in data:
        person.gender = data["gender"]

    # Update description
    if "description" in data:
        person.description = data["description"]

    # Update last seen location
    if "last_seen_location" in data:
        person.last_seen_location = data["last_seen_location"]

    # Update last seen date
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
    # UPDATE CASE STATUS
    # --------------------------------------------------------

    if "status" in data:

        allowed_statuses = [
            "active",
            "under_investigation",
            "found",
            "closed"
        ]

        if data["status"] not in allowed_statuses:

            return jsonify({
                "error": (
                    "Status must be active, "
                    "under_investigation, found, or closed"
                )
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
# DELETE MISSING PERSON
# ADMIN ONLY
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


# ============================================================
# GET ALL SIGHTINGS
# ADMIN ONLY
# ============================================================

@admin_bp.route("/sightings", methods=["GET"])
@admin_required()
def admin_get_sightings():

    sightings = Sighting.query.order_by(
        Sighting.created_at.desc()
    ).all()

    results = []

    for sighting in sightings:

        reporter = User.query.get(
            sighting.reported_by
        )

        missing_person = MissingPerson.query.get(
            sighting.missing_person_id
        )

        results.append({
            "id": sighting.id,
            "missing_person_id": sighting.missing_person_id,
            "missing_person_name": (
                missing_person.full_name
                if missing_person
                else "Unknown"
            ),
            "description": sighting.description,
            "location": sighting.location,
            "sighting_date": (
                sighting.sighting_date.isoformat()
                if sighting.sighting_date
                else None
            ),
            "reported_by": sighting.reported_by,
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
            "created_at": (
                sighting.created_at.isoformat()
                if sighting.created_at
                else None
            )
        })

    return jsonify({
        "count": len(results),
        "sightings": results
    }), 200


# ============================================================
# GET ONE SIGHTING
# ADMIN ONLY
# ============================================================

@admin_bp.route(
    "/sightings/<int:sighting_id>",
    methods=["GET"]
)
@admin_required()
def admin_get_sighting(sighting_id):

    sighting = Sighting.query.get(sighting_id)

    if not sighting:
        return jsonify({
            "error": "Sighting not found"
        }), 404

    reporter = User.query.get(
        sighting.reported_by
    )

    missing_person = MissingPerson.query.get(
        sighting.missing_person_id
    )

    return jsonify({
        "sighting": {
            "id": sighting.id,
            "missing_person_id": sighting.missing_person_id,
            "missing_person_name": (
                missing_person.full_name
                if missing_person
                else "Unknown"
            ),
            "description": sighting.description,
            "location": sighting.location,
            "sighting_date": (
                sighting.sighting_date.isoformat()
                if sighting.sighting_date
                else None
            ),
            "reported_by": sighting.reported_by,
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
            "created_at": (
                sighting.created_at.isoformat()
                if sighting.created_at
                else None
            )
        }
    }), 200


# ============================================================
# DELETE SIGHTING
# ADMIN ONLY
# ============================================================

@admin_bp.route(
    "/sightings/<int:sighting_id>",
    methods=["DELETE"]
)
@admin_required()
def admin_delete_sighting(sighting_id):

    sighting = Sighting.query.get(sighting_id)

    if not sighting:
        return jsonify({
            "error": "Sighting not found"
        }), 404

    try:

        db.session.delete(sighting)
        db.session.commit()

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "error": "Failed to delete sighting",
            "details": str(e)
        }), 500

    return jsonify({
        "message": "Sighting deleted successfully"
    }), 200


# ============================================================
# GET ALL USERS
# ADMIN ONLY
# ============================================================

@admin_bp.route("/users", methods=["GET"])
@admin_required()
def admin_get_users():

    users = User.query.order_by(
        User.created_at.desc()
    ).all()

    results = []

    for user in users:

        results.append({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "is_banned": user.is_banned,
            "ban_reason": user.ban_reason,
            "created_at": (
                user.created_at.isoformat()
                if user.created_at
                else None
            )
        })

    return jsonify({
        "count": len(results),
        "users": results
    }), 200


# ============================================================
# GET ONE USER
# ADMIN ONLY
# ============================================================

@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@admin_required()
def admin_get_user(user_id):

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    return jsonify({
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "created_at": (
                user.created_at.isoformat()
                if user.created_at
                else None
            )
        }
    }), 200


# ============================================================
# UPDATE USER
# ADMIN ONLY
# ============================================================

@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@admin_required()
def admin_update_user(user_id):

    current_admin_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    # Update full name
    if "full_name" in data:

        if not data["full_name"]:
            return jsonify({
                "error": "Full name cannot be empty"
            }), 400

        user.full_name = data["full_name"]

    # Update email
    if "email" in data:

        if not data["email"]:
            return jsonify({
                "error": "Email cannot be empty"
            }), 400

        existing_user = User.query.filter(
            User.email == data["email"],
            User.id != user_id
        ).first()

        if existing_user:
            return jsonify({
                "error": "A user with this email already exists"
            }), 409

        user.email = data["email"]

    # Update role
    if "role" in data:

        allowed_roles = [
            "user",
            "admin"
        ]

        if data["role"] not in allowed_roles:
            return jsonify({
                "error": "Role must be user or admin"
            }), 400

        # Prevent an admin from removing their own admin role
        if user_id == current_admin_id and data["role"] != "admin":
            return jsonify({
                "error": "You cannot remove your own admin role"
            }), 400

        user.role = data["role"]

    db.session.commit()

    return jsonify({
        "message": "User updated successfully",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "created_at": (
                user.created_at.isoformat()
                if user.created_at
                else None
            )
        }
    }), 200


# ============================================================
# DELETE USER
# ADMIN ONLY
# ============================================================

@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required()
def admin_delete_user(user_id):

    current_admin_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    # Prevent admin from deleting their own account
    if user_id == current_admin_id:
        return jsonify({
            "error": "You cannot delete your own admin account"
        }), 400

    db.session.delete(user)
    db.session.commit()

    return jsonify({
        "message": "User deleted successfully"
    }), 200


# ============================================================
# BAN USER
# ADMIN ONLY
# ============================================================

@admin_bp.route("/users/<int:user_id>/ban", methods=["POST"])
@admin_required()
def admin_ban_user(user_id):

    current_admin_id = int(get_jwt_identity())

    if user_id == current_admin_id:
        return jsonify({"error": "You cannot ban your own account"}), 400

    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role == "admin":
        return jsonify({"error": "Admin accounts cannot be banned"}), 400

    data = request.get_json() or {}
    reason = data.get("reason", "").strip() or "No reason provided."

    user.is_banned = True
    user.ban_reason = reason
    db.session.commit()

    return jsonify({
        "message": f"User {user.full_name} has been banned.",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "is_banned": user.is_banned,
            "ban_reason": user.ban_reason,
        }
    }), 200


# ============================================================
# UNBAN USER
# ADMIN ONLY
# ============================================================

@admin_bp.route("/users/<int:user_id>/unban", methods=["POST"])
@admin_required()
def admin_unban_user(user_id):

    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    user.is_banned = False
    user.ban_reason = None
    db.session.commit()

    return jsonify({
        "message": f"User {user.full_name} has been unbanned.",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "is_banned": user.is_banned,
        }
    }), 200


# ============================================================
# GET ACCOUNT STATS (for admin accounts overview)
# ADMIN ONLY
# ============================================================

@admin_bp.route("/users/stats", methods=["GET"])
@admin_required()
def admin_user_stats():

    total = User.query.count()
    admins = User.query.filter_by(role="admin").count()
    banned = User.query.filter_by(is_banned=True).count()
    regular = User.query.filter_by(role="user", is_banned=False).count()

    return jsonify({
        "total_users": total,
        "admins": admins,
        "banned": banned,
        "active_regular_users": regular,
    }), 200
