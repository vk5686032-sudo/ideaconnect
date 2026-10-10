// `npm start` is the production entrypoint, but NODE_ENV lived in .env as
// NODE_ENV=development -- and dotenv never overrides a real environment variable, so
// "production" ran in development mode and every error response carried a stack trace
// with absolute server paths. Mode belongs to the script that chooses the mode, not to
// the secret file. Two lines instead of pulling in cross-env.
process.env.NODE_ENV = 'production';
require('../src/server');
