from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Notification

notification_bp = Blueprint(
    "notification",
    __name__,
    url_prefix="/api/notifications"
)


# ============================================================
# GET MY NOTIFICATIONS
# ============================================================

@notification_bp.route("", methods=["GET"])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())

    # Optional ?unread_only=true filter
    unread_only = request.args.get("unread_only", "false").lower() == "true"

    query = Notification.query.filter_by(user_id=user_id)
    if unread_only:
        query = query.filter_by(is_read=False)

    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    unread_count  = Notification.query.filter_by(user_id=user_id, is_read=False).count()

    return jsonify({
        "unread_count": unread_count,
        "count": len(notifications),
        "notifications": [n.to_dict() for n in notifications],
    }), 200


# ============================================================
# MARK ONE NOTIFICATION AS READ
# ============================================================

@notification_bp.route("/<int:notif_id>/read", methods=["POST"])
@jwt_required()
def mark_read(notif_id):
    user_id = int(get_jwt_identity())
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first()

    if not notif:
        return jsonify({"error": "Notification not found"}), 404

    notif.is_read = True
    db.session.commit()
    return jsonify({"message": "Marked as read"}), 200


# ============================================================
# MARK ALL NOTIFICATIONS AS READ
# ============================================================

@notification_bp.route("/read-all", methods=["POST"])
@jwt_required()
def mark_all_read():
    user_id = int(get_jwt_identity())

    Notification.query.filter_by(
        user_id=user_id, is_read=False
    ).update({"is_read": True})

    db.session.commit()
    return jsonify({"message": "All notifications marked as read"}), 200


# ============================================================
# DELETE A NOTIFICATION
# ============================================================

@notification_bp.route("/<int:notif_id>", methods=["DELETE"])
@jwt_required()
def delete_notification(notif_id):
    user_id = int(get_jwt_identity())
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first()

    if not notif:
        return jsonify({"error": "Notification not found"}), 404

    db.session.delete(notif)
    db.session.commit()
    return jsonify({"message": "Notification deleted"}), 200
