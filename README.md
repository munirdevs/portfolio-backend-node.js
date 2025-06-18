# Portfolio & CMS Backend API

This is the secure backend API for a full-stack personal portfolio project. It is built with Node.js, Express, and MongoDB and provides all necessary endpoints to power both the public-facing portfolio website and a private, secure Content Management System (CMS).

The API handles content for projects, work experience, blog posts (engineering logs), and more. It features a role-based authentication system using JSON Web Tokens (JWT) to protect the administrative routes.

## Key Features

- **Secure Authentication:** JWT-based authentication to protect administrative routes.
- **Role-Based Access Control:** Differentiates between public users, "Editor" roles, and "Administrator" roles.
- **RESTful Architecture:** A clean and predictable API structure for all resources.
- **Full CRUD Functionality:** Create, Read, Update, and Delete operations for all content types.
- **Separate Public & Admin Routes:** Serves only "published" content to the public portfolio while providing full access to the CMS.
- **Singleton Document Management:** Manages single-instance content like "Personal Info" and "Skills" sections.

## Technologies Used

- **Node.js:** JavaScript runtime environment.
- **Express.js:** Web framework for Node.js.
- **MongoDB:** NoSQL database for storing all application data.
- **Mongoose:** Object Data Modeling (ODM) library for MongoDB and Node.js.
- **JSON Web Tokens (JWT):** For securing API endpoints.
- **bcrypt.js:** For hashing user passwords.
- **CORS:** To handle Cross-Origin Resource Sharing.
- **dotenv:** For managing environment variables.

---

## API Endpoints

The base URL for all endpoints is `/api`.

### Authentication

| Method | Endpoint      | Description                              |
| ------ | ------------- | ---------------------------------------- |
| `POST` | `/auth/login` | Authenticates a user and returns a JWT. |

### Public Routes (for Portfolio)

These endpoints are publicly accessible and return only documents where `published` is `true`.

| Method | Endpoint              | Description                                    |
| ------ | --------------------- | ---------------------------------------------- |
| `GET`  | `/projects`           | Get all published projects.                    |
| `GET`  | `/experience`         | Get all published work experiences.            |
| `GET`  | `/expertise`          | Get all published areas of expertise.          |
| `GET`  | `/logs`               | Get all published engineering logs.            |
| `GET`  | `/personal-info`      | Get the main personal information document.    |
| `GET`  | `/skills`             | Get the list of skills.                        |
| `GET`  | `/sections/:sectionId`| Get data for a single section (e.g., 'resume').|

### Admin & CMS Routes (Protected)

These endpoints require a valid JWT.

| Method   | Endpoint                  | Description                               | Role Required   |
| -------- | ------------------------- | ----------------------------------------- | --------------- |
| `GET`    | `/projects/all`           | Get **all** projects (published and drafts). | Editor          |
| `POST`   | `/projects`               | Create a new project.                     | Editor          |
| `PUT`    | `/projects/:id`           | Update an existing project.               | Editor          |
| `DELETE` | `/projects/:id`           | Delete a project.                         | Administrator   |
| `GET`    | `/experience/all`         | Get **all** work experiences.             | Editor          |
| `POST`   | `/experience`             | Create a new experience entry.            | Editor          |
| `PUT`    | `/experience/:id`         | Update an experience entry.               | Editor          |
| `DELETE` | `/experience/:id`         | Delete an experience entry.               | Administrator   |
| `GET`    | `/expertise/all`          | Get **all** expertise entries.            | Editor          |
| `POST`   | `/expertise`              | Create a new expertise entry.             | Editor          |
| `PUT`    | `/expertise/:id`          | Update an expertise entry.                | Editor          |
| `DELETE` | `/expertise/:id`          | Delete an expertise entry.                | Administrator   |
| `GET`    | `/logs/all`               | Get **all** engineering logs.             | Editor          |
| `POST`   | `/logs`                   | Create a new log entry.                   | Editor          |
| `PUT`    | `/logs/:id`               | Update a log entry.                       | Editor          |
| `DELETE` | `/logs/:id`               | Delete a log entry.                       | Administrator   |
| `GET`    | `/users`                  | Get a list of all users.                  | Administrator   |
| `POST`   | `/users`                  | Create a new user.                        | Administrator   |
| `PUT`    | `/users/:id`              | Update a user.                            | Administrator   |
| `DELETE` | `/users/:id`              | Delete a user.                            | Administrator   |
| `PUT`    | `/personal-info`          | Update the personal information document. | Editor          |
| `PUT`    | `/skills`                 | Update the skills document.               | Editor          |
| `PUT`    | `/sections/:sectionId`    | Update a single section document.         | Editor          |

---

## Local Setup & Installation

Follow these steps to run the backend server locally for development.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally, or a connection string from MongoDB Atlas.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <your-repository-folder>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

Create a `.env` file in the root of your backend project directory and add the following variables.

```env
# The connection string for your MongoDB database
# For local MongoDB: mongodb://127.0.0.1:27017/portfolioDB
# For Atlas: mongodb+srv://<user>:<password>@cluster...
MONGO_URI="your_mongodb_connection_string"

# A long, random, and secret string used to sign JWTs
JWT_SECRET="your_super_secret_jwt_string"
```

**Important:** Do not commit the `.env` file to your repository. It should be listed in your `.gitignore` file.

### 4. Run the Server

The server will start, connect to the database, and seed it with initial data if it's empty.

```bash
npm start
```

The API will be running at `http://localhost:5000`.

## Deployment

This API is designed to be deployed as a "Web Service" on a platform like **Render** or **Heroku**.

- **Build Command:** `npm install`
- **Start Command:** `node server.js`

Remember to set the `MONGO_URI` and `JWT_SECRET` as environment variables in your hosting provider's dashboard.

