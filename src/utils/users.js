const users = [];

// Add a new user to the users array
const addUser = ({ id, username, room }) => {
  // Clean the data: remove extra spaces and convert to lowercase
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  // Validate that both username and room are provided
  if (!username || !room) {
    return {
      error: "Username and room are required!",
    };
  }

  // Check if a user with the same username already exists in the same room
  const existingUser = users.find((user) => {
    return user.room === room && user.username === username;
  });

  // If user already exists in the room, return an error
  if (existingUser) {
    return {
      error: "Username is in use",
    };
  }

  // Create new user and add to users array
  const user = { id, username, room };
  users.push(user);
  return { user };
};

// Remove a user from the users array based on socket ID
const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    // Remove the user and return the removed object
    return users.splice(index, 1)[0];
  }
};

// Get a single user by their socket ID
const getUser = (id) => {
  return users.find((user) => user.id === id);
};

// Get all users in a specific room
const getUsersInRoom = (room) => {
  return users.filter((user) => user.room === room);
};

// Export all user-related functions
module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
};
