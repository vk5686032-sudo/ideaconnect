// Where the app sends API and websocket traffic.
//
// The rule is that an empty or absent setting means *same origin*, not
// localhost. That distinction matters: the Docker image and CI both build with
// VITE_SOCKET_URL="" and put nginx in front, proxying /api and /socket.io to
// the backend. The previous code was
//
//   import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
//
// and because "" is falsy the || replaced it, so every deployed visitor's
// browser tried to open a websocket to port 5000 on *their own machine*.
// Websockets were silently broken in the deployed build while the compose
// comment claimed the opposite. socket.io-client treats `undefined` as
// "connect to the page origin", which is what those deployments need.

export const resolveApiUrl = (raw) => {
  const value = (raw ?? '').trim();
  // A relative baseURL works fine on axios, and keeps dev identical to prod.
  return value === '' ? '/api/v1' : value;
};

export const resolveSocketUrl = (raw) => {
  const value = (raw ?? '').trim();
  // undefined is meaningful to socket.io-client: connect to the current origin.
  return value === '' ? undefined : value;
};
