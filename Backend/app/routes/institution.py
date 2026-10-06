"""
Institution routes — registration, management, and unidentified-record submission.

Roles:
  - Any user can register an institution account (creates a pending Institution profile).
  - Institution users (role="institution", status="approved") can submit unidentified records.
  - Admins can approve/reject institutions and view all records.
"""

import os
import uuid
from datetime import datetime
from difflib import SequenceMatcher

from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import (
    User, Institution, UnidentifiedRecord,
    MissingPerson, Notification
)
from app.utils.admin_required import admin_required

institution_bp = Blueprint(
    "institution",
    __name__,
    url_prefix="/api/institutions"
)

# ============================================================
# HELPERS
# ============================================================

ALLOWED_PHOTO_EXTS = {"jpg", "jpeg", "png", "webp"}
MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5 MB

# Match threshold — score out of 100
MATCH_THRESHOLD = 38


def _get_upload_folder():
    folder = os.path.join(
        current_app.root_path, "static", "uploads", "unidentified"
    )
    os.makedirs(folder, exist_ok=True)
    return folder


def _save_photo(photo):
    if not photo or not photo.filename:
        return None, None
    ext = photo.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_PHOTO_EXTS:
        return None, "Invalid photo format. Allowed: JPG, PNG, WEBP."
    photo.stream.seek(0, os.SEEK_END)
    size = photo.stream.tell()
    photo.stream.seek(0)
    if size > MAX_PHOTO_SIZE:
        return None, "Photo too large. Maximum 5 MB."
    filename = f"{uuid.uuid4().hex}.{ext}"
    photo.save(os.path.join(_get_upload_folder(), filename))
    return f"/api/institutions/photos/{filename}", None


def _get_institution_for_user(user_id):
    """Return the approved Institution profile for a user, or None."""
    return Institution.query.filter_by(
        user_id=user_id, status="approved"
    ).first()


# ============================================================
# MATCHING ENGINE
# ============================================================

def _text_similarity(a, b):
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def _age_overlap(rec_min, rec_max, missing_age):
    """
    Score 0–1 based on whether the missing person's age falls within
    the unidentified record's estimated age range (with ±3 buffer).
    """
    if missing_age is None:
        return 0.3  # neutral — no age to compare
    if rec_min is None and rec_max is None:
        return 0.3
    lo = (rec_min or 0) - 3
    hi = (rec_max or 120) + 3
    if lo <= missing_age <= hi:
        return 1.0
    gap = min(abs(missing_age - lo), abs(missing_age - hi))
    if gap <= 5:
        return 0.6
    if gap <= 10:
        return 0.3
    return 0.0


def _gender_match(rec_gender, missing_gender):
    if not rec_gender or rec_gender == "unknown":
        return 0.4
    if not missing_gender:
        return 0.4
    return 1.0 if rec_gender.lower() == missing_gender.lower() else 0.0


def _location_similarity(found_loc, last_seen_loc):
    if not found_loc or not last_seen_loc:
        return 0.2
    found = found_loc.lower()
    seen = last_seen_loc.lower()
    if found == seen:
        return 1.0
    if found in seen or seen in found:
        return 0.75
    return _text_similarity(found, seen)


def _calculate_match_score(record, person):
    """
    Returns a score 0–100 comparing an UnidentifiedRecord to a MissingPerson.
    """
    age_score      = _age_overlap(record.estimated_age_min, record.estimated_age_max, person.age)
    gender_score   = _gender_match(record.gender, person.gender)
    location_score = _location_similarity(record.found_location, person.last_seen_location)
    desc_score     = _text_similarity(record.physical_description, person.description)

    # Weights: age 30, gender 25, location 30, description 15
    score = (
        age_score      * 30 +
        gender_score   * 25 +
        location_score * 30 +
        desc_score     * 15
    )
    return round(score, 1)


def _run_matching_and_notify(record):
    """
    Compare a newly added UnidentifiedRecord against all open missing-person
    cases. Create notifications for reporters whose cases score above threshold.
    """
    active_cases = MissingPerson.query.filter(
        MissingPerson.status.in_(["active", "under_investigation"])
    ).all()

    matches_created = 0

    for person in active_cases:
        score = _calculate_match_score(record, person)
        if score < MATCH_THRESHOLD:
            continue

        # Avoid duplicate notifications for the same (record, person) pair
        already = Notification.query.filter_by(
            notification_type="institutional_match",
            missing_person_id=person.id,
            unidentified_record_id=record.id,
        ).first()
        if already:
            continue

        inst = record.institution
        facility_label = (
            f"{inst.facility_name}, {inst.city}" if inst else "an institution"
        )

        notification = Notification(
            user_id=int(person.reported_by),
            notification_type="institutional_match",
            title=f"Potential match found for {person.full_name}",
            message=(
                f"An unidentified individual admitted at {facility_label} "
                f"may match {person.full_name}. "
                f"Match confidence: {score:.0f}/100. "
                "View the record for details and contact the institution."
            ),
            missing_person_id=person.id,
            unidentified_record_id=record.id,
        )
        db.session.add(notification)
        matches_created += 1

    if matches_created:
        db.session.commit()

    return matches_created


# ============================================================
# SERVE UNIDENTIFIED RECORD PHOTOS
# ============================================================

@institution_bp.route("/photos/<filename>", methods=["GET"])
def serve_photo(filename):
    return send_from_directory(_get_upload_folder(), filename)


# ============================================================
# REGISTER AN INSTITUTION ACCOUNT
# (any authenticated user can apply; admin approves)
# ============================================================

@institution_bp.route("/register", methods=["POST"])
@jwt_required()
def register_institution():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    # One institution per user
    existing = Institution.query.filter_by(user_id=user_id).first()
    if existing:
        return jsonify({
            "error": "You already have an institution application.",
            "status": existing.status,
        }), 409

    data = request.get_json() or {}
    facility_name = (data.get("facility_name") or "").strip()
    facility_type = (data.get("facility_type") or "").strip().lower()
    region        = (data.get("region") or "").strip()
    city          = (data.get("city") or "").strip()
    address       = (data.get("address") or "").strip() or None
    contact_phone = (data.get("contact_phone") or "").strip() or None

    if not facility_name:
        return jsonify({"error": "facility_name is required"}), 400
    if facility_type not in ("hospital", "police"):
        return jsonify({"error": "facility_type must be 'hospital' or 'police'"}), 400
    if not region or not city:
        return jsonify({"error": "region and city are required"}), 400

    # Upgrade user role so they know they are an institution account
    user.role = "institution"

    institution = Institution(
        user_id=user_id,
        facility_name=facility_name,
        facility_type=facility_type,
        region=region,
        city=city,
        address=address,
        contact_phone=contact_phone,
        status="pending",
    )
    db.session.add(institution)
    db.session.commit()

    return jsonify({
        "message": "Institution registration submitted. Awaiting admin approval.",
        "institution": institution.to_dict(),
    }), 201


# ============================================================
# GET MY INSTITUTION PROFILE
# ============================================================

@institution_bp.route("/me", methods=["GET"])
@jwt_required()
def get_my_institution():
    user_id = int(get_jwt_identity())
    inst = Institution.query.filter_by(user_id=user_id).first()
    if not inst:
        return jsonify({"error": "No institution profile found"}), 404
    return jsonify({"institution": inst.to_dict()}), 200


# ============================================================
# SUBMIT AN UNIDENTIFIED RECORD
# (institution must be approved)
# ============================================================

@institution_bp.route("/records", methods=["POST"])
@jwt_required()
def create_unidentified_record():
    user_id = int(get_jwt_identity())
    institution = _get_institution_for_user(user_id)

    if not institution:
        return jsonify({
            "error": "Your institution account is not approved yet."
        }), 403

    # Support multipart (with photo) and JSON
    if request.content_type and "multipart/form-data" in request.content_type:
        data  = request.form
        photo = request.files.get("photo")
    else:
        data  = request.get_json(silent=True) or {}
        photo = None

    found_location = (data.get("found_location") or "").strip()
    found_date_str = (data.get("found_date") or "").strip()
    gender         = (data.get("gender") or "unknown").strip().lower()
    condition      = (data.get("condition") or "unknown").strip().lower()
    physical_desc  = (data.get("physical_description") or "").strip() or None
    notes          = (data.get("notes") or "").strip() or None

    try:
        age_min = int(data["estimated_age_min"]) if data.get("estimated_age_min") not in (None, "") else None
        age_max = int(data["estimated_age_max"]) if data.get("estimated_age_max") not in (None, "") else None
    except (ValueError, TypeError):
        return jsonify({"error": "estimated_age_min and estimated_age_max must be integers"}), 400

    if not found_location:
        return jsonify({"error": "found_location is required"}), 400
    if not found_date_str:
        return jsonify({"error": "found_date is required (YYYY-MM-DD)"}), 400

    try:
        found_date = datetime.strptime(found_date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "found_date must be YYYY-MM-DD"}), 400

    if gender not in ("male", "female", "unknown"):
        gender = "unknown"

    valid_conditions = ("conscious", "unconscious", "stable", "critical", "deceased", "in_custody", "unknown")
    if condition not in valid_conditions:
        condition = "unknown"

    photo_url = None
    if photo:
        photo_url, err = _save_photo(photo)
        if err:
            return jsonify({"error": err}), 400

    record = UnidentifiedRecord(
        institution_id=institution.id,
        estimated_age_min=age_min,
        estimated_age_max=age_max,
        gender=gender,
        physical_description=physical_desc,
        found_location=found_location,
        found_date=found_date,
        condition=condition,
        notes=notes,
        photo_url=photo_url,
        status="open",
    )
    db.session.add(record)
    db.session.commit()

    # Run matching engine in same request — fast enough for typical DB sizes
    matches = _run_matching_and_notify(record)

    return jsonify({
        "message": "Unidentified record submitted successfully.",
        "record": record.to_dict(include_institution=True),
        "potential_matches_notified": matches,
    }), 201


# ============================================================
# GET MY INSTITUTION'S RECORDS
# ============================================================

@institution_bp.route("/records", methods=["GET"])
@jwt_required()
def get_my_records():
    user_id = int(get_jwt_identity())
    institution = _get_institution_for_user(user_id)
    if not institution:
        return jsonify({"error": "No approved institution profile found"}), 403

    records = UnidentifiedRecord.query.filter_by(
        institution_id=institution.id
    ).order_by(UnidentifiedRecord.created_at.desc()).all()

    return jsonify({
        "count": len(records),
        "records": [r.to_dict() for r in records],
    }), 200


# ============================================================
# GET ONE UNIDENTIFIED RECORD (public — for families viewing a match)
# ============================================================

@institution_bp.route("/records/<int:record_id>", methods=["GET"])
@jwt_required()
def get_record(record_id):
    record = UnidentifiedRecord.query.get(record_id)
    if not record:
        return jsonify({"error": "Record not found"}), 404
    return jsonify({"record": record.to_dict(include_institution=True)}), 200


# ============================================================
# UPDATE A RECORD (institution owner only)
# ============================================================

@institution_bp.route("/records/<int:record_id>", methods=["PUT"])
@jwt_required()
def update_record(record_id):
    user_id = int(get_jwt_identity())
    institution = _get_institution_for_user(user_id)
    if not institution:
        return jsonify({"error": "No approved institution profile found"}), 403

    record = UnidentifiedRecord.query.get(record_id)
    if not record:
        return jsonify({"error": "Record not found"}), 404
    if record.institution_id != institution.id:
        return jsonify({"error": "Not authorized"}), 403

    data = request.get_json(silent=True) or {}

    updatable = [
        "estimated_age_min", "estimated_age_max", "gender",
        "physical_description", "found_location", "condition",
        "notes", "status",
    ]
    for field in updatable:
        if field in data:
            setattr(record, field, data[field])

    if "found_date" in data and data["found_date"]:
        try:
            record.found_date = datetime.strptime(data["found_date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "found_date must be YYYY-MM-DD"}), 400

    db.session.commit()
    return jsonify({
        "message": "Record updated.",
        "record": record.to_dict(),
    }), 200


# ============================================================
# ADMIN — LIST ALL INSTITUTIONS
# ============================================================

@institution_bp.route("/admin/all", methods=["GET"])
@admin_required()
def admin_list_institutions():
    institutions = Institution.query.order_by(Institution.created_at.desc()).all()
    return jsonify({
        "count": len(institutions),
        "institutions": [i.to_dict() for i in institutions],
    }), 200


# ============================================================
# ADMIN — APPROVE / REJECT INSTITUTION
# ============================================================

@institution_bp.route("/admin/<int:inst_id>/status", methods=["PUT"])
@admin_required()
def admin_update_institution_status(inst_id):
    institution = Institution.query.get(inst_id)
    if not institution:
        return jsonify({"error": "Institution not found"}), 404

    data = request.get_json() or {}
    new_status = data.get("status", "").strip()

    if new_status not in ("approved", "rejected", "pending"):
        return jsonify({"error": "status must be approved, rejected, or pending"}), 400

    institution.status = new_status

    # If rejected, revert user role to "user"
    if new_status == "rejected":
        user = User.query.get(institution.user_id)
        if user:
            user.role = "user"

    db.session.commit()
    return jsonify({
        "message": f"Institution status updated to {new_status}.",
        "institution": institution.to_dict(),
    }), 200


# ============================================================
# ADMIN — LIST ALL UNIDENTIFIED RECORDS
# ============================================================

@institution_bp.route("/admin/records", methods=["GET"])
@admin_required()
def admin_list_records():
    records = UnidentifiedRecord.query.order_by(
        UnidentifiedRecord.created_at.desc()
    ).all()
    return jsonify({
        "count": len(records),
        "records": [r.to_dict(include_institution=True) for r in records],
    }), 200
