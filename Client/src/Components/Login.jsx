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

  const [state, setState] = useState('Login');
  const [signUpStep, setSignUpStep] = useState('sendCode');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);

  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const isResending = useRef(false);
  const timerRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendingState, setIsResendingState] = useState(false);

  const trustedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'example.in'];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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

  const loginSubmitHandler = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
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
          setState('Verify'); // Changed from 'Resend' to 'Verify'
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendCodeHandler = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/register`, { name, email, password });
      if (data.success && data.message.toLowerCase().includes('verification code sent')) {
        toast.success(data.message);
        setSignUpStep('createAccount');
        setResendDisabled(true);
        setCountdown(60);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const createAccountHandler = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/register`, { name, email, password, code });
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        setShowLogin(false);
        toast.success('Account created and verified. Logged in successfully!');
        navigate('/', { replace: true });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        toast.error('Wrong Verification Code');
      } else {
        toast.error(error.response?.data?.message || error.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // New handler for verifying and logging in from the "Verify" state
  const verifyAndLoginHandler = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/register`, { email, password, code });
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        setShowLogin(false);
        toast.success('Account verified and logged in successfully!');
        navigate('/', { replace: true });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      toast.error(error.response?.data?.message || error.message || 'Failed to resend verification email.');
    } finally {
      isResending.current = false;
      setIsResendingState(false);
    }
  };

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

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-50 backdrop-blur-sm bg-black/30 flex justify-center items-center">
      <motion.form
        onSubmit={state === 'Login' ? loginSubmitHandler : (signUpStep === 'sendCode' ? sendCodeHandler : createAccountHandler)}
        initial={{ opacity: 0.2, y: 50 }}
        transition={{ duration: 0.3 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative bg-white p-10 rounded-xl text-slate-500"
      >
        <h1 className="text-center text-2xl text-neutral-700 font-medium">
          {state === 'Verify' ? 'Verify Your Email' : state}
        </h1>

        {state === 'Login' && <p className="text-sm">Welcome back! Please sign in to continue.</p>}
        {state === 'Sign Up' && <p className="text-sm">Create your Krutishu account.</p>}
        {state === 'Verify' && (
          <p className="text-sm text-center">
            Please verify your email to log in. Enter the verification code sent to your email.
          </p>
        )}

        {/* Name Field (for Sign Up) */}
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
        {(state === 'Login' || state === 'Sign Up') && (
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

        {/* Code Field (for Sign Up and Verify) */}
        {(state === 'Sign Up' && signUpStep === 'createAccount') || state === 'Verify' ? (
          <div className="border px-6 py-2 flex items-center gap-2 rounded-full mt-5">
            <img src={assets.code_icon || 'https://via.placeholder.com/20'} alt="Code icon" />
            <input
              type="text"
              name="code"
              placeholder="Enter Verification Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="outline-none text-sm w-full"
              required
            />
          </div>
        ) : null}

        {/* Verify State UI */}
        {state === 'Verify' && (
          <>
            <div className="border px-6 py-2 flex items-center gap-2 rounded-full mt-5">
              <img src={assets.email_icon} alt="Email icon" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={email}
                className="outline-none text-sm w-full bg-gray-100"
                disabled
              />
            </div>
            <button
              type="button"
              onClick={verifyAndLoginHandler}
              disabled={isSubmitting || !code}
              className="mt-6 bg-blue-600 w-full text-white py-2 rounded-full disabled:bg-gray-400"
            >
              {isSubmitting ? 'Verifying...' : 'Verify and Log In'}
            </button>
            <button
              type="button"
              onClick={resendVerification}
              disabled={resendDisabled || isResendingState}
              className={`mt-4 bg-green-600 w-full text-white py-2 rounded-full ${resendDisabled || isResendingState ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isResendingState ? 'Resending...' : resendDisabled ? `Resend in ${countdown}s` : 'Resend Verification Email'}
            </button>
          </>
        )}

        {/* Buttons for Sign Up flow */}
        {state === 'Sign Up' && (
          <div className="mt-6 space-y-4">
            {signUpStep === 'sendCode' && (
              <button
                type="button"
                onClick={sendCodeHandler}
                disabled={isSubmitting || !name || !email || !password || emailError || passwordErrors.length > 0}
                className="bg-blue-600 w-full text-white py-2 rounded-full disabled:bg-gray-400"
              >
                {isSubmitting ? 'Sending...' : 'Send Code'}
              </button>
            )}
            {signUpStep === 'createAccount' && (
              <>
                <button
                  type="button"
                  onClick={createAccountHandler}
                  disabled={isSubmitting || !code}
                  className="bg-blue-600 w-full text-white py-2 rounded-full disabled:bg-gray-400"
                >
                  {isSubmitting ? 'Submitting...' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={resendDisabled || isResendingState}
                  className={`bg-green-600 w-full text-white py-2 rounded-full ${resendDisabled || isResendingState ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isResendingState ? 'Resending...' : resendDisabled ? `Resend in ${countdown}s` : 'Resend Code'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Submit button for Login */}
        {state === 'Login' && (
          <button
            type="submit"
            disabled={isSubmitting || emailError || passwordErrors.length > 0 || !email || !password}
            className="mt-6 bg-blue-600 w-full text-white py-2 rounded-full disabled:bg-gray-400"
          >
            {isSubmitting ? 'Submitting...' : 'Sign In'}
          </button>
        )}

        {/* Toggle Links */}
        {state === 'Login' && (
          <p className="mt-5 text-center">
            Don’t have an account?{' '}
            <span className="text-blue-600 cursor-pointer" onClick={() => { setState('Sign Up'); setSignUpStep('sendCode'); }}>
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
        {state === 'Verify' && (
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
