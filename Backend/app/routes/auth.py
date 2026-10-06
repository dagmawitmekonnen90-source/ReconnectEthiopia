from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from app.extensions import db, bcrypt
from app.models import User


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")

    if not full_name or not email or not password:
        return jsonify({
            "error": "Full name, email, and password are required"
        }), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "error": "A user with this email already exists"
        }), 409

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    user = User(
        full_name=full_name,
        email=email,
        password_hash=password_hash
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "User registered successfully",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role
        }
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "error": "Email and password are required"
        }), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    if not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    # Block banned accounts
    if user.is_banned:
        return jsonify({
            "error": "Your account has been suspended. Please contact the administrator.",
            "banned": True,
            "ban_reason": user.ban_reason or "No reason provided."
        }), 403

    access_token = create_access_token(
        identity=str(user.id)
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role
        }
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()

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
            "created_at": user.created_at.isoformat()
        }
    }), 200