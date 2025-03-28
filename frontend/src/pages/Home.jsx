import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

function Home() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const createNewRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8);
    navigate(`/room/${newRoomId}`);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/room/${roomId.trim()}`);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Welcome to Real-Time Notes
        </Typography>
        <Typography variant="body1" paragraph align="center" color="text.secondary">
          Create a new room or join an existing one to start collaborating
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<AddIcon />}
            onClick={createNewRoom}
            sx={{ mb: 3 }}
          >
            Create New Room
          </Button>

          <form onSubmit={joinRoom}>
            <TextField
              fullWidth
              label="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              margin="normal"
              variant="outlined"
              placeholder="Enter 6-character room ID"
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="outlined"
              fullWidth
              disabled={!roomId.trim()}
            >
              Join Room
            </Button>
          </form>
        </Box>
      </Paper>
    </Container>
  );
}

export default Home; 