import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

// Create context
const AuthContext = createContext();

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAIL: 'LOGIN_FAIL',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAIL: 'REGISTER_FAIL',
  LOAD_USER: 'LOAD_USER',
  CLEAR_ERRORS: 'CLEAR_ERRORS'
};

// Initial state
const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  user: null,
  error: null
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        loading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        user: action.payload.user,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAIL:
    case AUTH_ACTIONS.REGISTER_FAIL:
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: null
      };

    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload
      };

    case AUTH_ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set auth token in axios headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Load user
  const loadUser = async () => {
    if (localStorage.token) {
      setAuthToken(localStorage.token);
      try {
        const res = await axios.get('/api/auth/me');
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER,
          payload: res.data.data
        });
      } catch (error) {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    } else {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Login user
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const res = await axios.post('/api/auth/login', {
        email,
        password
      });

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          token: res.data.data.token,
          user: res.data.data
        }
      });

      setAuthToken(res.data.data.token);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAIL,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register user
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const res = await axios.post('/api/auth/register', userData);

      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: {
          token: res.data.data.token,
          user: res.data.data
        }
      });

      setAuthToken(res.data.data.token);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAIL,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const logout = () => {
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    setAuthToken(null);
  };

  // Clear errors
  const clearErrors = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERRORS });
  };

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Set auth token when token changes
  useEffect(() => {
    setAuthToken(state.token);
  }, [state.token]);

  const value = {
    ...state,
    login,
    register,
    logout,
    clearErrors,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
