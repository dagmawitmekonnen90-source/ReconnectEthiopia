from flask import Flask, render_template
from flask_cors import CORS
import os

from .extensions import db, migrate, bcrypt, jwt


def create_app():

    # Frontend folder is one level above Backend
    frontend_folder = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            "Frontend"
        )
    )

    app = Flask(
        __name__,
        template_folder=frontend_folder
    )

    # ============================================================
    # LOAD CONFIGURATION
    # ============================================================

    app.config.from_object("app.config.Config")


    # ============================================================
    # ENABLE CORS
    # ============================================================

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                    "https://reconnect-ethiopia.vercel.app",
                    # Add any custom domain here too
                ]
            }
        }
    )


    # ============================================================
    # INITIALIZE EXTENSIONS
    # ============================================================

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)


    # ============================================================
    # IMPORT MODELS
    # ============================================================

    # Import models so Flask-Migrate can detect them
    from .models import User, MissingPerson, Sighting, CaseEvent, Notification, Institution, UnidentifiedRecord


    # ============================================================
    # REGISTER API ROUTES
    # ============================================================

    # Authentication routes
    from .routes.auth import auth_bp
    app.register_blueprint(auth_bp)


    # Missing person routes
    from .routes.missing_person import missing_person_bp
    app.register_blueprint(missing_person_bp)


    # Sighting routes
    from .routes.sighting import sighting_bp
    app.register_blueprint(sighting_bp)


    # Case event / timeline routes
    from .routes.case_event import case_event_bp
    app.register_blueprint(case_event_bp)


    # Admin routes
    from .routes.admin import admin_bp
    app.register_blueprint(admin_bp)

    # Dashboard reports routes
    from .routes.dashboard_reports import dashboard_reports_bp
    app.register_blueprint(dashboard_reports_bp)

    # Institution + unidentified records routes
    from .routes.institution import institution_bp
    app.register_blueprint(institution_bp)

    # Notification routes
    from .routes.notification import notification_bp
    app.register_blueprint(notification_bp)


    # ============================================================
    # FRONTEND PAGES
    # ============================================================

    # ------------------------------------------------------------
    # Homepage
    # ------------------------------------------------------------

    @app.route("/")
    def home():
        return render_template("index.html")


    # ------------------------------------------------------------
    # Login page
    # ------------------------------------------------------------

    @app.route("/login")
    def login_page():
        return render_template("login.html")


    # ------------------------------------------------------------
    # Register page
    # ------------------------------------------------------------

    @app.route("/register")
    def register_page():
        return render_template("register.html")


    # ------------------------------------------------------------
    # User Dashboard
    # ------------------------------------------------------------

    @app.route("/dashboard")
    def dashboard_page():
        return render_template("dashboard.html")


    # ------------------------------------------------------------
    # ADMIN DASHBOARD
    # ------------------------------------------------------------

    @app.route("/admin-dashboard")
    def admin_dashboard_page():
        return render_template("admin_dashboard.html")


    # ------------------------------------------------------------
    # Missing persons page
    # ------------------------------------------------------------

    @app.route("/missing-persons")
    def missing_persons_page():
        return render_template("missing_persons.html")


    # ------------------------------------------------------------
    # Individual missing person details page
    # ------------------------------------------------------------

    @app.route("/missing-persons/<int:person_id>")
    def missing_person_details_page(person_id):
        return render_template("missing_person_details.html")


    # ------------------------------------------------------------
    # Missing person report page
    # ------------------------------------------------------------

    @app.route("/report-missing")
    def report_missing_page():
        return render_template("report_missing.html")


    # ------------------------------------------------------------
    # Sighting report page
    # ------------------------------------------------------------

    @app.route("/report-sighting")
    def report_sighting_page():
        return render_template("report_sighting.html")


    # ------------------------------------------------------------
    # All sighting reports page
    # ------------------------------------------------------------

    @app.route("/sightings")
    def sightings_page():
        return render_template("sightings.html")


    # ------------------------------------------------------------
    # Individual sighting details page
    # ------------------------------------------------------------

    @app.route("/sighting-details/<int:sighting_id>")
    def sighting_details_page(sighting_id):
        return render_template("sighting_details.html")


    # ============================================================
    # HEALTH CHECK
    # ============================================================

    @app.route("/health")
    def health():
        return {
            "status": "ok",
            "message": "ReConnect Ethiopia backend is running"
        }, 200


    # ============================================================
    # RETURN APP
    # ============================================================

    return app