from datetime import datetime

from app.extensions import db


class MissingPerson(db.Model):
    __tablename__ = "missing_persons"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    full_name = db.Column(
        db.String(150),
        nullable=False
    )

    age = db.Column(
        db.Integer,
        nullable=True
    )

    gender = db.Column(
        db.String(50),
        nullable=True
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    last_seen_location = db.Column(
        db.String(255),
        nullable=True
    )

    last_seen_date = db.Column(
        db.Date,
        nullable=True
    )

    status = db.Column(
        db.String(50),
        nullable=False,
        default="active"
    )

    reported_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    # ============================================================
    # PHOTO OF MISSING PERSON
    # ============================================================

    photo_url = db.Column(
        db.String(500),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    reporter = db.relationship(
        "User",
        backref="missing_person_reports"
    )

    def __repr__(self):
        return f"<MissingPerson {self.full_name}>"