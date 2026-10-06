from datetime import datetime
from app.extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)

    # Who receives the notification (the missing person reporter)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    # What it is about
    # "sighting_reported" | "institutional_match"
    notification_type = db.Column(
        db.String(50),
        nullable=False
    )

    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)

    # Optional link targets so the frontend can navigate directly
    missing_person_id = db.Column(
        db.Integer,
        db.ForeignKey("missing_persons.id"),
        nullable=True
    )

    # For sighting notifications
    sighting_id = db.Column(
        db.Integer,
        db.ForeignKey("sightings.id"),
        nullable=True
    )

    # For institutional match notifications
    unidentified_record_id = db.Column(
        db.Integer,
        nullable=True   # FK added after UnidentifiedRecord table exists
    )

    is_read = db.Column(db.Boolean, nullable=False, default=False)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    recipient = db.relationship("User", backref="notifications")
    missing_person = db.relationship("MissingPerson", backref="notifications")

    def to_dict(self):
        return {
            "id": self.id,
            "notification_type": self.notification_type,
            "title": self.title,
            "message": self.message,
            "missing_person_id": self.missing_person_id,
            "sighting_id": self.sighting_id,
            "unidentified_record_id": self.unidentified_record_id,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<Notification {self.notification_type} for user {self.user_id}>"
