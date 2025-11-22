import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  Home,
  Edit,
  Build,
  LibraryBooks,
  Settings,
  Logout,
  AccountCircle,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 280;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user, logout } = useAuth();

  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Editor', icon: <Edit />, path: '/editor' },
    { text: 'AI Proof Builder', icon: <Build />, path: '/proof-builder' },
    { text: 'Library', icon: <LibraryBooks />, path: '/library' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    onClose();
  };

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            {user?.username?.charAt(0).toUpperCase() || <AccountCircle />}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {user?.username || 'Guest'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || 'Not logged in'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ flex: 1, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '20',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main + '30',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    color: location.pathname === item.path
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Footer */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            '&:hover': {
              backgroundColor: theme.palette.error.main + '10',
            },
          }}
        >
          <ListItemIcon sx={{ color: theme.palette.error.main }}>
            <Logout />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            sx={{
              '& .MuiListItemText-primary': {
                color: theme.palette.error.main,
                fontWeight: 500,
              },
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
