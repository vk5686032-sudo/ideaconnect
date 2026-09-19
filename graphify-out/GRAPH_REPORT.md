# Graph Report - omniroute.test  (2026-09-19)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1310 nodes · 3035 edges · 69 communities (59 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5473ecf1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app/_layout.tsx
- auth.controller.js
- chat/[id].tsx
- react-native
- ideas/[id].tsx
- auth.js
- AppRoutes.jsx
- dependencies
- errorResponse
- Profile.jsx
- idea.controller.js
- react-router-dom
- users/[id].tsx
- projects/[id].tsx
- client.ts
- successResponse
- app.js
- expo
- frontend/package.json
- lucide-react
- edit.tsx
- mobile/package.json
- backend/package.json
- project.controller.js
- models.ts
- task.controller.js
- chat.controller.js
- user.routes.js
- dependencies
- mentors/index.tsx
- profile.tsx
- upload.js
- seed.js
- comment.controller.js
- notification.service.js
- idea.routes.js
- mentor.controller.js
- dependencies
- Chat.jsx
- chat.socket.js
- report.routes.js
- backfill-reputation.js
- api.test.js
- report.controller.js
- ai.service.js
- devDependencies
- pushTokens.ts
- scripts
- mongoose
- Idea.js
- User.js
- scripts
- tsconfig.json
- push.service.js
- .oxlintrc.json
- scripts
- devDependencies
- App.jsx
- metro.config.js
- Search.jsx
- nativewind-env.d.ts

## God Nodes (most connected - your core abstractions)
1. `successResponse()` - 121 edges
2. `errorResponse()` - 98 edges
3. `useAuthStore` - 40 edges
4. `react-native` - 39 edges
5. `lucide-react` - 36 edges
6. `expo-router` - 34 edges
7. `react-router-dom` - 33 edges
8. `react-hot-toast` - 25 edges
9. `useAuthStore` - 25 edges
10. `lucide-react-native` - 23 edges

## Surprising Connections (you probably didn't know these)
- `useIsAuthenticated()` --calls--> `useAuthStore`  [EXTRACTED]
  mobile/src/hooks/useAuth.ts → mobile/src/store/authSlice.ts
- `getMe()` --calls--> `successResponse()`  [EXTRACTED]
  backend/src/controllers/auth.controller.js → backend/src/utils/response.js
- `logoutAll()` --calls--> `successResponse()`  [EXTRACTED]
  backend/src/controllers/auth.controller.js → backend/src/utils/response.js
- `createIdea()` --calls--> `successResponse()`  [EXTRACTED]
  backend/src/controllers/idea.controller.js → backend/src/utils/response.js
- `getBookmarkedIdeas()` --calls--> `successResponse()`  [EXTRACTED]
  backend/src/controllers/idea.controller.js → backend/src/utils/response.js

## Import Cycles
- None detected.

## Communities (69 total, 2 thin omitted)

### Community 0 - "app/_layout.tsx"
Cohesion: 0.06
Nodes (45): AuthLayout(), ChatLayout(), IdeasLayout(), darkNavTheme, lightNavTheme, queryClient, SocketNotificationBridge(), unstable_settings (+37 more)

### Community 1 - "auth.controller.js"
Cohesion: 0.05
Nodes (52): dotenv, path, config, initSocket(), jwt, { Server }, buildAuthPayload(), config (+44 more)

### Community 2 - "chat/[id].tsx"
Cohesion: 0.08
Nodes (52): ChatRoomScreen(), COMPOSER_EMOJIS, dayLabel(), QUICK_EMOJIS, resolveSender(), RootLayout(), ChatScreen(), previewOf() (+44 more)

### Community 3 - "react-native"
Cohesion: 0.08
Nodes (41): BookmarksScreen(), NotificationRow(), FeedStatus, IdeasScreen(), HomeScreen(), TaskStatusTone, taskStatusTones, FeedStatus (+33 more)

### Community 4 - "ideas/[id].tsx"
Cohesion: 0.09
Nodes (39): CreateIdeaScreen(), IdeaForm(), IdeaFormData, IdeaFormDefaults, ideaFormSchema, parseListInput(), VISIBILITIES, CommentItem() (+31 more)

### Community 5 - "auth.js"
Cohesion: 0.07
Nodes (34): authorize(), checkVerification(), config, { errorResponse }, isApprovedMentor(), jwt, optionalAuth(), protect() (+26 more)

### Community 6 - "AppRoutes.jsx"
Cohesion: 0.11
Nodes (28): authApi, AuthLayout(), AdminDashboard(), ForgotPassword(), forgotSchema, ResetPassword(), resetSchema, VerifyEmail() (+20 more)

### Community 7 - "dependencies"
Cohesion: 0.05
Nodes (39): dependencies, axios, date-fns, expo, expo-constants, expo-device, expo-font, @expo-google-fonts/inter (+31 more)

### Community 8 - "errorResponse"
Cohesion: 0.10
Nodes (35): approveMentor(), AuditLog, bulkIdeaAction(), bulkProjectAction(), bulkUserAction(), getAllIdeas(), getAllProjects(), getAllUsers() (+27 more)

### Community 9 - "Profile.jsx"
Cohesion: 0.12
Nodes (23): api, AUTH_ENDPOINTS, getStoredValue(), hardLogout(), refreshAccessToken(), removeStoredValue(), setStoredValue(), chatApi (+15 more)

### Community 10 - "idea.controller.js"
Cohesion: 0.07
Nodes (33): addMentorReview(), cloudinary, Comment, createIdea(), deleteIdea(), deleteMentorReview(), getBookmarkedIdeas(), getIdeaById() (+25 more)

### Community 11 - "react-router-dom"
Cohesion: 0.12
Nodes (20): aiApi, ideaApi, BackButton(), Home(), CreateIdea(), ideaSchema, IdeaDetail(), Ideas() (+12 more)

### Community 12 - "users/[id].tsx"
Cohesion: 0.11
Nodes (23): ForgotFormData, forgotSchema, LoginFormData, loginSchema, LoginScreen(), ResetFormData, ResetPasswordScreen(), resetSchema (+15 more)

### Community 13 - "projects/[id].tsx"
Cohesion: 0.13
Nodes (27): priorityColors, ProjectDetailScreen(), projectStatusTones, resolveUser(), roleTones, StatusTone, TaskRow(), taskStatusTones (+19 more)

### Community 14 - "client.ts"
Cohesion: 0.14
Nodes (22): RegisterFormData, registerSchema, authApi, AUTH_ENDPOINTS, AuthClientEvent, AuthClientListener, hardLogout(), refreshAccessToken() (+14 more)

### Community 15 - "successResponse"
Cohesion: 0.12
Nodes (25): aiService, analyzeIdea(), checkDuplicates(), getRecommendations(), getSimilarIdeas(), Idea, improveDescription(), { successResponse, errorResponse } (+17 more)

### Community 16 - "app.js"
Cohesion: 0.08
Nodes (24): adminRoutes, aiRoutes, apiRouter, app, authRoutes, chatRoutes, config, cors (+16 more)

### Community 17 - "expo"
Cohesion: 0.08
Nodes (25): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, softwareKeyboardLayoutMode, typedRoutes (+17 more)

### Community 18 - "frontend/package.json"
Cohesion: 0.08
Nodes (23): axios, react, zod, name, private, type, version, date-fns (+15 more)

### Community 19 - "lucide-react"
Cohesion: 0.23
Nodes (13): adminApi, notificationApi, AdminApprovals(), AdminAuditLogs(), TABS, AdminIdeas(), AdminProjects(), AdminReports() (+5 more)

### Community 20 - "edit.tsx"
Cohesion: 0.11
Nodes (19): RegisterScreen(), EditProfileScreen(), educationSchema, experienceSchema, parseList(), ProfileFormData, profileFormSchema, toYearOrNull() (+11 more)

### Community 21 - "mobile/package.json"
Cohesion: 0.08
Nodes (23): axios, react, zod, main, name, version, eslint, eslint-config-expo (+15 more)

### Community 22 - "backend/package.json"
Cohesion: 0.09
Nodes (21): description, devDependencies, nodemon, supertest, axios, zod, keywords, main (+13 more)

### Community 23 - "project.controller.js"
Cohesion: 0.09
Nodes (21): config, addMember(), cloudinary, createProject(), deleteProject(), getMyProjects(), getProjectById(), getProjectInvitations() (+13 more)

### Community 24 - "models.ts"
Cohesion: 0.13
Nodes (19): api, projectApi, ProjectFilters, ApiSuccess, Avatar, Education, Experience, IdeaAiAnalysis (+11 more)

### Community 25 - "task.controller.js"
Cohesion: 0.13
Nodes (18): addMilestone(), createTask(), deleteMilestone(), deleteTask(), getMyTasks(), getProjectTasks(), isProjectMember(), notificationService (+10 more)

### Community 26 - "chat.controller.js"
Cohesion: 0.13
Nodes (19): getIO(), addParticipant(), Chat, createGroupChat(), createOrGetDirectChat(), deleteMessage(), editMessage(), getChatById() (+11 more)

### Community 27 - "user.routes.js"
Cohesion: 0.12
Nodes (17): authController, express, { protect }, { registerSchema, loginSchema, validate }, router, express, { protect, optionalAuth }, router (+9 more)

### Community 28 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, axios, bcryptjs, cloudinary, cors, dotenv, expo-server-sdk, express (+11 more)

### Community 29 - "mentors/index.tsx"
Cohesion: 0.20
Nodes (14): MentorsScreen(), requestStatusTone, resolveUser(), Segment, mentorApi, MentorRequest, ProfileUpdatePayload, userApi (+6 more)

### Community 30 - "profile.tsx"
Cohesion: 0.14
Nodes (11): ProfileScreen(), roleBadgeTone, Avatar(), AvatarProps, initialsOf(), Chip(), ChipProps, StatusPickerModal() (+3 more)

### Community 31 - "upload.js"
Cohesion: 0.12
Nodes (13): chatStorage, chatUploadDir, { errorResponse }, fs, multer, path, storage, chatController (+5 more)

### Community 32 - "seed.js"
Cohesion: 0.12
Nodes (15): Comment, config, DRY_RUN, Idea, IDEAS, mongoose, Notification, Project (+7 more)

### Community 33 - "comment.controller.js"
Cohesion: 0.15
Nodes (14): Comment, createComment(), deleteComment(), getComments(), Idea, notificationService, reputationService, { resolveMentionedUsers } (+6 more)

### Community 34 - "notification.service.js"
Cohesion: 0.14
Nodes (11): getMyNotifications(), getUnreadCount(), markAllAsRead(), markAsRead(), notificationService, { successResponse, errorResponse }, { getIO }, getUserNotifications() (+3 more)

### Community 35 - "idea.routes.js"
Cohesion: 0.16
Nodes (13): commentController, { createIdeaSchema, mentorReviewSchema, validate }, express, ideaController, { protect, checkVerification, isApprovedMentor, optionalAuth }, router, { uploadMultiple }, createCommentSchema (+5 more)

### Community 36 - "mentor.controller.js"
Cohesion: 0.14
Nodes (12): Chat, getIncomingMentorRequests(), getMentors(), getMyMentorRequests(), handleMentorRequest(), Invitation, notificationService, sendMentorRequest() (+4 more)

### Community 37 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, axios, date-fns, @hookform/resolvers, lucide-react, react, react-dom, react-hook-form (+6 more)

### Community 38 - "Chat.jsx"
Cohesion: 0.36
Nodes (9): NotificationsBell(), useSocket(), MainLayout(), Chat(), EMOJIS, QUICK_REACTIONS, connectSocket(), disconnectSocket() (+1 more)

### Community 39 - "chat.socket.js"
Cohesion: 0.15
Nodes (10): chatSchema, mongoose, attachmentSchema, messageSchema, mongoose, activeUsers, Chat, Message (+2 more)

### Community 40 - "report.routes.js"
Cohesion: 0.18
Nodes (11): { createReportSchema, validate }, express, { protect }, reportController, router, validate(), createReportSchema, REPORT_REASONS (+3 more)

### Community 41 - "backfill-reputation.js"
Cohesion: 0.18
Nodes (10): Comment, connectDB, Idea, mongoose, P, run(), Task, User (+2 more)

### Community 42 - "api.test.js"
Cohesion: 0.17
Nodes (9): config, mongoose, app, assert, connectDB, mongoose, IMPORTANT: set a dedicated test DB BEFORE requiring the app, so, { test, before, after, beforeEach } (+1 more)

### Community 43 - "report.controller.js"
Cohesion: 0.17
Nodes (10): Comment, createReport(), Idea, Notification, Project, { successResponse, errorResponse }, TARGET_MODELS, User (+2 more)

### Community 44 - "ai.service.js"
Cohesion: 0.24
Nodes (9): improveTitle(), analyzeIdea(), axios, callOpenAI(), config, Idea, improveDescription(), suggestTitleImprovements() (+1 more)

### Community 45 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, autoprefixer, oxlint, postcss, tailwindcss, @types/react, @types/react-dom, vite (+2 more)

### Community 46 - "pushTokens.ts"
Cohesion: 0.31
Nodes (7): canUsePush(), getExpoPushToken(), registerPushToken(), unregisterPushToken(), expo-constants, expo-device, expo-notifications

### Community 47 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, backfill:reputation, dev, seed, seed:dry, start, test

### Community 48 - "mongoose"
Cohesion: 0.29
Nodes (5): auditLogSchema, mongoose, commentSchema, mongoose, mongoose

### Community 49 - "Idea.js"
Cohesion: 0.29
Nodes (6): ideaAttachmentSchema, ideaImageSchema, ideaSchema, ideaTeamSchema, mentorReviewSchema, mongoose

### Community 50 - "User.js"
Cohesion: 0.29
Nodes (6): bcrypt, educationSchema, experienceSchema, mongoose, userSchema, bcryptjs

### Community 51 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, android, ios, lint, start, typecheck, web

### Community 52 - "tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, paths, strict, extends, include, expo/tsconfig.base

### Community 53 - "push.service.js"
Cohesion: 0.47
Nodes (5): Expo, isExpoPushToken(), removePushToken(), sendPushToUser(), expo-server-sdk

### Community 54 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 55 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test

### Community 56 - "devDependencies"
Cohesion: 0.33
Nodes (6): devDependencies, eslint, eslint-config-expo, @types/react, typescript, typescript-eslint

### Community 57 - "App.jsx"
Cohesion: 0.50
Nodes (3): App(), queryClient, AppRoutes()

### Community 59 - "metro.config.js"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

## Knowledge Gaps
- **545 isolated node(s):** `IconConfig`, `ListCache`, `SchemeName`, `ResolvedRoute`, `ForgotFormData` (+540 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 591 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-native` connect `react-native` to `app/_layout.tsx`, `chat/[id].tsx`, `ideas/[id].tsx`, `users/[id].tsx`, `projects/[id].tsx`, `client.ts`, `pushTokens.ts`, `edit.tsx`, `mobile/package.json`, `mentors/index.tsx`, `profile.tsx`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `react-router-dom` connect `react-router-dom` to `Chat.jsx`, `AppRoutes.jsx`, `Profile.jsx`, `frontend/package.json`, `lucide-react`, `Search.jsx`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `expo-router` connect `app/_layout.tsx` to `chat/[id].tsx`, `react-native`, `ideas/[id].tsx`, `users/[id].tsx`, `projects/[id].tsx`, `client.ts`, `edit.tsx`, `mobile/package.json`, `mentors/index.tsx`, `profile.tsx`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `IconConfig`, `ListCache`, `SchemeName` to the rest of the system?**
  _545 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app/_layout.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06201923076923077 - nodes in this community are weakly interconnected._
- **Should `auth.controller.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05245901639344262 - nodes in this community are weakly interconnected._
- **Should `chat/[id].tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07831677381648158 - nodes in this community are weakly interconnected._