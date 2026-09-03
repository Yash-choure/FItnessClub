<div align="center">

# FITNESS CLUB

### A focused membership, attendance, and fitness-club management platform

<p>
  <a href="#getting-started"><strong>Get started</strong></a>
  &nbsp;&bull;&nbsp;
  <a href="#available-scripts"><strong>Run the project</strong></a>
  &nbsp;&bull;&nbsp;
  <a href="#testing"><strong>Run tests</strong></a>
</p>

![Node.js](https://img.shields.io/badge/Node.js-20%2B-1f2937?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-111827?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8-047857?style=for-the-badge&logo=mongodb&logoColor=white)
![Jest](https://img.shields.io/badge/tests-Jest-c2410c?style=for-the-badge&logo=jest&logoColor=white)

</div>

<br>

## Overview

Fitness Club is a server-rendered web application for running the day-to-day operations of a modern gym. Members can create accounts, manage their profiles and memberships, review attendance, make payments, and book sauna sessions. Staff and administrators get dedicated dashboards for managing members, plans, trainers, payments, reports, and audit activity.

The application is built around a simple principle: keep the member experience welcoming while giving the team clear operational visibility.

## Capabilities

| Member experience | Club operations |
| --- | --- |
| Account signup, login, logout, and password changes | Admin dashboard and role-based access |
| Profile and membership management | Member, plan, trainer, and payment management |
| Membership upgrades, changes, and cancellations | Attendance tracking and trainer dashboards |
| Attendance history and sauna-session booking | Reports, audit logs, and expiry reminders |
| Payments and payment confirmation pages | Member profile image uploads |

The public-facing site also includes pages for the club, classes, trainers, pricing, contact, and membership information.

## Built With

- **Views:** EJS, HTML, CSS, and JavaScript
- **Application server:** Node.js and Express
- **Data layer:** MongoDB with Mongoose
- **Authentication:** Passport Local, sessions, bcrypt, and JWT utilities
- **Validation and security:** Joi, CSRF middleware, cookie parsing, and method override
- **Email and documents:** Nodemailer and PDFKit
- **Testing:** Jest, Supertest, and MongoDB Memory Server

## Project Structure

```text
FitnessClub/
├── controllers/       Request handlers and business workflows
├── middlewares/       Authentication, CSRF, and upload middleware
├── models/            Mongoose data models
├── routes/            Public, member, trainer, and admin routes
├── scripts/           Maintenance and data-seeding scripts
├── utils/             Validation, membership, reporting, and helper logic
├── views/             EJS pages and reusable partials
├── public/            Stylesheets, browser scripts, and uploads
├── server.js          Application entry point
└── __tests__/         Jest and Supertest test suites
```

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm
- A MongoDB database, local or hosted

### Installation

```bash
git clone https://github.com/yash-choure/FitnessClub.git
cd FitnessClub
npm install
```

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/fitnessclub
```

For membership expiry emails, configure the optional SMTP variables:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-user
SMTP_PASS=your-password
SMTP_FROM=no-reply@example.com
```

Start the development server and open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the server with Nodemon |
| `npm start` | Start the production server |
| `npm test` | Run the Jest test suite |
| `npm run seed` | Seed the admin account |

## Testing

Run all automated tests:

```bash
npm test
```

The suite covers authentication flows, validation, and key member-management behavior. Tests use Supertest for HTTP assertions and an in-memory MongoDB instance where database state is required.

## Configuration Notes

- Keep `.env` out of source control and use strong credentials for production services.
- The `public/uploads/members` directory is used for member profile uploads.
- Configure SMTP only when automated membership expiry reminders are required.

## Contributing

1. Create a focused branch from the current main branch.
2. Make the change and add or update tests where behavior changes.
3. Run `npm test` before opening a pull request.
4. Open a pull request with a concise description of the change.

## License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.

## Maintainer

Built and maintained by **Yash Choure** (`yash-choure`).

<div align="center">

<sub>Fitness Club &bull; A practical foundation for healthier communities</sub>

</div>