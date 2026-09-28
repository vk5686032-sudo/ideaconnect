const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/env');
const errorHandler = require('./middlewares/errorHandler');
const { shouldSkipLimiting } = require('./utils/ip');
const openapiSpec = require('./docs/swagger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const ideaRoutes = require('./routes/idea.routes');
const projectRoutes = require('./routes/project.routes');
const chatRoutes = require('./routes/chat.routes');
const aiRoutes = require('./routes/ai.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');
const taskRoutes = require('./routes/task.routes');
const mentorRoutes = require('./routes/mentor.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();

// Behind the compose nginx (or any reverse proxy) every request otherwise
// arrives with the *proxy's* address as req.ip, so the private-IP skip below
// swallowed every request and rate limiting was effectively off in the
// documented deployment. `1` means "trust exactly one hop".
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS
const getAllowedOrigins = () => {
  const configuredOrigins = (config.frontendUrl || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return [
    ...configuredOrigins,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    // Expo web (`npm run web` in mobile/) serves from 8081, not 5173.
    'http://localhost:8081',
    'http://127.0.0.1:8081',
  ];
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const allowedOrigins = getAllowedOrigins();
      const isAllowed = allowedOrigins.includes(origin);
      callback(null, isAllowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting — generous default (600/15min) since a single page load fires
// several API calls and notifications poll periodically. Override via
// RATE_LIMIT_MAX env var. Credential endpoints get a tighter bucket of their
// own, in routes/auth.routes.js.
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  skip: shouldSkipLimiting(config.nodeEnv),
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Static files
// nosniff + attachment: even if something active ever lands here, the browser
// downloads it instead of rendering it in our origin. The allow-list in
// middlewares/upload.js is the real gate; this is the backstop.
app.use(
  '/uploads',
  express.static('src/uploads', {
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'attachment');
    },
  })
);

// API Routes — single versioned router
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/ideas', ideaRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/chats', chatRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/mentors', mentorRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/', taskRoutes);

// Health check
apiRouter.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Current versioned surface (mobile + new clients)
app.use('/api/v1', apiRouter);
// Legacy alias — keeps the existing web build and older integrations working
app.use('/api', apiRouter);

// OpenAPI docs (raw JSON + Swagger UI)
app.get('/api/v1/docs.json', (req, res) => res.json(openapiSpec));
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
