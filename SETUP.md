# Quick Setup Guide

## Prerequisites
- Node.js v18 or higher
- MongoDB installed and running

## Installation Steps

### 1. Navigate to Project
```bash
cd care-vault
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file with your settings
# Required: MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET
```

### 3. Frontend Setup

```bash
# Navigate to frontend (from project root)
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env if needed (optional - defaults work)
```

### 4. Start MongoDB

Make sure MongoDB is running:
```bash
mongod
```

Or if using MongoDB as a service:
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### 5. Start Development Servers

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on: http://localhost:5173

### 6. Verify Installation

Open your browser and visit:
- Frontend: http://localhost:5173
- Backend Health: http://localhost:5000/health

You should see the login page!

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/carequeue
JWT_SECRET=your-secret-key-here-change-this
JWT_REFRESH_SECRET=your-refresh-secret-here
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod --version`
- Check connection string in backend/.env
- Try: `mongodb://127.0.0.1:27017/carequeue`

### Port Already in Use
- Backend (5000): Change PORT in backend/.env
- Frontend (5173): Change port in frontend/vite.config.js

### Module Not Found
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### CORS Issues
- Check FRONTEND_URL in backend/.env matches your frontend URL
- Restart backend server after changing .env

## Next Steps

Now that your project is set up, you can:

1. **View the Login Page** at http://localhost:5173/login
2. **Test API** by visiting http://localhost:5000/health
3. **Start Development**:
   - Implement authentication logic
   - Create database models
   - Build UI components
   - Connect frontend to backend APIs

## Available Scripts

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
care-vault/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── server.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   └── package.json
│
└── frontend/         # React + Vite
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   ├── pages/
    │   ├── store/
    │   └── services/
    └── package.json
```

## Need Help?

Check these files for more information:
- `README.md` - Project overview
- `PROJECT_STRUCTURE.md` - Detailed structure documentation
- Backend routes: `backend/src/routes/`
- Frontend pages: `frontend/src/pages/`

Happy coding! 🚀
