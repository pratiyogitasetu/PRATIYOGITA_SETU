import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, Paper } from '@mui/material';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthErrors';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError('Failed to sign in: ' + err.message);
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError('Failed to sign in with Google: ' + getFirebaseAuthErrorMessage(err));
    }
    setLoading(false);
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#2b1e17' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, bgcolor: '#3d2419', color: '#FBF6EE' }}>
        <Typography variant="h4" mb={3} textAlign="center" color="#E4572E">Log In</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField 
            fullWidth label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            required sx={{ mb: 2, '& .MuiInputBase-input': { color: '#FBF6EE' }, '& .MuiInputLabel-root': { color: 'rgba(232,216,195,0.7)' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(228,87,46,0.4)' }, '&:hover fieldset': { borderColor: '#E4572E' }, '&.Mui-focused fieldset': { borderColor: '#E4572E' } } }} 
          />
          <TextField 
            fullWidth label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
            required sx={{ mb: 3, '& .MuiInputBase-input': { color: '#FBF6EE' }, '& .MuiInputLabel-root': { color: 'rgba(232,216,195,0.7)' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(228,87,46,0.4)' }, '&:hover fieldset': { borderColor: '#E4572E' }, '&.Mui-focused fieldset': { borderColor: '#E4572E' } } }} 
          />
          <Button disabled={loading} type="submit" fullWidth variant="contained" sx={{ bgcolor: '#E4572E', '&:hover': { bgcolor: '#c9421e' }, mb: 2 }}>
            Log In
          </Button>
          <Button disabled={loading} onClick={handleGoogleLogin} fullWidth variant="outlined" sx={{ color: '#E4572E', borderColor: '#E4572E', '&:hover': { borderColor: '#c9421e' } }}>
            Log In with Google
          </Button>
        </form>
        <Typography mt={2} textAlign="center" sx={{ color: 'rgba(232,216,195,0.7)' }}>
          Need an account? <Link to="/signup" style={{ color: '#E4572E', textDecoration: 'none', fontWeight: 'bold' }}>Sign Up</Link>
        </Typography>
      </Paper>
    </Box>
  );
}