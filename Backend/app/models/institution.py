from datetime import datetime
from app.extensions import db


class Institution(db.Model):
    __tablename__ = "institutions"

    id = db.Column(db.Integer, primary_key=True)

    # Linked user account — role will be "institution"
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        unique=True
    )

    # Facility info
    facility_name = db.Column(db.String(255), nullable=False)

    # "hospital" | "police"
    facility_type = db.Column(db.String(50), nullable=False)

    region = db.Column(db.String(150), nullable=False)
    city = db.Column(db.String(150), nullable=False)
    address = db.Column(db.String(400), nullable=True)
    contact_phone = db.Column(db.String(50), nullable=True)

    # Admin-reviewed approval
    # "pending" | "approved" | "rejected"
    status = db.Column(
        db.String(30),
        nullable=False,
        default="pending"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    user = db.relationship("User", backref="institution_profile")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "facility_name": self.facility_name,
            "facility_type": self.facility_type,
            "region": self.region,
            "city": self.city,
            "address": self.address,
            "contact_phone": self.contact_phone,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<Institution {self.facility_name}>"
