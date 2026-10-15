<!-- Workify README -->

<div align="center">

# Workify

### Work for Everyone.

**A community-focused job platform connecting people looking for work with employers who need reliable workers.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-workify.buildto.in-FF6B35?style=for-the-badge&logo=vercel&logoColor=white)](https://workify.buildto.in)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-API-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

**Discover opportunities. Connect with employers. Find the right people for the work.**

</div>

---

## 📌 About

**Workify** is a web-based job platform designed to make work discovery and worker hiring more accessible. It brings job seekers and employers into one place, with a focus on practical opportunities—including local and daily-work roles that may not require a traditional résumé.

Job seekers can create a profile and explore available jobs, while employers can publish opportunities and manage applications. Workify also includes supporting features for communication, notifications, ratings, and administration.

> **Mission:** Make finding work and finding workers simpler, more approachable, and more accessible.

## ✨ Features

- **Role-based accounts** — Separate experiences for job seekers, employers, and administrators.
- **Authentication and sessions** — Account login with password hashing and server-side sessions.
- **Job listings** — Publish, browse, and manage job opportunities.
- **Applications** — Submit applications and track application status.
- **Worker profiles** — Keep skills, experience, location, and other profile information in one place.
- **Messaging** — Communication support between platform users.
- **Notifications** — Keep users informed about relevant activity.
- **Ratings and feedback** — Reputation features to support more informed decisions.
- **Saved jobs** — Save opportunities for later.
- **Profile image uploads** — Cloudinary integration for media storage.
- **Email support** — Nodemailer-based email utilities, configurable for your SMTP provider.
- **Admin tools** — Administrative routes for platform management.
- **Deployment-ready structure** — Express server configured to serve the built frontend and support Vercel deployment.

*Feature availability may depend on the current deployment configuration and environment variables.*

## 🧰 Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | HTML, CSS, JavaScript, bundled web assets |
| Backend | Node.js, Express.js |
| Database / ODM | MongoDB, Mongoose |
| Authentication | bcryptjs, express-session, connect-mongo |
| File uploads | Multer, Cloudinary, multer-storage-cloudinary |
| Email | Nodemailer |
| Configuration | dotenv |
| Deployment configuration | Vercel |

## 🏗️ Project Structure

```text
workify/
├── public/                 # Frontend assets and static files
│   ├── assets/             # Bundled frontend assets
│   ├── css/
│   ├── js/
│   └── index.html
├── routes/                 # Express API route handlers
│   ├── auth.js
│   ├── jobs.js
│   ├── applications.js
│   ├── profile.js
│   ├── messages.js
│   ├── notifications.js
│   ├── ratings.js
│   └── admin.js
├── models/                 # Mongoose data models
├── lib/
│   └── mongoose.js         # MongoDB connection and initial setup
├── utils/
│   └── email.js            # Email utilities
├── server.js               # Express server and route registration
├── .env.example            # Environment variable template
├── package.json
└── vercel.json             # Vercel routing configuration
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm (included with Node.js)
- A MongoDB database, such as [MongoDB Atlas](https://www.mongodb.com/atlas)

### 1. Clone the repository

```bash
git clone https://github.com/2208Prathamesh/workify.git
cd workify
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create your local `.env` file from the example template.

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

Update `.env` with your own values:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
SESSION_SECRET=replace-with-a-long-random-secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

NODE_ENV=development
```

**Configuration notes**
- Replace every placeholder with a real value; do not leave angle-bracket placeholders in a working URI.
- In MongoDB Atlas, create a database user and configure Network Access for your development environment.
- Cloudinary variables are needed for features that upload images.
- Configure email/SMTP settings wherever your deployment's email workflow expects them.
- Keep `.env` private. Never commit database passwords, API keys, or session secrets.

### 4. Run Workify

Start the server:

```bash
npm start
```

For development with automatic restarts:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> If `npm run dev` reports that `nodemon` is missing, install it with `npm install --save-dev nodemon`, or use `npm start`.

## ⚙️ Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `SESSION_SECRET` | Secret used to sign session identifiers | Yes for production |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for image uploads | For upload features |
| `CLOUDINARY_API_KEY` | Cloudinary API key | For upload features |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | For upload features |
| `NODE_ENV` | Runtime environment; set to `production` for production deployment | Recommended |

The exact variables needed may vary by feature. Review the relevant configuration and route files when enabling optional services.

## 🔌 API Route Groups

The server registers these route groups:

| Base path | Purpose |
|---|---|
| `/api/auth` | Authentication and account access |
| `/api/jobs` | Job listing operations |
| `/api/applications` | Job applications |
| `/api/profile` | User profile operations |
| `/api/ratings` | Ratings and feedback |
| `/api/messages` | User messaging |
| `/api/notifications` | Notifications |
| `/api/admin` | Administrative operations |

HTTP methods, request bodies, and authorization rules are defined in the corresponding files under `routes/`.

## ☁️ Deployment

Workify includes a `vercel.json` configuration and an Express server that serves frontend assets from `public/`.

Typical deployment checklist:

1. Import the repository into Vercel.
2. Add the required environment variables to the project settings.
3. Verify that MongoDB accepts connections from the hosting environment.
4. Set `NODE_ENV=production` and configure a strong, unique `SESSION_SECRET`.
5. Configure Cloudinary and email settings if those features are enabled.
6. Deploy and test authentication, job listings, applications, profiles, uploads, and email flows as applicable.

### Production security checklist

Before using real users or production data:

- Replace the fallback session secret in `server.js` with a required environment variable.
- Change or remove seeded demo credentials in `lib/mongoose.js`.
- Review admin authorization, access controls, input validation, upload limits, and rate limiting.
- Use HTTPS and verify secure session-cookie behavior in the hosting environment.
- Restrict database network access to trusted sources wherever possible.

## 🗺️ Roadmap

Potential improvements for future releases:

- [ ] Enhance search, filters, and location-based job discovery.
- [ ] Add automated tests for critical user workflows.
- [ ] Document API request and response examples.
- [ ] Strengthen input validation, rate limiting, and security checks.
- [ ] Improve accessibility and mobile usability.
- [ ] Add deployment health checks and monitoring.

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Make your changes and test them locally.
4. Commit your changes: `git commit -m "feat: describe your change"`.
5. Push the branch and open a Pull Request.

For substantial changes, open an issue first to discuss the proposal.

## 🐛 Issues & Feedback

Found a bug or have an idea to improve Workify? Open an issue in the [GitHub Issues](https://github.com/2208Prathamesh/workify/issues).

## 👨‍💻 Author

**Prathamesh Barbole**

- GitHub: [@2208Prathamesh](https://github.com/2208Prathamesh)
- Repository: [2208Prathamesh/workify](https://github.com/2208Prathamesh/workify)
- Live site: [workify.buildto.in](https://workify.buildto.in)

## 📄 License

No dedicated open-source license is currently present in the repository. Until a license is added, the default copyright rules apply. Add a `LICENSE` file if you intend to permit reuse and redistribution.

---

<div align="center">

**Workify — Work for Everyone.**  
*Helping people connect through opportunity.*

[⬆ Back to top](#workify)

</div>
