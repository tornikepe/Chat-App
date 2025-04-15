// Generate a standard text message object
const generateMessage = (username, text) => {
  return {
    username, // Sender's username
    text, // Message content
    createdAt: new Date().getTime(), // Timestamp of when the message was created
  };
};

// Generate a location message object with a map URL
const generateLocationMessage = (username, url) => {
  return {
    username, // Sender's username
    url, // Google Maps link with coordinates
    createdAt: new Date().getTime(), // Timestamp of when the location was shared
  };
};

// Export both message-generating functions
module.exports = {
  generateMessage,
  generateLocationMessage,
};
