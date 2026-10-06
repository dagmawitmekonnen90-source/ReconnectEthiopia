# ReConnect Ethiopia 🇪🇹

A centralized missing-persons platform for Ethiopia — connecting families, communities, hospitals, and law enforcement through shared information on missing persons, sightings, and unidentified individuals.

---

## Features

### Public
- Browse all reported missing persons (no login required)
- View individual case details and reported sightings

### Authenticated Users
- Report a missing person (photo upload, full description)
- Report a sighting of a missing person
- Personal dashboard with stats, recent activity, and case updates
- Real-time notification bell — get alerted when someone reports a sighting on your case

### Institutions (Hospitals & Police)
- Register as a hospital or police station (admin-approved)
- Submit unidentified patient/detainee records with no personal info
- Automatic matching against active missing-person cases
- Families receive instant notifications on potential matches

### Admin Panel
- Separate admin shell with dedicated sidebar navigation
- Manage all missing-person reports, sightings, case events
- User management — ban/unban accounts, change roles
- Account management — promote users to admin, reset bans
- Institution management — approve/reject hospital and police registrations
- View all unidentified records submitted by institutions

### Internationalisation & Theming
- Full Amharic (አማርኛ) translation alongside English
- Dark / Light mode toggle — preference persisted to localStorage

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, react-router-dom v7, react-i18next / i18next |
| Backend | Flask, Flask-SQLAlchemy, Flask-Migrate, Flask-JWT-Extended, Flask-CORS, Flask-Bcrypt |
| Database | PostgreSQL (Neon for production) |
| ORM / Migrations | SQLAlchemy + Alembic |
| Auth | JWT (Bearer tokens) |
| File uploads | Pillow, Werkzeug |
| Deployment | Frontend → Vercel · Backend → Vercel (Python runtime) · DB → Neon |

---

## Project Structure

```
ReconnectEthiopia/
├── Backend/                    # Flask API
│   ├── app/
│   │   ├── models/             # SQLAlchemy models
│   │   ├── routes/             # Blueprint route files
│   │   ├── utils/              # admin_required decorator
│   │   ├── static/uploads/     # uploaded photos
│   │   ├── extensions.py       # db, migrate, bcrypt, jwt
│   │   ├── config.py           # environment config
│   │   └── __init__.py         # create_app factory
│   ├── migrations/             # Alembic migration versions
│   ├── run.py                  # entry point
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # environment variable template
│   └── vercel.json             # Vercel Python deployment config
│
└── reconnect-frontend/         # React + Vite SPA
    ├── src/
    │   ├── components/         # Shared components (SiteNavbar, PageHeader, etc.)
    │   ├── context/            # ThemeContext
    │   ├── locales/            # en/ and am/ translation JSON files
    │   ├── pages/              # All page components + CSS
    │   ├── i18n.js             # i18next configuration
    │   ├── App.jsx             # Route definitions
    │   └── main.jsx            # Entry point with providers
    ├── public/
    ├── .env.example            # environment variable template
    ├── vercel.json             # Vercel SPA rewrite rules
    └── package.json
```

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL running locally

### Backend

```bash
cd Backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows PowerShell
# source venv/bin/activate    # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
copy .env.example .env        # Windows
# cp .env.example .env        # macOS / Linux

# Create the database (if it doesn't exist)
psql -U postgres -c "CREATE DATABASE reconnect_ethiopia_dev;"

# Run migrations
flask db upgrade

# Start the development server
python run.py
# → http://127.0.0.1:5000
```

### Frontend

```bash
cd reconnect-frontend

# Install dependencies
npm install

# Copy and fill in environment variables
copy .env.example .env        # Windows
# cp .env.example .env        # macOS / Linux

# Start the development server
npm run dev
# → http://localhost:5173
```

---

## Deployment

### Database — Neon

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project → copy the **connection string**
3. The connection string looks like:
   ```
   postgresql+psycopg://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
4. Set this as `DATABASE_URL` in your backend environment variables (Vercel dashboard)

### Backend — Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. From the `Backend/` folder:
   ```bash
   cd Backend
   vercel
   ```
3. Add environment variables in the Vercel project dashboard:
   - `DATABASE_URL` — your Neon connection string
   - `SECRET_KEY` — a strong random string
   - `JWT_SECRET_KEY` — a strong random string
4. Deploy: `vercel --prod`
5. Note your deployment URL (e.g. `https://reconnect-api.vercel.app`)

### Frontend — Vercel

1. From the `reconnect-frontend/` folder:
   ```bash
   cd reconnect-frontend
   vercel
   ```
2. Add environment variable in the Vercel project dashboard:
   - `VITE_API_BASE` — your backend deployment URL (e.g. `https://reconnect-api.vercel.app`)
3. Deploy: `vercel --prod`

> **Important:** After setting `VITE_API_BASE`, update every `http://127.0.0.1:5000` reference in the frontend to use `import.meta.env.VITE_API_BASE` — currently they are hardcoded for local development.

### Environment Variables Summary

| Variable | Where | Description |
|---|---|---|
| `DATABASE_URL` | Backend | PostgreSQL connection string (Neon for prod) |
| `SECRET_KEY` | Backend | Flask session secret |
| `JWT_SECRET_KEY` | Backend | JWT signing key |
| `VITE_API_BASE` | Frontend | Backend API base URL |

---

## API Overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register a user |
| POST | `/api/auth/login` | — | Login, get JWT |
| GET | `/api/missing-persons` | — | List all missing persons |
| POST | `/api/missing-persons` | User | Report a missing person |
| POST | `/api/sightings` | User | Report a sighting |
| GET | `/api/notifications` | User | Get notifications (with unread count) |
| POST | `/api/notifications/read-all` | User | Mark all notifications read |
| POST | `/api/institutions/register` | User | Apply for institution account |
| POST | `/api/institutions/records` | Institution | Submit unidentified record |
| GET | `/api/admin/dashboard` | Admin | Platform statistics |
| GET | `/api/admin/users` | Admin | All users |
| POST | `/api/admin/users/:id/ban` | Admin | Ban a user |
| POST | `/api/admin/users/:id/unban` | Admin | Unban a user |
| PUT | `/api/institutions/admin/:id/status` | Admin | Approve/reject institution |

---

## Default Admin Account

To create an admin account, register normally then update the role directly in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Or use the admin panel once you have one admin to promote others.

---

## License

MIT — free to use, modify, and distribute.
