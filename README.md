# Real-Time Collaborative Notes

A real-time collaborative note-taking application built with the MERN stack and Socket.io.

## Features

- Real-time collaborative note editing
- Room-based collaboration
- User presence indicators
- Instant notifications for user join/leave events
- Persistent note storage

## Tech Stack

- Frontend: React.js
- Backend: Node.js, Express.js
- Database: MongoDB
- Real-time Communication: Socket.io

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd real-time-notes
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Create a `.env` file in the backend directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

## Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## Real-Time Concepts Used

- **WebSockets**: Implemented using Socket.io for real-time bidirectional communication
- **Rooms**: Used for isolating note collaboration spaces
- **Namespaces**: Implemented for organizing different types of real-time events
- **Event Emitters**: Used for broadcasting updates to connected clients
- **State Synchronization**: Real-time state updates across all connected clients

## Testing

1. Open multiple browser tabs
2. Navigate to the same room URL in different tabs
3. Edit notes in one tab and observe real-time updates in other tabs
4. Test user presence indicators by joining/leaving rooms

## Deployment

The application is deployed on:
- Backend: Render
- Frontend: Vercel

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 