from datetime import datetime

from app.extensions import db


class Sighting(db.Model):
    __tablename__ = "sightings"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    missing_person_id = db.Column(
        db.Integer,
        db.ForeignKey("missing_persons.id"),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    location = db.Column(
        db.String(255),
        nullable=False
    )

    sighting_date = db.Column(
        db.Date,
        nullable=True
    )

    reported_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    missing_person = db.relationship(
        "MissingPerson",
        backref="sightings"
    )

    reporter = db.relationship(
        "User",
        backref="sighting_reports"
    )

    def __repr__(self):
        return f"<Sighting {self.id}>"