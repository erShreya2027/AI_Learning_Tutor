import React from 'react'
import { BrowserRouter as Router ,Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import NotFoundPage from './pages/NotFoundPage'
import DashBoardPage from './pages/Dashboard/DashBoardPage'
import DocumentsDetailsPage from './pages/Doccuments/DocumentsDetailsPage'
import DocumentsList from './pages/Doccuments/DocumentsList'
import FlashcardsList from './pages/Flashcards/FlashcardsList'
import FlashcardsPage from './pages/Flashcards/FlashcardsPage'
import QuizzesTakePage from './pages/Quizzes/QuizzesTakePage'
import QuizzesResultPage from './pages/Quizzes/QuizzesResultPage'
import QuizzesListPage from './pages/Quizzes/QuizzesListPage'
import ProfilePage from './pages/Profile/ProfilePage'
import ProtectedRoute from './components/auth/ProtectedRoutes'
import { useAuth } from './context/AuthContext'

const App = () => {
  const {isAuthenticated,loading}=useAuth()

  if(loading){
    return(
      <div className='flex items-center justify-center h-screen'>
        <p>Loading..</p>
      </div>
    );
  }
  return (
   <Router>
    <Routes>
      <Route
      path="/"
      element={isAuthenticated ? <Navigate to="/dashboard" replace/>: <Navigate to="/login" replace/>}
      />
      <Route path='/login'  element={isAuthenticated ? <Navigate to="/dashboard" replace/> : <LoginPage/>}/>
      <Route path='/register' element={isAuthenticated ? <Navigate to="/dashboard" replace/> : <RegisterPage/>}/>

      <Route element={<ProtectedRoute/>}>
      <Route path='/dashboard' element={<DashBoardPage/>}/>
      <Route path='/documents' element={<DocumentsList/>}/>
      <Route path='/documents/:id' element={<DocumentsDetailsPage/>}/>
      <Route path='/flashcards' element={<FlashcardsList/>}/>
      <Route path='/quizzes' element={<QuizzesListPage/>}/>
      <Route path='/documents/:id/flashcards' element={<FlashcardsPage/>}/>
      <Route path='/quizzes/:quizId' element={<QuizzesTakePage/>}/>
      <Route path='/quizzes/:quizId/results' element={<QuizzesResultPage/>}/>
      <Route path='/documents/:id/results' element={<QuizzesResultPage/>}/>
      <Route path='/profile' element={<ProfilePage/>}/>
      </Route>

      <Route path="/*" element={<NotFoundPage/>}/>
    </Routes>
   </Router>
  )
}

export default App