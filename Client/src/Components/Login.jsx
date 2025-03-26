import React, { useContext, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';

import { AppContext } from '../Context/AppContext';
import { assets } from '../assets/assets';

const Login = () => {
  const { setShowLogin, backendUrl, setToken, setUser } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Possible states: 'Login', 'Sign Up', 'Resend', 'Verified'
  const [state, setState] = useState('Login');

  // Form data states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Error message states
  const [emailError, setEmailError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]); // Array for multiple password errors

  // Resend verification states
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const isResending = useRef(false); // Prevent multiple resend requests
  const timerRef = useRef(null); // Prevent multiple timers

  // Loading states for better UX
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendingState, setIsResendingState] = useState(false);

  const trustedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'example.in'];

  // Check query parameter for verification status
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      setState('Verified');
    }
  }, [location.search]);

  // Handle verified state: show modal and auto-close after 10 seconds
  useEffect(() => {
    if (state === 'Verified') {
      toast.success('Your email has been verified. This tab will close automatically in 10 seconds.');
      const timer = setTimeout(() => {
        window.close();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  // Prevent background scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Email change handler with domain validation
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    const domain = value.split('@')[1];
    if (domain && !trustedDomains.includes(domain)) {
      setEmailError('Please use an email from a trusted provider (e.g., Gmail, Yahoo).');
    } else {
      setEmailError('');
    }
  };

  // Password change handler with comprehensive validation
  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    const errors = [];
    if (val.length < 6) errors.push('Password must be at least 6 characters.');
    if (!/[A-Z]/.test(val)) errors.push('Password must contain uppercase letters.');
    if (!/[a-z]/.test(val)) errors.push('Password must contain lowercase letters.');
    if (!/[0-9]/.test(val)) errors.push('Password must contain numbers.');
    if (!/[!@#$%^&*]/.test(val)) errors.push('Password must contain symbols (e.g., !@#$%^&*).');
    if (name && val.toLowerCase().includes(name.toLowerCase())) {
      errors.push('Password must not contain your name.');
    }
    setPasswordErrors(errors);
  };

  // Form submit handler for Login and Sign Up
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true);
    try {
      if (state === 'Login') {
        const { data } = await axios.post(`${backendUrl}/api/user/login`, { email, password });
        if (data.success) {
          setToken(data.token);
          setUser(data.user);
          localStorage.setItem('token', data.token);
          setShowLogin(false);
          toast.success('Logged in successfully!');
          navigate('/', { replace: true });
        } else {
          toast.error(data.message);
          if (data.message === 'Please verify your email first') {
            setState('Resend');
          }
        }
      } else if (state === 'Sign Up') {
        const { data } = await axios.post(`${backendUrl}/api/user/register`, { name, email, password });
        if (data.success) {
          setShowLogin(false);
          toast.success(data.message);
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || 'An unexpected error occurred.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend verification handler with timer lock
  const resendVerification = async () => {
    if (isResending.current || resendDisabled) return;
    isResending.current = true;
    setIsResendingState(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/resend-verification`, { email });
      if (data.success) {
        toast.success(data.message);
        setResendDisabled(true);
        setCountdown(60);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || 'Failed to resend verification email.'
      );
    } finally {
      isResending.current = false;
      setIsResendingState(false);
    }
  };

  // Manage countdown timer
  useEffect(() => {
    if (resendDisabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            setResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [resendDisabled]);

  // Render Verified state modal
  if (state === 'Verified') {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 z-50 backdrop-blur-sm bg-black/30 flex justify-center items-center">
        <div className="bg-white p-10 rounded-xl text-center">
          <h2 className="text-2xl font-medium text-neutral-700">Email Verified</h2>
          <p className="mt-4 text-slate-500">
            Your email has been verified. This tab will close automatically in 10 seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-50 backdrop-blur-sm bg-black/30 flex justify-center items-center">
      <motion.form
        onSubmit={onSubmitHandler}
        initial={{ opacity: 0.2, y: 50 }}
        transition={{ duration: 0.3 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative bg-white p-10 rounded-xl text-slate-500"
      >
        <h1 className="text-center text-2xl text-neutral-700 font-medium">
          {state === 'Resend' ? 'Verify Your Email' : state}
        </h1>
        {state === 'Login' && <p className="text-sm">Welcome back! Please sign in to continue.</p>}
        {state === 'Sign Up' && <p className="text-sm">Create your Remage account.</p>}
        {state === 'Resend' && (
          <p className="text-sm text-center">
            Please verify your email to log in. Check your inbox or resend the verification email.
          </p>
        )}

        {/* Name Field (only for Sign Up) */}
        {state === 'Sign Up' && (
          <div className="border px-6 py-2 flex items-center gap-2 rounded-full mt-4">
            <img src={assets.user_icon} alt="User icon" />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="outline-none text-sm w-full"
              required
            />
          </div>
        )}

        {/* Email and Password Fields (for Login and Sign Up) */}
        {state !== 'Resend' && (
          <>
            <div className="border px-6 py-2 flex items-center gap-2 rounded-full mt-5">
              <img src={assets.email_icon} alt="Email icon" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={email}
                onChange={handleEmailChange}
                className="outline-none text-sm w-full"
                required
              />
            </div>
            {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}

            <div className="border px-6 py-2 flex items-center gap-2 rounded-full mt-5">
              <img src={assets.lock_icon} alt="Password icon" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
                className="outline-none text-sm w-full"
                required
              />
            </div>
            {passwordErrors.length > 0 && (
              <ul className="text-red-500 text-sm mt-1">
                {passwordErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* Resend Verification Section */}
        {state === 'Resend' && (
          <div className="mt-5">
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              className="border px-6 py-2 rounded-full w-full outline-none text-sm"
              required
            />
            <button
              type="button"
              onClick={resendVerification}
              disabled={resendDisabled || isResendingState}
              className={`mt-4 bg-blue-600 w-full text-white py-2 rounded-full ${
                resendDisabled || isResendingState ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isResendingState ? 'Resending...' : resendDisabled ? `Resend in ${countdown}s` : 'Resend Verification Email'}
            </button>
          </div>
        )}

        {/* Submit Button */}
        {state !== 'Resend' && (
          <button
            type="submit"
            disabled={
              isSubmitting ||
              emailError ||
              passwordErrors.length > 0 ||
              !email ||
              !password ||
              (state === 'Sign Up' && !name)
            }
            className="mt-6 bg-blue-600 w-full text-white py-2 rounded-full disabled:bg-gray-400"
          >
            {isSubmitting ? 'Submitting...' : state === 'Login' ? 'Sign In' : 'Create Account'}
          </button>
        )}

        {/* Toggle Links */}
        {state === 'Login' && (
          <p className="mt-5 text-center">
            Don’t have an account?{' '}
            <span className="text-blue-600 cursor-pointer" onClick={() => setState('Sign Up')}>
              Sign up
            </span>
          </p>
        )}
        {state === 'Sign Up' && (
          <p className="mt-5 text-center">
            Already have an account?{' '}
            <span className="text-blue-600 cursor-pointer" onClick={() => setState('Login')}>
              Login
            </span>
          </p>
        )}
        {state === 'Resend' && (
          <p className="mt-5 text-center">
            Back to login?{' '}
            <span className="text-blue-600 cursor-pointer" onClick={() => setState('Login')}>
              Sign in
            </span>
          </p>
        )}

        {/* Close Icon */}
        <img
          onClick={() => setShowLogin(false)}
          src={assets.cross_icon}
          alt="Close icon"
          className="absolute top-5 right-5 cursor-pointer"
        />
      </motion.form>
    </div>
  );
};

export default Login;