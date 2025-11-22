import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, AppBar, Toolbar, Typography, IconButton, Switch, FormControlLabel, useMediaQuery } from '@mui/material';
import { Brightness4, Brightness7, Menu as MenuIcon } from '@mui/icons-material';
import { createTheme as createMuiTheme } from '@mui/material/styles';

// Components
import Home from './pages/Home';
import Editor from './pages/Editor';
import ProofBuilder from './pages/ProofBuilder';
import Login from './pages/Login';
import Register from './pages/Register';
import Library from './pages/Library';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProofProvider } from './context/ProofContext';

// Theme configuration
const getTheme = (darkMode: boolean) => createMuiTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    primary: {
      main: darkMode ? '#90caf9' : '#1976d2',
    },
    secondary: {
      main: darkMode ? '#f48fb1' : '#dc004e',
    },
    background: {
      default: darkMode ? '#121212' : '#fafafa',
      paper: darkMode ? '#1e1e1e' : '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: darkMode 
            ? '0 4px 20px rgba(0,0,0,0.3)' 
            : '0 4px 20px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

// Main App Content
const AppContent: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Initialize theme based on user preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      setDarkMode(prefersDarkMode);
    }
  }, [prefersDarkMode]);

  const handleThemeToggle = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const theme = getTheme(darkMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          {/* App Bar */}
          <AppBar 
            position="fixed" 
            sx={{ 
              zIndex: theme.zIndex.drawer + 1,
              backdropFilter: 'blur(10px)',
              backgroundColor: darkMode ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)',
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  flexGrow: 1,
                  background: darkMode 
                    ? 'linear-gradient(45deg, #90caf9 30%, #f48fb1 90%)'
                    : 'linear-gradient(45deg, #1976d2 30%, #dc004e 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                }}
              >
                Proof Helper
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={darkMode}
                    onChange={handleThemeToggle}
                    icon={<Brightness7 />}
                    checkedIcon={<Brightness4 />}
                  />
                }
                label=""
              />
            </Toolbar>
          </AppBar>

          {/* Sidebar */}
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* Main Content */}
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              p: 3, 
              pt: 10,
              backgroundColor: theme.palette.background.default,
              minHeight: '100vh',
            }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/editor" 
                element={
                  <ProtectedRoute>
                    <Editor />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/proof-builder" 
                element={
                  <ProtectedRoute>
                    <ProofBuilder />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/library" 
                element={
                  <ProtectedRoute>
                    <Library />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <ProofProvider>
        <AppContent />
      </ProofProvider>
    </AuthProvider>
  );
};

export default App;
