import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

import Home from './Pages/Home'
import Result from './Pages/Result'
import BuyCredit from './Pages/BuyCredit'
import Navbar from './Components/Navbar'
import Stylebar from './Components/Stylebar'
import Footer from './Components/Footer'
import Login from './Components/Login'
import Trends from './Pages/Trends';
import { AppContext } from './Context/AppContext'

// PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const { user } = useContext(AppContext); // Assuming user is stored in context
  return user ? children : <Navigate to="/" />;
};

const App = () => {
  const { showLogin } = useContext(AppContext)

  return (
    <div className='px-4 sm:px-10 md:px-14 lg:px-28 min-h-screen bg-gradient-to-b from-teal-50 to-orange-50'>
      <ToastContainer position='bottom-right'/>
      <Navbar/>
      <Stylebar /> 
      {showLogin && <Login/>}
      
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/buy' element={<BuyCredit/>}/>
        {/* Protect the /result route */}
        <Route path='/result' element={<PrivateRoute><Result/></PrivateRoute>}/>
        <Route path='/trends' element={<Trends/>}/>
      </Routes>

      <Footer/>
    </div>
  )
}

export default App
