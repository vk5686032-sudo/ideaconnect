const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/env');
const errorHandler = require('./middlewares/errorHandler');
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
// RATE_LIMIT_MAX env var. Only counted for real users (skip internal calls).
const isPrivateIP = (ip) => {
  // IPv4 private ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 127.x.x.x
  // IPv6 loopback: ::1, ::ffff:127.0.0.1
  if (!ip) return true;
  const cleanIp = ip.replace('::ffff:', '');
  if (['127.0.0.1', '::1'].includes(cleanIp)) return true;
  const parts = cleanIp.split('.');
  if (parts.length === 4) {
    const [a, b] = parts.map(Number);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
};

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  // Skip private IPs (localhost + LAN) — local dev shouldn't trip it
  skip: (req) => isPrivateIP(req.ip),
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
app.use('/uploads', express.static('src/uploads'));

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
