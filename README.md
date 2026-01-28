# Secure Full-Stack Application

A production-ready, secure web application featuring Docker containerization, FastAPI backend, PostgreSQL database, Redis session management, and comprehensive 2FA authentication.

## 🌟 Features

### Security Features
- ✅ **Bcrypt Password Hashing** - All passwords securely hashed with bcrypt
- ✅ **JWT Authentication** - Secure token-based authentication with refresh tokens
- ✅ **2FA/TOTP** - Time-based One-Time Password (compatible with Google Authenticator, Authy)
- ✅ **Rate Limiting** - Protection against brute-force attacks
- ✅ **SQL Injection Prevention** - Using SQLAlchemy ORM with parameterized queries
- ✅ **XSS Protection** - Input sanitization and output escaping
- ✅ **CSRF Protection** - Secure state-changing operations
- ✅ **Security Headers** - X-Frame-Options, X-Content-Type-Options, etc.
- ✅ **Account Lockout** - Temporary lockout after failed login attempts
- ✅ **Password Complexity** - Enforced password requirements
- ✅ **Environment-based Secrets** - No hardcoded credentials

### Technical Features
- 🐳 **Docker Containerization** - Complete multi-container setup
- 🔄 **Database Migrations** - Alembic for version-controlled schema changes
- 📊 **PostgreSQL Database** - Reliable, production-ready data storage
- 🚀 **Redis Caching** - Fast session management and rate limiting
- 📝 **API Documentation** - Auto-generated Swagger UI
- 🔍 **Health Checks** - Service monitoring and orchestration
- 📱 **Responsive Design** - Mobile-friendly frontend
- ⚡ **Async/Await** - High-performance async operations

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop** (v20.10 or higher)
  - Download from: https://www.docker.com/products/docker-desktop
- **Docker Compose** (v2.0 or higher, usually included with Docker Desktop)
- **PowerShell** (for Windows) or **Bash** (for Linux/Mac)

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

**Windows (PowerShell):**
```powershell
.\setup.ps1
```

**Linux/Mac (if you create a bash version):**
```bash
chmod +x setup.sh
./setup.sh
```

The setup script will:
1. Check for prerequisites (Docker, Docker Compose)
2. Generate secure random secrets
3. Create `.env` configuration file
4. Build Docker images
5. Start all containers
6. Run database migrations
7. Display access URLs

### Option 2: Manual Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd secure-app
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and replace all placeholder values with secure random strings:
   ```
   DB_PASSWORD=<your-secure-password>
   REDIS_PASSWORD=<your-secure-password>
   SECRET_KEY=<your-secret-key-min-32-chars>
   JWT_SECRET_KEY=<your-jwt-secret-key-min-32-chars>
   ```

3. **Build and start containers**
   ```bash
   docker compose build
   docker compose up -d
   ```

4. **Run database migrations**
   ```bash
   docker compose exec backend alembic upgrade head
   ```

## 🌐 Access the Application

After successful setup:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs
- **Alternative API Docs**: http://localhost:8000/api/redoc

## 📖 Usage Guide

### Creating an Account

1. Navigate to http://localhost:3000
2. Click **"Register"**
3. Fill in:
   - Username (min 3 characters)
   - Email address
   - Password (min 8 characters, must include uppercase, lowercase, and numbers)
4. Click **"Register"**
5. You'll be redirected to login

### Logging In

1. Enter your username and password
2. Click **"Login"**
3. If 2FA is enabled, enter your 6-digit code
4. You'll be redirected to the dashboard

### Enabling 2FA

1. Login to your account
2. Navigate to the dashboard
3. In the "Two-Factor Authentication" section, click **"Enable 2FA"**
4. Scan the QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
5. The 2FA will be active immediately
6. Next time you login, you'll need to provide the 6-digit code

### Managing Data

1. On the dashboard, click **"Add New Item"**
2. Enter a title and content
3. Click **"Save"**
4. Your data items will be displayed below
5. Click **"Delete"** to remove an item

## 🔧 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login with credentials | No |
| POST | `/api/auth/verify-2fa` | Verify 2FA code | No |
| POST | `/api/auth/enable-2fa` | Enable 2FA | Yes |
| POST | `/api/auth/disable-2fa` | Disable 2FA | Yes |
| GET | `/api/auth/me` | Get current user info | Yes |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout | Yes |

### Data Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | `/api/data/` | Get all user data items | Yes |
| POST | `/api/data/` | Create new data item | Yes |
| GET | `/api/data/{id}` | Get specific data item | Yes |
| DELETE | `/api/data/{id}` | Delete data item | Yes |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/` | API information |

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_USER` | PostgreSQL username | `secureapp` |
| `DB_PASSWORD` | PostgreSQL password | `random_secure_password` |
| `DB_NAME` | PostgreSQL database name | `secureappdb` |
| `REDIS_PASSWORD` | Redis password | `random_secure_password` |
| `SECRET_KEY` | Application secret key | `random_string_min_32_chars` |
| `JWT_SECRET_KEY` | JWT signing key | `random_string_min_32_chars` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000,http://localhost` |
| `DEBUG` | Debug mode | `false` |

## 🐳 Docker Commands

```bash
# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes all data)
docker compose down -v

# Restart services
docker compose restart

# Rebuild and restart
docker compose up -d --build

# Execute command in container
docker compose exec backend bash
docker compose exec db psql -U secureapp -d secureappdb
```

## 🗄️ Database Schema

### Users Table
- `id` - Primary key (integer)
- `username` - Unique username (string)
- `email` - Unique email address (string)
- `hashed_password` - Bcrypt hashed password (string)
- `totp_secret` - TOTP secret for 2FA (string, nullable)
- `is_2fa_enabled` - 2FA enabled flag (boolean)
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp
- `last_login` - Last login timestamp (nullable)
- `failed_login_attempts` - Failed login counter (integer)
- `locked_until` - Account lock timestamp (nullable)

### Data Items Table
- `id` - Primary key (integer)
- `user_id` - Foreign key to users (integer)
- `title` - Item title (string)
- `content` - Item content (text)
- `created_at` - Creation timestamp

## 🛠️ Development

### Running Backend Tests
```bash
docker compose exec backend pytest
```

### Running Database Migrations

Create a new migration:
```bash
docker compose exec backend alembic revision --autogenerate -m "Description"
```

Apply migrations:
```bash
docker compose exec backend alembic upgrade head
```

Rollback migration:
```bash
docker compose exec backend alembic downgrade -1
```

### Accessing Database
```bash
docker compose exec db psql -U secureapp -d secureappdb
```

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Contains sensitive credentials
2. **Use strong passwords** - Generate random strings for all secrets
3. **Enable 2FA** - Always use two-factor authentication
4. **Regular updates** - Keep dependencies up to date
5. **HTTPS in production** - Always use SSL/TLS in production
6. **Review logs** - Monitor for suspicious activity
7. **Backup database** - Regular backups of PostgreSQL data
8. **Rotate secrets** - Periodically change passwords and secret keys

## 🐛 Troubleshooting

### Services won't start
```bash
# Check if ports are already in use
docker compose down
docker compose up -d

# Check service status
docker compose ps

# View detailed logs
docker compose logs
```

### Database connection errors
```bash
# Restart database service
docker compose restart db

# Check database health
docker compose exec db pg_isready -U secureapp
```

### Frontend can't connect to backend
- Verify CORS_ORIGINS in `.env` includes your frontend URL
- Check that backend is running: http://localhost:8000/health
- Clear browser cache and cookies

### Migration errors
```bash
# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up -d
docker compose exec backend alembic upgrade head
```

## 📁 Project Structure

```
secure-app/
├── docker-compose.yml          # Docker orchestration
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── README.md                   # This file
├── setup.ps1                   # Automated setup script
├── backend/                    # Backend API
│   ├── Dockerfile              # Backend container definition
│   ├── requirements.txt        # Python dependencies
│   ├── alembic.ini             # Alembic configuration
│   ├── app/                    # Application code
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI app
│   │   ├── config.py           # Configuration
│   │   ├── database.py         # Database connection
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── auth.py             # Authentication utilities
│   │   ├── dependencies.py     # FastAPI dependencies
│   │   └── routers/            # API routers
│   │       ├── __init__.py
│   │       ├── auth.py         # Auth endpoints
│   │       └── data.py         # Data endpoints
│   └── alembic/                # Database migrations
│       ├── env.py
│       ├── script.py.mako
│       └── versions/
└── frontend/                   # Frontend web app
    ├── Dockerfile              # Frontend container definition
    ├── nginx.conf              # Nginx configuration
    ├── index.html              # Dashboard page
    ├── login.html              # Login/register page
    ├── css/
    │   └── style.css           # Styling
    └── js/
        ├── auth.js             # Authentication logic
        └── main.js             # Dashboard logic
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with ❤️ using FastAPI, PostgreSQL, Redis, and Docker**