import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NoteIcon from '@mui/icons-material/Note';

function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <NoteIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Real-Time Notes
        </Typography>
        <Box>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
          >
            Home
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 