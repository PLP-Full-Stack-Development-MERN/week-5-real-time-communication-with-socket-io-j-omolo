import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import {
  Box,
  Paper,
  TextField,
  Typography,
  Chip,
  Snackbar,
  Alert,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';

const SOCKET_URL = 'http://localhost:5000';

function NoteRoom() {
  const { roomId } = useParams();
  const [note, setNote] = useState('');
  const [socket, setSocket] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [isPrivateMessage, setIsPrivateMessage] = useState(false);
  const noteRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Get username from localStorage or prompt for it
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      const newUsername = prompt('Please enter your username:');
      if (newUsername) {
        setUsername(newUsername);
        localStorage.setItem('username', newUsername);
      }
    }

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Join room with username
    newSocket.emit('join-room', { roomId, username });

    // Fetch initial note content
    fetch(`http://localhost:5000/api/notes/${roomId}`)
      .then(res => res.json())
      .then(data => setNote(data.content || ''))
      .catch(err => console.error('Error fetching note:', err));

    // Fetch initial chat messages
    fetch(`http://localhost:5000/api/chat/${roomId}`)
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(err => console.error('Error fetching chat messages:', err));

    // Listen for note updates
    newSocket.on('note-updated', (data) => {
      setNote(data.content);
    });

    // Listen for user join notifications
    newSocket.on('user-joined', (data) => {
      setNotification({
        open: true,
        message: `${data.username} joined the room`,
        severity: 'info'
      });
    });

    // Listen for user leave notifications
    newSocket.on('user-left', (data) => {
      setNotification({
        open: true,
        message: `${data.username} left the room`,
        severity: 'info'
      });
    });

    // Listen for room users updates
    newSocket.on('room-users', (users) => {
      setOnlineUsers(users.filter(user => user.userId !== newSocket.id));
    });

    // Listen for new chat messages
    newSocket.on('new-chat-message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    return () => {
      newSocket.close();
    };
  }, [roomId, username]);

  const handleNoteChange = (e) => {
    const newContent = e.target.value;
    setNote(newContent);

    if (socket) {
      socket.emit('note-update', {
        roomId,
        content: newContent
      });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket && username) {
      socket.emit('chat-message', {
        roomId,
        userId: socket.id,
        username,
        message: newMessage.trim(),
        isPrivate: isPrivateMessage,
        recipientId: isPrivateMessage ? selectedUser : null
      });
      setNewMessage('');
      setIsPrivateMessage(false);
      setSelectedUser('');
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setNotification({
      open: true,
      message: 'Room ID copied to clipboard!',
      severity: 'success'
    });
  };

  const formatMessage = (msg) => {
    if (msg.isPrivate) {
      return `[Private to ${msg.recipientUsername}] ${msg.message}`;
    }
    return msg.message;
  };

  return (
    <Grid container spacing={2} sx={{ height: 'calc(100vh - 100px)' }}>
      <Grid item xs={12} md={8}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5">Room: {roomId}</Typography>
            <Chip
              icon={<ContentCopyIcon />}
              label="Copy Room ID"
              onClick={copyRoomId}
              color="primary"
              variant="outlined"
            />
          </Box>

          <Paper
            elevation={3}
            sx={{
              p: 2,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <TextField
              multiline
              fullWidth
              value={note}
              onChange={handleNoteChange}
              variant="outlined"
              placeholder="Start typing your note..."
              sx={{ flex: 1 }}
              inputRef={noteRef}
            />
          </Paper>
        </Box>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            Chat
          </Typography>
          
          {/* Online Users List */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Online Users
            </Typography>
            <List dense>
              {onlineUsers.map((user) => (
                <ListItem key={user.userId}>
                  <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                  <ListItemText primary={user.username} />
                  <Tooltip title="Send Private Message">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedUser(user.userId);
                        setIsPrivateMessage(true);
                      }}
                    >
                      <LockIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Chat Messages */}
          <List sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {messages.map((msg, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" color="primary">
                        {msg.username}
                        {msg.isPrivate && (
                          <Chip
                            size="small"
                            label="Private"
                            color="secondary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.primary">
                        {formatMessage(msg)}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </List>

          {/* Message Input */}
          <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            {isPrivateMessage && (
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Send to</InputLabel>
                <Select
                  value={selectedUser}
                  label="Send to"
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  {onlineUsers.map((user) => (
                    <MenuItem key={user.userId} value={user.userId}>
                      {user.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              fullWidth
              size="small"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isPrivateMessage ? "Type a private message..." : "Type a message..."}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant="contained"
                endIcon={<SendIcon />}
                type="submit"
                disabled={!newMessage.trim() || !username || (isPrivateMessage && !selectedUser)}
              >
                Send
              </Button>
              {isPrivateMessage && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsPrivateMessage(false);
                    setSelectedUser('');
                  }}
                >
                  Cancel
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Grid>

      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}

export default NoteRoom; 