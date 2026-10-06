from datetime import datetime
from app.extensions import db


class UnidentifiedRecord(db.Model):
    __tablename__ = "unidentified_records"

    id = db.Column(db.Integer, primary_key=True)

    # Which institution submitted this
    institution_id = db.Column(
        db.Integer,
        db.ForeignKey("institutions.id"),
        nullable=False
    )

    # Physical descriptors (no personal info)
    estimated_age_min = db.Column(db.Integer, nullable=True)
    estimated_age_max = db.Column(db.Integer, nullable=True)

    # "male" | "female" | "unknown"
    gender = db.Column(db.String(20), nullable=False, default="unknown")

    physical_description = db.Column(db.Text, nullable=True)

    # Where found / admitted
    found_location = db.Column(db.String(255), nullable=False)
    found_date = db.Column(db.Date, nullable=False)

    # "conscious" | "unconscious" | "stable" | "critical" | "deceased" | "in_custody"
    condition = db.Column(db.String(50), nullable=False, default="unknown")

    notes = db.Column(db.Text, nullable=True)

    # Optional photo
    photo_url = db.Column(db.String(500), nullable=True)

    # "open" | "identified" | "closed"
    status = db.Column(db.String(30), nullable=False, default="open")

    # If identified, link to the missing person
    matched_missing_person_id = db.Column(
        db.Integer,
        db.ForeignKey("missing_persons.id"),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    institution = db.relationship("Institution", backref="unidentified_records")
    matched_person = db.relationship("MissingPerson", backref="institutional_matches")

    def to_dict(self, include_institution=False):
        data = {
            "id": self.id,
            "institution_id": self.institution_id,
            "estimated_age_min": self.estimated_age_min,
            "estimated_age_max": self.estimated_age_max,
            "gender": self.gender,
            "physical_description": self.physical_description,
            "found_location": self.found_location,
            "found_date": self.found_date.isoformat() if self.found_date else None,
            "condition": self.condition,
            "notes": self.notes,
            "photo_url": self.photo_url,
            "status": self.status,
            "matched_missing_person_id": self.matched_missing_person_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if include_institution and self.institution:
            data["institution"] = self.institution.to_dict()
        return data

    def __repr__(self):
        return f"<UnidentifiedRecord {self.id} at {self.found_location}>"
