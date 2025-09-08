# ⚙️ Timora Backend 

API and business logic for Timora, a student-friendly calendar and planning tool with Google Calendar integration.

## Tools & Technologies

* **Runtime:** [Bun](https://bun.sh/)
* **Framework:** [Express.js](https://expressjs.com/)
* **Database ORM:** [Prisma](https://www.prisma.io/)
* **Database:** [PostgreSQL](https://www.postgresql.org/)
* **Authentication:** [JWT](https://jwt.io/), [Passport.js](http://www.passportjs.org/) with Google OAuth 2.0
* **Validation:** [Zod](https://zod.dev/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/docs/installation)
- [Node.js](https://nodejs.org/en/download/) (for `npm` or `yarn` if you prefer)
- [Git](https://git-scm.com/downloads)

### Cloning the repository

```bash
git clone https://github.com/Ismael-Loko/timora-backend.git
cd timora-backend
```

### Installation

Install the dependencies using Bun:

```bash
bun install
```

### Running the app

```bash
bun run dev
```

The server will start on the port specified in your `.env` file (default is 8001).

## Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file:

### Server
- `PORT`: The port the server will run on.
- `NODE_ENV`: The environment (e.g., development, production).

### Database
- `DATABASE_URL`: The connection string for the database.
- `PGADMIN_DB_URL`: The connection string for pgAdmin.

### JWT
- `JWT_SECRET`: The secret key for signing JWTs.
- `JWT_EXPIRES_IN`: The expiration time for JWTs.
- `JWT_REFRESH_EXPIRES_IN`: The expiration time for refresh tokens.
- `JWT_REFRESH_SECRET`: The secret key for signing refresh tokens.

### Google OAuth
- `GOOGLE_CLIENT_ID`: The client ID for Google OAuth.
- `GOOGLE_CLIENT_SECRET`: The client secret for Google OAuth.
- `GOOGLE_REDIRECT_URI`: The redirect URI for Google OAuth.

### Frontend
- `DEV_FRONTEND_URL`: The URL of the frontend in development.
- `PROD_FRONTEND_ORIGIN`: The origin of the frontend in production.

### Email
- `EMAIL_SERVICE_API_KEY`: The API key for the email service.
- `EMAIL_FROM`: The email address to send emails from.
- `EMAIL_HOST`: The host of the email service.
- `EMAIL_PORT`: The port of the email service.
- `EMAIL_USER`: The username for the email service.
- `EMAIL_PASS`: The password for the email service.
- `EMAIL_SECURE`: Whether to use a secure connection for the email service.
- `EMAIL_RESET_PASSWORD_URL`: The URL for resetting passwords.

## Project Structure

```
.
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.ts
├── .env
├── .gitignore
├── bun.lockb
├── package.json
├── README.md
└── tsconfig.json
```
