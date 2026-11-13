# AI Learning Tutor

An AI-assisted learning app for working with study documents, flashcards, quizzes, and progress.

## Requirements

- Node.js and npm
- MongoDB
- A Gemini API key

## Setup

1. Configure the backend environment:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```

   Set your MongoDB connection string, a long random `JWT_SECRET`, and `GEMINI_API_KEY` in `backend/.env`.

2. Start the backend:

   ```powershell
   cd backend
   npm install
   npm run dev
   ```

3. In a separate terminal, start the frontend:

   ```powershell
   cd frontend/ai-learning-tutor
   npm install
   npm run dev
   ```

Uploaded documents, including user-provided files, and local environment files are intentionally excluded from version control.
