import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Divider,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Google, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'framer-motion';
import { IconButton, InputAdornment } from '@mui/material';
import { useErrorHandler } from '../utils/errorHandler';
import ErrorAlert from '../components/ErrorAlert';

const Login = () => {
  const [email, setEmail] = useState('demo@finsight.ai');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const { login, resetPassword } = useAuth();
  // Google login handler
  const handleGoogleLogin = async () => {
    setLoading(true);
    clearError();
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handler
  const handleForgotPassword = async () => {
    setResetLoading(true);
    setResetSuccess('');
    clearError();
    try {
      await resetPassword(resetEmail || email);
      setResetSuccess('Password reset email sent! Check your inbox.');
    } catch (error) {
      handleError(error);
    } finally {
      setResetLoading(false);
    }
  };
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={8}
            sx={{
              p: { xs: 3, sm: 4 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(25,118,210,0.05) 0%, rgba(66,165,245,0.05) 100%)',
            }}
          >
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Box
                component="img"
                src="/logo.png"
                alt="FinSight AI Logo"
                sx={{
                  width: isMobile ? '120px' : '150px',
                  height: 'auto',
                  mb: 2
                }}
              />
              <Typography
                component="h1"
                variant={isMobile ? "h4" : "h3"}
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                FinSight AI
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Insight to foresight, In real-time
              </Typography>
            </Box>            
            <ErrorAlert error={error} />

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
                sx={{ mb: 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>


              <Button
                fullWidth
                variant="outlined"
                size="large"
                sx={{ mb: 2, py: 1.5, borderRadius: 2 }}
                onClick={() => setResetEmail(email)}
              >
                Forgot Password?
              </Button>

              {resetEmail && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Enter your email to reset password"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                  >
                    {resetLoading ? <CircularProgress size={20} color="inherit" /> : 'Send Reset Email'}
                  </Button>
                  {resetSuccess && (
                    <Alert severity="success" sx={{ mt: 1 }}>{resetSuccess}</Alert>
                  )}
                </Box>
              )}

              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  or
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<Google />}
                sx={{ mb: 3, py: 1.5, borderRadius: 2 }}
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign in with Google'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    style={{ 
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Sign up
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Box>
    </Container>
  );
};

export default Login;
