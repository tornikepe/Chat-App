const socket = io();

// Elements from the DOM
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// HTML templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Parse username and room from the URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// Automatically scroll to the bottom if the user is viewing the newest messages
const autoscroll = () => {
  // Select the last message
  const $newMessage = $messages.lastElementChild;

  // Get the height of the new message (including margin)
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height of the messages container
  const visibleHeight = $messages.offsetHeight;

  // Total height of messages content
  const containerHeight = $messages.scrollHeight;

  // How far user has scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;

  // If the user is close to the bottom, auto-scroll
  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

// Listen for text messages from the server
socket.on("message", (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

// Listen for location messages from the server
socket.on("locationMessage", (message) => {
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

// Listen for updates to the room's user list
socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});

// Message form submit handler
$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Disable the send button
  $messageFormButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.message.value;

  // Emit the message to the server
  socket.emit("sendMessage", message, (error) => {
    // Re-enable the send button and clear input
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }

    console.log("Message delivered!");
  });
});

// Location sharing button handler
$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser.");
  }

  // Disable the location button while location is being sent
  $sendLocationButton.setAttribute("disabled", "disabled");

  // Get the current position
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        // Re-enable the location button
        $sendLocationButton.removeAttribute("disabled");
        console.log("Location shared!");
      }
    );
  });
});

// Emit 'join' event to join a chat room
socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
