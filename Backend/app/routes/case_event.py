from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import CaseEvent, MissingPerson
from app.utils.admin_required import admin_required


case_event_bp = Blueprint(
    "case_event",
    __name__,
    url_prefix="/api/case-events"
)


# ============================================================
# USER / AUTHENTICATED CASE TIMELINE
# ============================================================

@case_event_bp.route("/<int:missing_person_id>", methods=["GET"])
@jwt_required()
def get_case_events(missing_person_id):
    """
    Get the timeline events for a missing person case.
    """

    person = MissingPerson.query.get(missing_person_id)

    if not person:
        return jsonify({
            "msg": "Missing person not found."
        }), 404

    events = (
        CaseEvent.query
        .filter_by(missing_person_id=missing_person_id)
        .order_by(CaseEvent.created_at.asc())
        .all()
    )

    result = []

    for event in events:
        result.append({
            "id": event.id,
            "missing_person_id": event.missing_person_id,
            "event_type": event.event_type,
            "description": event.description,
            "created_by": event.created_by,
            "created_at": (
                event.created_at.isoformat()
                if event.created_at
                else None
            )
        })

    return jsonify({
        "events": result
    }), 200


# ============================================================
# USER — GET MY CASE EVENTS
# ============================================================

@case_event_bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_case_events():
    """
    Return case events associated with missing-person cases
    reported by the currently logged-in user.
    """

    user_id = int(get_jwt_identity())

    # Get the missing-person cases reported by this user.
    missing_persons = (
        MissingPerson.query
        .filter_by(reported_by=user_id)
        .all()
    )

    missing_person_ids = [
        person.id
        for person in missing_persons
    ]

    if not missing_person_ids:
        return jsonify({
            "count": 0,
            "events": []
        }), 200

    events = (
        CaseEvent.query
        .filter(
            CaseEvent.missing_person_id.in_(
                missing_person_ids
            )
        )
        .order_by(CaseEvent.created_at.desc())
        .all()
    )

    result = []

    for event in events:

        person = db.session.get(
            MissingPerson,
            event.missing_person_id
        )

        result.append({
            "id": event.id,
            "missing_person_id": event.missing_person_id,

            "missing_person_name": (
                person.full_name
                if person
                else "Unknown"
            ),

            "event_type": event.event_type,
            "description": event.description,
            "created_by": event.created_by,

            "created_at": (
                event.created_at.isoformat()
                if event.created_at
                else None
            )
        })

    return jsonify({
        "count": len(result),
        "events": result
    }), 200


# ============================================================
# CREATE CASE EVENT
# ============================================================

@case_event_bp.route("/<int:missing_person_id>", methods=["POST"])
@jwt_required()
def create_case_event(missing_person_id):
    """
    Add a new event to a missing person case timeline.
    """

    person = MissingPerson.query.get(missing_person_id)

    if not person:
        return jsonify({
            "msg": "Missing person not found."
        }), 404

    data = request.get_json() or {}

    event_type = data.get("event_type", "").strip()
    description = data.get("description", "").strip()

    if not event_type:
        return jsonify({
            "msg": "Event type is required."
        }), 400

    if not description:
        return jsonify({
            "msg": "Description is required."
        }), 400

    user_id = int(get_jwt_identity())

    event = CaseEvent(
        missing_person_id=missing_person_id,
        event_type=event_type,
        description=description,
        created_by=user_id,
        created_at=datetime.utcnow()
    )

    db.session.add(event)
    db.session.commit()

    return jsonify({
        "msg": "Case event created successfully.",
        "event": {
            "id": event.id,
            "missing_person_id": event.missing_person_id,
            "event_type": event.event_type,
            "description": event.description,
            "created_by": event.created_by,
            "created_at": (
                event.created_at.isoformat()
                if event.created_at
                else None
            )
        }
    }), 201


# ============================================================
# ADMIN — GET ALL CASE EVENTS
# ============================================================

@case_event_bp.route("/admin/all", methods=["GET"])
@admin_required()
def admin_get_all_case_events():
    """
    Admin-only endpoint for viewing all case events.
    """

    events = (
        CaseEvent.query
        .order_by(CaseEvent.created_at.desc())
        .all()
    )

    result = []

    for event in events:
        person = MissingPerson.query.get(
            event.missing_person_id
        )

        result.append({
            "id": event.id,
            "missing_person_id": event.missing_person_id,

            "missing_person_name": (
                person.full_name
                if person
                else "Unknown"
            ),

            "event_type": event.event_type,
            "description": event.description,
            "created_by": event.created_by,

            "created_at": (
                event.created_at.isoformat()
                if event.created_at
                else None
            )
        })

    return jsonify({
        "count": len(result),
        "events": result
    }), 200


# ============================================================
# ADMIN — GET SINGLE CASE EVENT
# ============================================================

@case_event_bp.route("/admin/<int:event_id>", methods=["GET"])
@admin_required()
def admin_get_case_event(event_id):
    """
    Admin-only endpoint for viewing one case event.
    """

    event = CaseEvent.query.get(event_id)

    if not event:
        return jsonify({
            "msg": "Case event not found."
        }), 404

    person = MissingPerson.query.get(
        event.missing_person_id
    )

    return jsonify({
        "event": {
            "id": event.id,
            "missing_person_id": event.missing_person_id,

            "missing_person_name": (
                person.full_name
                if person
                else "Unknown"
            ),

            "event_type": event.event_type,
            "description": event.description,
            "created_by": event.created_by,

            "created_at": (
                event.created_at.isoformat()
                if event.created_at
                else None
            )
        }
    }), 200


# ============================================================
# ADMIN — DELETE CASE EVENT
# ============================================================

@case_event_bp.route("/admin/<int:event_id>", methods=["DELETE"])
@admin_required()
def admin_delete_case_event(event_id):
    """
    Admin-only endpoint for deleting a case event.
    """

    event = CaseEvent.query.get(event_id)

    if not event:
        return jsonify({
            "msg": "Case event not found."
        }), 404

    db.session.delete(event)
    db.session.commit()

    return jsonify({
        "msg": "Case event deleted successfully."
    }), 200