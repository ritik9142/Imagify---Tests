import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

import Home from './Pages/Home'
import Result from './Pages/Result'
import BuyCredit from './Pages/BuyCredit'
import Navbar from './Components/Navbar'

import Footer from './Components/Footer'
import Login from './Components/Login'

import { AppContext } from './Context/AppContext'

// PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const { user, setShowLogin } = useContext(AppContext);
  if (!user) {
    setShowLogin(true); // Trigger login modal
    return <Navigate to="/" />;
  }
  return children;
};

// NotFound component for unmatched routes
const NotFound = () => (
  <div className="text-center py-10">
    <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
    <p className="text-lg">The page you're looking for doesn't exist.</p>
    <a href="/" className="text-blue-500 underline">Go to Home</a>
  </div>
);

const App = () => {
  const { showLogin } = useContext(AppContext)

  return (
    <div className='px-4 sm:px-10 md:px-14 lg:px-28 min-h-screen bg-gradient-to-b from-teal-50 to-orange-50'>
      <ToastContainer position='bottom-right'/>
      <Navbar/>
      
      {showLogin && <Login/>}
      
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/buy' element={<BuyCredit/>}/>
        {/* Protect the /result route */}
        <Route path='/result' element={<PrivateRoute><Result/></PrivateRoute>}/>
        
      </Routes>

      <Footer/>
    </div>
  )
}

export default App
