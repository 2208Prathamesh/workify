<div align="center">

# Workify
### Work for Everyone.

**Connecting people with opportunities and employers with the right workers.**

A community-focused job platform designed to make work discovery and hiring more accessible, including for people seeking local and daily-wage employment.

<br />

[![Live Website](https://img.shields.io/badge/Live%20Website-Visit%20Workify-FF6B35?style=for-the-badge)](https://workify.buildto.in)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-Framework-black?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Language-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

[Explore the Project](https://github.com/2208Prathamesh/workify) · [Report a Bug](https://github.com/2208Prathamesh/workify/issues)

**Discover opportunities. Build connections. Make work accessible.**

</div>

---

## 📌 Overview

**Workify** is a web-based job discovery and worker-hiring platform built to connect job seekers with employers through a common digital space.

Traditional job portals often focus on formal employment and résumé-based applications. Workify aims to make finding work more approachable, particularly for people looking for local jobs, practical work opportunities, and daily-wage employment.

The platform brings together job seekers, employers, and administrators through role-based accounts, job listings, application management, user profiles, messaging, notifications, and ratings.

Whether someone is searching for work or looking for suitable workers, Workify provides a centralized platform to discover opportunities and manage connections.

### 🎯 Vision

To make employment opportunities more accessible by simplifying how people discover work and how employers connect with potential workers.

### 💡 Problem Statement

Many people face challenges when searching for suitable employment, including limited access to job information, dependence on informal networks, and the complexity of traditional recruitment processes.

Employers can also struggle to find available workers with the skills and location preferences needed for a job.

Workify aims to address these challenges through a digital platform that brings job discovery, worker profiles, and hiring workflows together in one place.

## ✨ Key Features

### 👤 User Management
- Role-based accounts for job seekers, employers, and administrators.
- Authentication with password hashing.
- Session-based login management.
- Individual user profiles.

### 💼 Job Discovery and Hiring
- Create and manage job listings.
- Browse available work opportunities.
- Submit applications for relevant jobs.
- Track application statuses.
- Save job opportunities for later.
- Manage job availability and listing status.

### 🧑‍🔧 Worker Profiles
- Maintain personal and professional information.
- Showcase skills, experience, and location.
- Support profile images and media uploads.
- Help employers discover potentially suitable workers.

### 💬 Communication and Engagement
- Messaging functionality for platform users.
- Notifications for relevant activities.
- Ratings and feedback functionality.

### 🛡️ Administration
- Dedicated administrative API routes.
- User and platform management capabilities.
- Configurable email-related settings.

*Available features depend on the current application implementation and service configuration.*

## 🧰 Technology Stack

| Component | Technology |
|---|---|
| Frontend | React-based bundled UI, HTML, CSS, JavaScript |
| Backend | Node.js |
| Web framework | Express.js |
| Database | MongoDB |
| Object Data Modeling | Mongoose |
| Authentication support | bcryptjs |
| Session management | express-session, connect-mongo |
| Image and file uploads | Multer, Cloudinary |
| Email functionality | Nodemailer |
| Environment configuration | dotenv |
| Deployment configuration | Vercel |

## 🏗️ System Architecture

Workify follows a client-server architecture. The frontend communicates with backend API routes, while the backend handles application logic, authentication, database operations, and supporting services.

```text
                 ┌────────────────────────┐
                 │        Workify         │
                 │      Web Frontend      │
                 └────────────┬───────────┘
                              │
                         HTTP / API
                              │
                 ┌────────────▼───────────┐
                 │      Express.js        │
                 │     Backend Server     │
                 └────────────┬───────────┘
                              │
              ┌───────────────┼────────────────┐
              │               │                │
      ┌───────▼───────┐ ┌─────▼─────┐ ┌────────▼────────┐
      │ Authentication│ │ Job and   │ │ Profiles and    │
      │ and Sessions  │ │ Applications│ │ Communication  │
      └───────────────┘ └─────┬─────┘ └─────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │      MongoDB      │
                    │ Persistent Storage│
                    └───────────────────┘

       Supporting services: Cloudinary and Email
```

## 📂 Project Structure

```text
workify/
├── lib/
│   └── mongoose.js          # Database connection and initialization
├── models/
│   ├── Application.js       # Job application model
│   ├── Job.js               # Job listing model
│   ├── Message.js            # Messaging model
│   ├── Notification.js       # Notification model
│   ├── Profile.js            # User profile model
│   ├── Rating.js             # Rating model
│   ├── SavedJob.js           # Saved jobs model
│   ├── SmtpSettings.js       # Email configuration model
│   └── User.js               # User model
├── public/
│   ├── assets/              # Bundled frontend assets
│   ├── css/                 # Stylesheets
│   ├── js/                  # Frontend JavaScript
│   └── index.html           # Frontend entry point
├── routes/
│   ├── admin.js             # Administrative operations
│   ├── applications.js      # Application endpoints
│   ├── auth.js              # Authentication endpoints
│   ├── jobs.js              # Job endpoints
│   ├── messages.js          # Messaging endpoints
│   ├── notifications.js     # Notification endpoints
│   ├── profile.js           # Profile endpoints
│   └── ratings.js           # Rating endpoints
├── utils/
│   └── email.js             # Email utilities
├── .env.example             # Environment variable template
├── .gitignore
├── db.js                    # SQLite database module
├── package.json
├── package-lock.json
├── server.js                # Express application entry point
└── vercel.json              # Vercel deployment configuration
```

The main application server uses MongoDB through Mongoose. `db.js` contains a separate SQLite database module and is not the database connection used by the main server.

## 🌍 Sustainable Development Goals (SDGs)

Workify is designed with social accessibility and employment opportunities in mind. Its intended impact aligns with the United Nations Sustainable Development Goals.

### 🟢 SDG 8 — Decent Work and Economic Growth

**Primary alignment**

Workify aims to support access to employment opportunities by helping job seekers discover work and enabling employers to find potential workers.

**How Workify aligns:**
- Provides a digital channel for discovering work opportunities.
- Supports connections between job seekers and employers.
- Includes job listings and application-management workflows.
- Aims to make local and daily-wage opportunities easier to discover.
- Can help broaden access to employment information.

**Relevant UN target:**

[Target 8.5 — Full and productive employment and decent work for all](https://sdgs.un.org/goals/goal8)

This target calls for productive employment and decent work for women and men, including young people and persons with disabilities, and equal pay for work of equal value.

### 🔵 SDG 10 — Reduced Inequalities

**Supporting alignment**

Workify aims to make job discovery more approachable for people who may not rely on traditional résumé-based recruitment or established professional networks.

**How Workify aligns:**
- Focuses on accessible job discovery.
- Supports profiles that can communicate skills and experience.
- Aims to connect employers and workers through a shared platform.
- Provides opportunities to improve access to employment information.

**Relevant UN target:**

[Target 10.2 — Promote social, economic and political inclusion](https://sdgs.un.org/goals/goal10)

This target focuses on empowering and promoting the inclusion of all people, irrespective of age, sex, disability, origin, or economic and other status.

### 🌱 Intended Social Impact

Workify aims to contribute to a more accessible employment ecosystem where people can discover opportunities and employers can reach potential workers.

The platform's alignment with these SDGs represents its intended purpose, not a claim that it has independently measured social impact or received official UN endorsement.

Future development could strengthen this contribution through accessibility improvements, transparent job information, worker-safety guidance, and measures to reduce discriminatory hiring practices.

## 🚀 Getting Started

Follow these steps to run Workify locally.

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) — LTS version recommended.
- npm — Included with Node.js.
- [MongoDB Atlas](https://www.mongodb.com/atlas) account or another accessible MongoDB deployment.

### 1. Clone the Repository

```bash
git clone https://github.com/2208Prathamesh/workify.git
cd workify
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a local `.env` file using the provided template.

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

Add your configuration to `.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority

SESSION_SECRET=replace-with-a-long-random-secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

NODE_ENV=development
```

Replace all placeholders with your actual configuration values.

**Important setup notes:**

- Configure your MongoDB database user and network access rules.
- Ensure `MONGODB_URI` points to a valid database.
- Configure Cloudinary credentials if you use image-upload functionality.
- Keep `.env` private and never commit real credentials.
- Use a unique, strong `SESSION_SECRET` in production.

### 4. Start the Server

Run the application:

```bash
npm start
```

For development with automatic restarts, use:

```bash
npm run dev
```

The development command requires Nodemon to be available. If it is not installed, run:

```bash
npm install --save-dev nodemon
```

### 5. Open Workify

Visit:

**http://localhost:3000**

The frontend is served by the Express application.

## ⚙️ Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `SESSION_SECRET` | Secret used to sign session identifiers |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `NODE_ENV` | Application runtime environment |

MongoDB and a secure session secret are essential for a properly configured deployment. Cloudinary credentials are required for the corresponding media-upload features.

## 🔌 API Overview

The Express server registers the following API route groups:

| Endpoint | Purpose |
|---|---|
| `/api/auth` | User authentication |
| `/api/jobs` | Job listing operations |
| `/api/applications` | Job applications |
| `/api/profile` | User profile management |
| `/api/ratings` | Ratings and feedback |
| `/api/messages` | Messaging |
| `/api/notifications` | Notifications |
| `/api/admin` | Administrative operations |

For implementation details, refer to the corresponding JavaScript files inside `routes/`.

## ☁️ Deployment

Workify includes Vercel configuration and is structured to serve its frontend assets through Express.

### Deployment checklist

1. Import the GitHub repository into Vercel.
2. Configure the required environment variables.
3. Verify MongoDB connectivity from the deployment environment.
4. Set `NODE_ENV=production`.
5. Configure a strong and unique session secret.
6. Configure Cloudinary and email services when needed.
7. Test authentication, profiles, job listings, applications, and other enabled workflows.

### Production Security

Before making the platform available to real users:

- Remove the fallback session secret from the production configuration.
- Change or remove automatically seeded administrator and demo-account credentials.
- Review authentication, authorization, and administrator access controls.
- Validate user input and restrict uploaded file types and sizes.
- Configure secure cookies and HTTPS appropriately.
- Restrict database access to trusted sources whenever possible.
- Verify that application errors do not expose sensitive information.

## 🗺️ Future Roadmap

Potential improvements for future development:

- [ ] Advanced job search and location-based filtering.
- [ ] Improved mobile accessibility and responsive experiences.
- [ ] Better validation and verification of job listings.
- [ ] Stronger account security and abuse prevention.
- [ ] Automated testing for important workflows.
- [ ] Improved documentation with API request and response examples.
- [ ] Accessibility improvements for users with disabilities.
- [ ] Worker-safety guidance and transparent job information.
- [ ] Evaluation of the platform's contribution to employment accessibility and SDG objectives.

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.

   ```bash
   git checkout -b feat/your-feature
   ```

3. Make your changes and test them locally.
4. Commit your changes.

   ```bash
   git commit -m "feat: describe your change"
   ```

5. Push your branch and open a Pull Request.

For significant changes, open an issue first to discuss the proposed improvement.

## 🐛 Issues and Feedback

Found a bug or have an idea to improve Workify?

[Open an issue on GitHub](https://github.com/2208Prathamesh/workify/issues)

## 👨‍💻 Project Author

**Prathamesh Barbole**

- GitHub: [@2208Prathamesh](https://github.com/2208Prathamesh)
- Repository: [2208Prathamesh/workify](https://github.com/2208Prathamesh/workify)
- Live website: [workify.buildto.in](https://workify.buildto.in)

## 📄 License

The repository's `package.json` specifies the ISC license, but a corresponding `LICENSE` file is not currently included. Add the appropriate license file to make the project's usage and redistribution terms explicit.

---

<div align="center">

### Workify — Work for Everyone.

**Technology with a purpose. Opportunities for everyone.**

*Designed to support more accessible work discovery and contribute toward a more inclusive employment ecosystem.*

[Back to Top](#workify)

</div>
