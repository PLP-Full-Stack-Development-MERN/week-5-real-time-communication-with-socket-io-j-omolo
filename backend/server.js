const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/real-time-notes')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Note Schema
const noteSchema = new mongoose.Schema({
  roomId: String,
  content: String,
  lastEdited: { type: Date, default: Date.now }
});

// Chat Message Schema
const chatMessageSchema = new mongoose.Schema({
  roomId: String,
  userId: String,
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  isPrivate: { type: Boolean, default: false },
  recipientId: String,
  recipientUsername: String
});

const Note = mongoose.model('Note', noteSchema);
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

// Store online users
const onlineUsers = new Map();

// Socket.io Connection Handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Join a room
  socket.on('join-room', (data) => {
    const { roomId, username } = data;
    socket.join(roomId);
    
    // Store user info
    onlineUsers.set(socket.id, {
      username,
      roomId,
      socketId: socket.id
    });

    // Notify room about new user
    io.to(roomId).emit('user-joined', {
      userId: socket.id,
      username,
      timestamp: new Date()
    });

    // Send current online users to the new user
    const roomUsers = Array.from(onlineUsers.values())
      .filter(user => user.roomId === roomId)
      .map(user => ({
        userId: user.socketId,
        username: user.username
      }));
    socket.emit('room-users', roomUsers);
  });

  // Handle note updates
  socket.on('note-update', async (data) => {
    const { roomId, content } = data;
    
    try {
      await Note.findOneAndUpdate(
        { roomId },
        { content, lastEdited: new Date() },
        { upsert: true }
      );

      io.to(roomId).emit('note-updated', {
        content,
        lastEdited: new Date()
      });
    } catch (error) {
      console.error('Error updating note:', error);
      socket.emit('error', { message: 'Failed to update note' });
    }
  });

  // Handle chat messages
  socket.on('chat-message', async (data) => {
    const { roomId, userId, username, message, isPrivate, recipientId } = data;
    
    try {
      const newMessage = new ChatMessage({
        roomId,
        userId,
        username,
        message,
        timestamp: new Date(),
        isPrivate: isPrivate || false,
        recipientId: recipientId || null,
        recipientUsername: recipientId ? onlineUsers.get(recipientId)?.username : null
      });
      await newMessage.save();

      if (isPrivate && recipientId) {
        // Send private message only to sender and recipient
        socket.emit('new-chat-message', newMessage);
        io.to(recipientId).emit('new-chat-message', newMessage);
      } else {
        // Broadcast public message to all users in the room
        io.to(roomId).emit('new-chat-message', newMessage);
      }
    } catch (error) {
      console.error('Error saving chat message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      const { roomId, username } = user;
      onlineUsers.delete(socket.id);
      
      // Notify room about user leaving
      io.to(roomId).emit('user-left', {
        userId: socket.id,
        username,
        timestamp: new Date()
      });

      // Update room users list
      const roomUsers = Array.from(onlineUsers.values())
        .filter(user => user.roomId === roomId)
        .map(user => ({
          userId: user.socketId,
          username: user.username
        }));
      io.to(roomId).emit('room-users', roomUsers);
    }
    console.log('Client disconnected');
  });
});

// REST API Endpoints
app.get('/api/notes/:roomId', async (req, res) => {
  try {
    const note = await Note.findOne({ roomId: req.params.roomId });
    res.json(note || { content: '', lastEdited: new Date() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Get chat messages for a room
app.get('/api/chat/:roomId', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ 
      roomId: req.params.roomId,
      isPrivate: false 
    })
    .sort({ timestamp: 1 })
    .limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 