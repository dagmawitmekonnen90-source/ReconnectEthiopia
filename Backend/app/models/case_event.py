from datetime import datetime

from app.extensions import db


class CaseEvent(db.Model):
    __tablename__ = "case_events"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    missing_person_id = db.Column(
        db.Integer,
        db.ForeignKey("missing_persons.id"),
        nullable=False
    )

    event_type = db.Column(
        db.String(50),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=False
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    missing_person = db.relationship(
        "MissingPerson",
        backref=db.backref(
            "case_events",
            lazy=True,
            cascade="all, delete-orphan"
        )
    )

    creator = db.relationship(
        "User",
        backref="case_events_created"
    )

    def __repr__(self):
        return f"<CaseEvent {self.event_type} for Case {self.missing_person_id}>"