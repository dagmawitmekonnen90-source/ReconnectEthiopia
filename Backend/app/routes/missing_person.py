import os
import uuid
import re
from datetime import datetime
from difflib import SequenceMatcher

from flask import (
    Blueprint,
    request,
    jsonify,
    current_app,
    send_from_directory
)

from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import MissingPerson


missing_person_bp = Blueprint(
    "missing_person",
    __name__,
    url_prefix="/api/missing-persons"
)


# ============================================================
# PHOTO SETTINGS
# ============================================================

ALLOWED_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "webp"
}

MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5 MB


# ============================================================
# CASE STATUS SETTINGS
# ============================================================

ALLOWED_STATUSES = {
    "active",
    "under_investigation",
    "found",
    "closed"
}


# ============================================================
# SMART MATCHING SETTINGS
# ============================================================

MATCH_WEIGHTS = {
    "age": 25,
    "gender": 15,
    "location": 25,
    "description": 20,
    "name": 15
}

MINIMUM_MATCH_SCORE = 40


# ============================================================
# PHOTO HELPERS
# ============================================================

def allowed_file(filename):
    """
    Check whether the uploaded file has an allowed extension.
    """

    return (
        filename
        and "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


def get_upload_folder():
    """
    Create and return the folder where missing-person photos
    will be stored.
    """

    upload_folder = os.path.join(
        current_app.root_path,
        "static",
        "uploads",
        "missing_persons"
    )

    os.makedirs(upload_folder, exist_ok=True)

    return upload_folder


def save_photo(photo):
    """
    Save an uploaded photo and return its URL.
    """

    if not photo or not photo.filename:
        return None, None

    if not allowed_file(photo.filename):
        return (
            None,
            "Invalid photo format. Allowed formats: JPG, JPEG, PNG, WEBP."
        )

    # Check file size
    photo.stream.seek(0, os.SEEK_END)
    file_size = photo.stream.tell()
    photo.stream.seek(0)

    if file_size > MAX_PHOTO_SIZE:
        return None, "Photo is too large. Maximum size is 5 MB."

    original_filename = secure_filename(photo.filename)

    extension = original_filename.rsplit(".", 1)[1].lower()

    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}.{extension}"

    upload_folder = get_upload_folder()

    file_path = os.path.join(
        upload_folder,
        unique_filename
    )

    photo.save(file_path)

    photo_url = f"/api/missing-persons/photos/{unique_filename}"

    return photo_url, None


def delete_photo(photo_url):
    """
    Delete a previously uploaded photo from the server.
    """

    if not photo_url:
        return

    filename = os.path.basename(photo_url)

    upload_folder = get_upload_folder()

    file_path = os.path.join(
        upload_folder,
        filename
    )

    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass


# ============================================================
# SERIALIZATION
# ============================================================

def serialize_missing_person(person):
    """
    Convert a MissingPerson database object into a dictionary.
    """

    return {
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
        "photo_url": person.photo_url,
        "created_at": (
            person.created_at.isoformat()
            if person.created_at
            else None
        )
    }


# ============================================================
# SMART MATCHING HELPERS
# ============================================================

def normalize_text(value):
    """
    Normalize text before comparing it.

    Example:
        "Debre Berhan" -> "debre berhan"
    """

    if not value:
        return ""

    value = str(value).lower().strip()

    # Remove punctuation
    value = re.sub(r"[^\w\s]", " ", value)

    # Remove extra spaces
    value = re.sub(r"\s+", " ", value)

    return value


def text_similarity(value1, value2):
    """
    Calculate similarity between two pieces of text.

    Returns a value between 0 and 1.
    """

    text1 = normalize_text(value1)
    text2 = normalize_text(value2)

    if not text1 or not text2:
        return 0.0

    return SequenceMatcher(
        None,
        text1,
        text2
    ).ratio()


def calculate_age_similarity(age1, age2):
    """
    Compare two ages.

    Same age       = 1.0
    Difference 1   = 0.8
    Difference 2   = 0.6
    Difference 3   = 0.4
    Difference 4   = 0.2
    Difference 5+  = 0.0
    """

    if age1 is None or age2 is None:
        return 0.0

    try:
        difference = abs(int(age1) - int(age2))
    except (ValueError, TypeError):
        return 0.0

    if difference == 0:
        return 1.0

    if difference == 1:
        return 0.8

    if difference == 2:
        return 0.6

    if difference == 3:
        return 0.4

    if difference == 4:
        return 0.2

    return 0.0


def calculate_gender_similarity(gender1, gender2):
    """
    Compare gender values.
    """

    gender1 = normalize_text(gender1)
    gender2 = normalize_text(gender2)

    if not gender1 or not gender2:
        return 0.0

    if gender1 == gender2:
        return 1.0

    return 0.0


def calculate_location_similarity(location1, location2):
    """
    Compare locations.

    Exact same location receives the highest score.
    Similar text receives a partial score.
    """

    location1 = normalize_text(location1)
    location2 = normalize_text(location2)

    if not location1 or not location2:
        return 0.0

    if location1 == location2:
        return 1.0

    # Check whether one location contains the other.
    if location1 in location2 or location2 in location1:
        return 0.85

    return text_similarity(
        location1,
        location2
    )


def calculate_description_similarity(description1, description2):
    """
    Compare descriptions using text similarity.
    """

    return text_similarity(
        description1,
        description2
    )


def calculate_name_similarity(name1, name2):
    """
    Compare names.

    This helps identify cases where the same or very similar
    names were reported.
    """

    return text_similarity(
        name1,
        name2
    )


def calculate_match(candidate, person):
    """
    Calculate the overall similarity score between two
    missing-person records.

    Returns:
        score
        individual component scores
        reasons
    """

    age_score = calculate_age_similarity(
        person.age,
        candidate.age
    )

    gender_score = calculate_gender_similarity(
        person.gender,
        candidate.gender
    )

    location_score = calculate_location_similarity(
        person.last_seen_location,
        candidate.last_seen_location
    )

    description_score = calculate_description_similarity(
        person.description,
        candidate.description
    )

    name_score = calculate_name_similarity(
        person.full_name,
        candidate.full_name
    )

    # Weighted score
    score = (
        age_score * MATCH_WEIGHTS["age"]
        + gender_score * MATCH_WEIGHTS["gender"]
        + location_score * MATCH_WEIGHTS["location"]
        + description_score * MATCH_WEIGHTS["description"]
        + name_score * MATCH_WEIGHTS["name"]
    )

    score = round(score, 1)

    # --------------------------------------------------------
    # GENERATE HUMAN-READABLE REASONS
    # --------------------------------------------------------

    reasons = []

    if age_score >= 1.0:
        reasons.append("Same age")
    elif age_score >= 0.8:
        reasons.append("Very similar age")
    elif age_score >= 0.6:
        reasons.append("Similar age")

    if gender_score == 1.0:
        reasons.append("Same gender")

    if location_score >= 1.0:
        reasons.append("Same last-seen location")
    elif location_score >= 0.85:
        reasons.append("Very similar location")
    elif location_score >= 0.60:
        reasons.append("Similar location")

    if description_score >= 0.80:
        reasons.append("Highly similar description")
    elif description_score >= 0.60:
        reasons.append("Similar description")

    if name_score >= 0.90:
        reasons.append("Very similar name")
    elif name_score >= 0.70:
        reasons.append("Similar name")

    # If there are no strong individual reasons
    if not reasons:
        reasons.append("Some matching information was found")

    return {
        "score": score,
        "components": {
            "age": round(age_score * 100, 1),
            "gender": round(gender_score * 100, 1),
            "location": round(location_score * 100, 1),
            "description": round(description_score * 100, 1),
            "name": round(name_score * 100, 1)
        },
        "reasons": reasons
    }


def get_match_label(score):
    """
    Convert a numeric similarity score into a human-readable label.
    """

    if score >= 80:
        return "Strong Possible Match"

    if score >= 60:
        return "Possible Match"

    if score >= 40:
        return "Weak Possible Match"

    return "Low Similarity"


# ============================================================
# SERVE MISSING PERSON PHOTOS
# ============================================================

@missing_person_bp.route(
    "/photos/<filename>",
    methods=["GET"]
)
def get_missing_person_photo(filename):
    """
    Return an uploaded missing-person photo.
    """

    upload_folder = get_upload_folder()

    return send_from_directory(
        upload_folder,
        filename
    )


# ============================================================
# CREATE MISSING PERSON
# ============================================================

@missing_person_bp.route(
    "",
    methods=["POST"]
)
@jwt_required()
def create_missing_person():

    user_id = get_jwt_identity()

    # --------------------------------------------------------
    # SUPPORT BOTH JSON AND FORM-DATA
    # --------------------------------------------------------

    if request.content_type and request.content_type.startswith(
        "multipart/form-data"
    ):
        data = request.form
        photo = request.files.get("photo")

    else:
        data = request.get_json(silent=True) or {}
        photo = None

    # --------------------------------------------------------
    # GET DATA
    # --------------------------------------------------------

    full_name = data.get("full_name")
    age = data.get("age")
    gender = data.get("gender")
    description = data.get("description")
    last_seen_location = data.get("last_seen_location")
    last_seen_date = data.get("last_seen_date")

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not full_name:
        return jsonify({
            "msg": "Full name is required."
        }), 400

    # --------------------------------------------------------
    # AGE
    # --------------------------------------------------------

    if age in ("", None):
        age = None

    elif isinstance(age, str):
        try:
            age = int(age)

        except ValueError:
            return jsonify({
                "msg": "Age must be a valid number."
            }), 400

    # --------------------------------------------------------
    # DATE
    # --------------------------------------------------------

    parsed_date = None

    if last_seen_date:
        try:
            parsed_date = datetime.strptime(
                last_seen_date,
                "%Y-%m-%d"
            ).date()

        except ValueError:
            return jsonify({
                "msg": "Last seen date must be in YYYY-MM-DD format."
            }), 400

    # --------------------------------------------------------
    # PHOTO
    # --------------------------------------------------------

    photo_url = None

    if photo:
        photo_url, photo_error = save_photo(photo)

        if photo_error:
            return jsonify({
                "msg": photo_error
            }), 400

    # --------------------------------------------------------
    # CREATE DATABASE RECORD
    # --------------------------------------------------------

    missing_person = MissingPerson(
        full_name=full_name,
        age=age,
        gender=gender,
        description=description,
        last_seen_location=last_seen_location,
        last_seen_date=parsed_date,
        status="active",
        reported_by=int(user_id),
        photo_url=photo_url
    )

    db.session.add(missing_person)

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()

        if photo_url:
            delete_photo(photo_url)

        return jsonify({
            "msg": "Failed to create missing person report.",
            "error": str(e)
        }), 500

    return jsonify({
        "msg": "Missing person reported successfully.",
        "missing_person": serialize_missing_person(missing_person)
    }), 201


# ============================================================
# GET MY MISSING PERSON REPORTS
# ============================================================

@missing_person_bp.route(
    "/mine",
    methods=["GET"]
)
@jwt_required()
def get_my_missing_persons():

    current_user_id = int(get_jwt_identity())

    missing_persons = MissingPerson.query.filter_by(
        reported_by=current_user_id
    ).order_by(
        MissingPerson.created_at.desc()
    ).all()

    return jsonify([
        serialize_missing_person(person)
        for person in missing_persons
    ]), 200


# ============================================================
# GET ALL MISSING PERSONS
# ============================================================

@missing_person_bp.route(
    "",
    methods=["GET"]
)
def get_missing_persons():

    missing_persons = MissingPerson.query.order_by(
        MissingPerson.created_at.desc()
    ).all()

    return jsonify([
        serialize_missing_person(person)
        for person in missing_persons
    ]), 200


# ============================================================
# GET ONE MISSING PERSON
# ============================================================

@missing_person_bp.route(
    "/<int:person_id>",
    methods=["GET"]
)
def get_missing_person(person_id):

    missing_person = MissingPerson.query.get(person_id)

    if not missing_person:
        return jsonify({
            "msg": "Missing person not found."
        }), 404

    return jsonify(
        serialize_missing_person(missing_person)
    ), 200


# ============================================================
# SMART MISSING-PERSON MATCHING
# ============================================================

@missing_person_bp.route(
    "/<int:person_id>/matches",
    methods=["GET"]
)
def find_possible_matches(person_id):
    """
    Find other missing-person cases that may contain
    similar information.

    This is a decision-support feature.
    Results are POSSIBLE matches and must be reviewed
    by a human before any conclusion is made.
    """

    # --------------------------------------------------------
    # FIND THE ORIGINAL CASE
    # --------------------------------------------------------

    person = MissingPerson.query.get(person_id)

    if not person:
        return jsonify({
            "msg": "Missing person not found."
        }), 404

    # --------------------------------------------------------
    # GET OTHER ACTIVE CASES
    # --------------------------------------------------------

    candidates = MissingPerson.query.filter(
        MissingPerson.id != person.id,
        MissingPerson.status == "active"
    ).all()

    matches = []

    # --------------------------------------------------------
    # COMPARE CASES
    # --------------------------------------------------------

    for candidate in candidates:

        match_result = calculate_match(
            candidate,
            person
        )

        score = match_result["score"]

        # Only return cases above the minimum threshold
        if score < MINIMUM_MATCH_SCORE:
            continue

        matches.append({
            "person": serialize_missing_person(candidate),
            "match_score": score,
            "match_label": get_match_label(score),
            "reasons": match_result["reasons"],
            "similarity": match_result["components"]
        })

    # --------------------------------------------------------
    # SORT BY HIGHEST SIMILARITY
    # --------------------------------------------------------

    matches.sort(
        key=lambda item: item["match_score"],
        reverse=True
    )

    return jsonify({
        "source_person": serialize_missing_person(person),
        "total_matches": len(matches),
        "matches": matches
    }), 200


# ============================================================
# UPDATE MISSING PERSON
# ============================================================

@missing_person_bp.route(
    "/<int:person_id>",
    methods=["PUT"]
)
@jwt_required()
def update_missing_person(person_id):

    current_user_id = int(get_jwt_identity())

    missing_person = MissingPerson.query.get(person_id)

    if not missing_person:
        return jsonify({
            "msg": "Missing person not found."
        }), 404

    # --------------------------------------------------------
    # OWNERSHIP CHECK
    # --------------------------------------------------------

    if missing_person.reported_by != current_user_id:
        return jsonify({
            "msg": "You are not authorized to update this report."
        }), 403

    # --------------------------------------------------------
    # SUPPORT JSON AND FORM-DATA
    # --------------------------------------------------------

    if request.content_type and request.content_type.startswith(
        "multipart/form-data"
    ):
        data = request.form
        new_photo = request.files.get("photo")

    else:
        data = request.get_json(silent=True) or {}
        new_photo = None

    # --------------------------------------------------------
    # UPDATE TEXT FIELDS
    # --------------------------------------------------------

    if "full_name" in data:

        full_name = data.get("full_name")

        if full_name:
            missing_person.full_name = full_name

    if "age" in data:

        age = data.get("age")

        if age in ("", None):
            missing_person.age = None

        else:
            try:
                missing_person.age = int(age)

            except ValueError:
                return jsonify({
                    "msg": "Age must be a valid number."
                }), 400

    if "gender" in data:
        missing_person.gender = data.get("gender")

    if "description" in data:
        missing_person.description = data.get("description")

    if "last_seen_location" in data:

        missing_person.last_seen_location = data.get(
            "last_seen_location"
        )

    if "last_seen_date" in data:

        last_seen_date = data.get("last_seen_date")

        if last_seen_date in ("", None):

            missing_person.last_seen_date = None

        else:

            try:
                missing_person.last_seen_date = datetime.strptime(
                    last_seen_date,
                    "%Y-%m-%d"
                ).date()

            except ValueError:
                return jsonify({
                    "msg": "Last seen date must be in YYYY-MM-DD format."
                }), 400

    # --------------------------------------------------------
    # UPDATE STATUS
    # --------------------------------------------------------

    if "status" in data:

        status = data.get("status")

        if status not in ALLOWED_STATUSES:
            return jsonify({
                "msg": (
                    "Invalid status. Use active, "
                    "under_investigation, found, or closed."
                )
            }), 400

        missing_person.status = status

    # --------------------------------------------------------
    # UPDATE PHOTO
    # --------------------------------------------------------

    old_photo_url = missing_person.photo_url
    new_photo_url = None

    if new_photo:

        new_photo_url, photo_error = save_photo(new_photo)

        if photo_error:
            return jsonify({
                "msg": photo_error
            }), 400

        missing_person.photo_url = new_photo_url

    # --------------------------------------------------------
    # SAVE CHANGES
    # --------------------------------------------------------

    try:
        db.session.commit()

    except Exception as e:

        db.session.rollback()

        if new_photo_url:
            delete_photo(new_photo_url)

        return jsonify({
            "msg": "Failed to update missing person report.",
            "error": str(e)
        }), 500

    # Delete old photo only after successful update
    if new_photo_url and old_photo_url:
        delete_photo(old_photo_url)

    return jsonify({
        "msg": "Missing person updated successfully.",
        "missing_person": serialize_missing_person(missing_person)
    }), 200


# ============================================================
# DELETE MISSING PERSON
# ============================================================

@missing_person_bp.route(
    "/<int:person_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_missing_person(person_id):

    current_user_id = int(get_jwt_identity())

    missing_person = MissingPerson.query.get(person_id)

    if not missing_person:
        return jsonify({
            "msg": "Missing person not found."
        }), 404

    # --------------------------------------------------------
    # OWNERSHIP CHECK
    # --------------------------------------------------------

    if missing_person.reported_by != current_user_id:
        return jsonify({
            "msg": "You are not authorized to delete this report."
        }), 403

    # Save photo URL before deleting database record
    photo_url = missing_person.photo_url

    try:

        db.session.delete(missing_person)
        db.session.commit()

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "msg": "Failed to delete missing person report.",
            "error": str(e)
        }), 500

    # Delete associated photo after successful database deletion
    if photo_url:
        delete_photo(photo_url)

    return jsonify({
        "msg": "Missing person deleted successfully."
    }), 200