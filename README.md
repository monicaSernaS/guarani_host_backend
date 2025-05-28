# 🏡 GuaraníHost – Backend

**GuaraníHost** is a RESTful API built with Node.js, Express, TypeScript and MongoDB. It powers the vacation rental platform by managing authentication, users, properties, bookings, tour packages, and payments.

[![Frontend Repo](https://img.shields.io/badge/🌐%20Frontend-GuaraníHost-blueviolet?style=for-the-badge)](https://github.com/ivanmartinezsanchez/guarani_host_frontend)

## 🚀 Features

- JWT authentication with role-based access (`admin`, `host`, `user`)
- Full CRUD for:
  - Users
  - Properties
  - Tour Packages
  - Bookings (properties and tours)
- Image uploads with Cloudinary (via Multer)
- Account management (`ACTIVE`, `SUSPENDED`, etc.)
- PDF and CSV exports
- Filters by role, status, and dates
- Email notifications (optional)
- Dockerized setup

## 🛠️ Tech Stack

- **Node.js** + **Express**
- **TypeScript**
- **MongoDB** with Mongoose
- **Docker** and Docker Compose
- **Cloudinary** for media
- **Jest** for testing
- **Swagger / Wager** for API documentation

## 📦 Installation

```bash
# 1. Clone the repository
git clone https://github.com/youruser/guaranihost.git
cd guaranihost/backend

# 2. Copy environment variables
cp .env.example .env

# 3. Build and run (Docker)
docker-compose up --build
```

## 📂 Project Structure

```
backend/
├── controllers/
├── models/
├── routes/
├── middlewares/
├── services/
├── utils/
└── app.ts
```
## 📄 API Documentation

Access Swagger or Wager documentation at:
```
http://localhost:5000/api/docs
```

## 🔐 Roles and Access

```
| Role  | Access                                         |
| ----- | ---------------------------------------------- |
| Admin | Full control (all users, properties, bookings) |
| Host  | Manage own properties, packages, and bookings  |
| User  | Book properties and tours, manage profile      |
```

## ✅ Testing

```
# Run unit tests
npm run test
```

## 🐳 Docker Commands

```
# Start all services
docker-compose up

# Stop all services
docker-compose down
```

## 📬 Contact

Created by 
[![Iván Martínez - LinkedIn](https://img.shields.io/badge/Iván%20Martínez-LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/iv%C3%A1n-mart%C3%ADnez-s%C3%A1nchez/)
&  [![Mónica Serna - LinkedIn](https://img.shields.io/badge/Mónica%20Serna-LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/monicasernasantander/)




