from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from app.extensions import db
from app.models import Sighting, MissingPerson, Notification


sighting_bp = Blueprint(
    "sighting",
    __name__,
    url_prefix="/api/sightings"
)


# ============================================================
# CREATE A SIGHTING
# ============================================================

@sighting_bp.route("", methods=["POST"])
@jwt_required()
def create_sighting():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    missing_person_id = data.get("missing_person_id")
    description = data.get("description")
    location = data.get("location")
    sighting_date = data.get("sighting_date")

    if not missing_person_id:
        return jsonify({
            "error": "missing_person_id is required"
        }), 400

    if not location:
        return jsonify({
            "error": "Location is required"
        }), 400

    # Check that the missing-person report exists
    missing_person = MissingPerson.query.get(
        missing_person_id
    )

    if not missing_person:
        return jsonify({
            "error": "Missing person report not found"
        }), 404

    # Get logged-in user's ID
    user_id = get_jwt_identity()

    # Convert date if provided
    parsed_date = None

    if sighting_date:

        try:

            parsed_date = datetime.strptime(
                sighting_date,
                "%Y-%m-%d"
            ).date()

        except ValueError:

            return jsonify({
                "error": "sighting_date must use YYYY-MM-DD format"
            }), 400

    sighting = Sighting(
        missing_person_id=int(missing_person_id),
        description=description,
        location=location,
        sighting_date=parsed_date,
        reported_by=int(user_id)
    )

    db.session.add(sighting)
    db.session.flush()  # get sighting.id before commit

    # --------------------------------------------------------
    # NOTIFY the person who filed the missing-person report
    # (only if the reporter is someone other than the sighting submitter)
    # --------------------------------------------------------
    reporter_id = missing_person.reported_by
    if reporter_id and int(reporter_id) != int(user_id):
        notification = Notification(
            user_id=int(reporter_id),
            notification_type="sighting_reported",
            title=f"New sighting reported for {missing_person.full_name}",
            message=(
                f"Someone reported seeing {missing_person.full_name} "
                f"at {location}"
                + (f" on {parsed_date.strftime('%d %b %Y')}" if parsed_date else "")
                + ". Open the case to view details."
            ),
            missing_person_id=int(missing_person_id),
            sighting_id=sighting.id,
        )
        db.session.add(notification)

    db.session.commit()

    return jsonify({
        "message": "Sighting reported successfully",
        "sighting": {
            "id": sighting.id,
            "missing_person_id": sighting.missing_person_id,
            "description": sighting.description,
            "location": sighting.location,
            "sighting_date": (
                sighting.sighting_date.isoformat()
                if sighting.sighting_date
                else None
            ),
            "reported_by": sighting.reported_by,
            "created_at": sighting.created_at.isoformat()
        }
    }), 201


# ============================================================
# GET ALL SIGHTINGS
# ============================================================

@sighting_bp.route("", methods=["GET"])
def get_sightings():

    # Filter by missing_person_id if provided as query param
    missing_person_id = request.args.get("missing_person_id", type=int)

    query = Sighting.query.order_by(Sighting.created_at.desc())

    if missing_person_id:
        query = query.filter_by(missing_person_id=missing_person_id)

    sightings = query.all()

    results = []

    for sighting in sightings:

        results.append({
            "id": sighting.id,
            "missing_person_id": sighting.missing_person_id,
            "description": sighting.description,
            "location": sighting.location,
            "sighting_date": (
                sighting.sighting_date.isoformat()
                if sighting.sighting_date
                else None
            ),
            "reported_by": sighting.reported_by,
            "created_at": sighting.created_at.isoformat()
        })

    return jsonify({
        "count": len(results),
        "sightings": results
    }), 200


# ============================================================
# GET MY SIGHTINGS
# ============================================================

@sighting_bp.route("/mine", methods=["GET"])
@jwt_required()
def get_my_sightings():

    # Get the currently logged-in user's ID
    current_user_id = int(
        get_jwt_identity()
    )

    # Get ONLY sightings submitted by this user
    sightings = Sighting.query.filter_by(
        reported_by=current_user_id
    ).order_by(
        Sighting.created_at.desc()
    ).all()

    results = []

    for sighting in sightings:

        missing_person = sighting.missing_person

        results.append({
            "id": sighting.id,

            "missing_person_id": sighting.missing_person_id,

            # NEW: Include the missing person's name
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

            "created_at": sighting.created_at.isoformat()
        })

    return jsonify({
        "count": len(results),
        "sightings": results
    }), 200


# ============================================================
# GET ONE SIGHTING
# ============================================================

@sighting_bp.route("/<int:sighting_id>", methods=["GET"])
def get_sighting(sighting_id):

    sighting = Sighting.query.get(
        sighting_id
    )

    if not sighting:

        return jsonify({
            "error": "Sighting not found"
        }), 404

    return jsonify({
        "sighting": {
            "id": sighting.id,
            "missing_person_id": sighting.missing_person_id,
            "description": sighting.description,
            "location": sighting.location,
            "sighting_date": (
                sighting.sighting_date.isoformat()
                if sighting.sighting_date
                else None
            ),
            "reported_by": sighting.reported_by,
            "created_at": sighting.created_at.isoformat()
        }
    }), 200


# ============================================================
# UPDATE SIGHTING
# ============================================================

@sighting_bp.route("/<int:sighting_id>", methods=["PUT"])
@jwt_required()
def update_sighting(sighting_id):

    sighting = Sighting.query.get(
        sighting_id
    )

    if not sighting:

        return jsonify({
            "error": "Sighting not found"
        }), 404

    current_user_id = int(
        get_jwt_identity()
    )

    # Only the original reporter can update
    if sighting.reported_by != current_user_id:

        return jsonify({
            "error": "You are not authorized to update this sighting"
        }), 403

    data = request.get_json()

    if not data:

        return jsonify({
            "error": "Request body is required"
        }), 400

    if "description" in data:

        sighting.description = data["description"]

    if "location" in data:

        if not data["location"]:

            return jsonify({
                "error": "Location cannot be empty"
            }), 400

        sighting.location = data["location"]

    if "sighting_date" in data:

        if data["sighting_date"]:

            try:

                sighting.sighting_date = datetime.strptime(
                    data["sighting_date"],
                    "%Y-%m-%d"
                ).date()

            except ValueError:

                return jsonify({
                    "error": "sighting_date must use YYYY-MM-DD format"
                }), 400

        else:

            sighting.sighting_date = None

    db.session.commit()

    return jsonify({
        "message": "Sighting updated successfully",
        "sighting": {
            "id": sighting.id,
            "missing_person_id": sighting.missing_person_id,
            "description": sighting.description,
            "location": sighting.location,
            "sighting_date": (
                sighting.sighting_date.isoformat()
                if sighting.sighting_date
                else None
            ),
            "reported_by": sighting.reported_by,
            "created_at": sighting.created_at.isoformat()
        }
    }), 200


# ============================================================
# DELETE SIGHTING
# ============================================================

@sighting_bp.route("/<int:sighting_id>", methods=["DELETE"])
@jwt_required()
def delete_sighting(sighting_id):

    sighting = Sighting.query.get(
        sighting_id
    )

    if not sighting:

        return jsonify({
            "error": "Sighting not found"
        }), 404

    current_user_id = int(
        get_jwt_identity()
    )

    # Only the original reporter can delete
    if sighting.reported_by != current_user_id:

        return jsonify({
            "error": "You are not authorized to delete this sighting"
        }), 403

    db.session.delete(
        sighting
    )

    db.session.commit()

    return jsonify({
        "message": "Sighting deleted successfully"
    }), 200