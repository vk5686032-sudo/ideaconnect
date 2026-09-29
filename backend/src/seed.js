/**
 * IdeaConnect — Database Seed Script
 *
 * Usage:  node src/seed.js           (clears + seeds)
 *         node src/seed.js --dry      (prints what it would do, no changes)
 *
 * Creates realistic demo data: users, ideas, projects, tasks, milestones,
 * comments, likes, bookmarks, and notifications.
 */

const mongoose = require('mongoose');
const config = require('./config/env');

// Models
const User = require('./models/User');
const Idea = require('./models/Idea');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');

const DRY_RUN = process.argv.includes('--dry');

const USERS = [
  {
    name: 'Ava Chen',
    email: 'admin@ideaconnect.dev',
    password: 'password123',
    bio: 'Platform admin and full-stack developer passionate about innovation tools.',
    role: 'admin',
    isVerified: true,
    skills: ['React', 'Node.js', 'TypeScript', 'DevOps', 'AWS'],
    interests: ['AI', 'startups', 'open source'],
    socialLinks: { github: 'https://github.com/avachen', linkedin: 'https://linkedin.com/in/avachen' },
  },
  {
    name: 'Marcus Webb',
    email: 'mentor@ideaconnect.dev',
    password: 'password123',
    bio: 'Senior product manager at a Fortune 500. 10+ years turning ideas into shipped products.',
    role: 'mentor',
    isVerified: true,
    isMentorApproved: true,
    skills: ['Product Management', 'UI/UX Design', 'React', 'Python', 'Data Science'],
    interests: ['edtech', 'sustainability', 'AI ethics'],
    socialLinks: { linkedin: 'https://linkedin.com/in/marcuswebb' },
  },
  {
    name: 'Priya Nair',
    email: 'priya@ideaconnect.dev',
    password: 'password123',
    bio: 'CS student at VTU. Love building things that solve real problems.',
    role: 'user',
    isVerified: true,
    skills: ['Python', 'Machine Learning', 'React', 'Flask'],
    interests: ['healthcare', 'education', 'social impact'],
  },
  {
    name: 'James Okafor',
    email: 'james@ideaconnect.dev',
    password: 'password123',
    bio: 'Backend developer specializing in scalable distributed systems.',
    role: 'user',
    isVerified: true,
    skills: ['Node.js', 'Go', 'MongoDB', 'Docker', 'Kubernetes'],
    interests: ['blockchain', 'fintech', 'cloud computing'],
  },
];

const IDEAS = [
  {
    title: 'CampusLost — Smart Lost & Found Network',
    description:
      'A campus-wide lost-and-found platform where students post items they lost or found with photos, location tags, and AI matching to pair lost with found. Reduces waste and helps students recover valuable items.',
    category: 'education',
    tags: ['campus', 'sustainability', 'mobile'],
    requiredSkills: ['React Native', 'Node.js', 'Image Recognition'],
    status: 'open',
    visibility: 'public',
    aiAnalysis: {
      suggestions: [
        'Add QR-code item tags for instant matching',
        'Partner with campus security for verified drop-off points',
      ],
      challenges: ['User adoption on a new campus', 'Photo spam moderation'],
      recommendedTechnologies: ['React Native', 'TensorFlow.js', 'Cloudinary'],
      analyzedAt: new Date(),
    },
    feasibilityScore: 82,
    innovationScore: 65,
  },
  {
    title: 'GreenRoute — Carbon-Aware Navigation',
    description:
      'An alternative to Google Maps that calculates routes not just by distance but by carbon footprint. Highlights bike lanes, public transit options, and walking paths. Shows CO2 saved vs driving.',
    category: 'environment',
    tags: ['sustainability', 'navigation', 'maps'],
    requiredSkills: ['React', 'Python', 'Mapbox API', 'Data Visualization'],
    status: 'in-progress',
    visibility: 'public',
    aiAnalysis: {
      suggestions: [
        'Integrate real-time transit API data',
        'Add gamification with weekly carbon savings leaderboard',
      ],
      challenges: ['Accurate carbon models per vehicle type', 'Real-time transit data availability'],
      recommendedTechnologies: ['React', 'Mapbox GL', 'Python', 'FastAPI'],
      analyzedAt: new Date(),
    },
    feasibilityScore: 74,
    innovationScore: 78,
  },
  {
    title: 'MediMatch — AI Symptom Checker with Local Doctor Routing',
    description:
      'An AI-powered symptom assessment tool that provides preliminary guidance and routes users to the nearest appropriate healthcare provider. Supports multilingual input for diverse communities.',
    category: 'healthcare',
    tags: ['ai', 'health', 'accessibility'],
    requiredSkills: ['Python', 'React', 'NLP', 'FastAPI'],
    status: 'open',
    visibility: 'public',
    aiAnalysis: {
      suggestions: ['Partner with local hospitals for verified data', 'Add teleconsultation booking'],
      challenges: ['Regulatory compliance', 'Ensuring AI accuracy for medical advice'],
      recommendedTechnologies: ['React', 'FastAPI', 'OpenAI', 'PostgreSQL'],
      analyzedAt: new Date(),
    },
    feasibilityScore: 58,
    innovationScore: 85,
  },
  {
    title: 'SkillSwap — Peer Skill Exchange Marketplace',
    description:
      'A platform where students teach each other skills they already have. "I can teach you guitar if you teach me Python." Time-banked so nobody pays money — just knowledge.',
    category: 'education',
    tags: ['community', 'peer-learning', 'skills'],
    requiredSkills: ['React', 'Node.js', 'MongoDB'],
    status: 'open',
    visibility: 'public',
    feasibilityScore: 90,
    innovationScore: 72,
  },
  {
    title: 'FocusHive — Pomodoro with Friends',
    description:
      'A real-time collaborative focus timer where you and friends work together in virtual study rooms. Shows who is focused, tracks collective output, and prevents procrastination through social accountability.',
    category: 'education',
    tags: ['productivity', 'social', 'study'],
    requiredSkills: ['React', 'Socket.io', 'Tailwind CSS'],
    status: 'draft',
    visibility: 'public',
    feasibilityScore: 88,
    innovationScore: 60,
  },
  {
    title: 'CodeReview Buddy — AI-Powered PR Reviews',
    description:
      'A GitHub App that automatically reviews pull requests using AI. Provides constructive feedback on code quality, security vulnerabilities, and best practices. Integrates directly into the GitHub workflow.',
    category: 'technology',
    tags: ['devtools', 'ai', 'github'],
    requiredSkills: ['TypeScript', 'GitHub API', 'Node.js', 'OpenAI'],
    status: 'open',
    visibility: 'public',
    feasibilityScore: 75,
    innovationScore: 70,
  },
];

const PROJECTS = [
  {
    title: 'GreenRoute MVP',
    description:
      'Building the minimum viable product of GreenRoute: a React + Mapbox web app showing carbon-optimized routes between campus buildings. Phase 1 covers the 5 most-used routes on campus.',
    technologies: ['React', 'Mapbox GL', 'Python', 'FastAPI', 'Tailwind CSS'],
    status: 'in-progress',
    visibility: 'public',
    progress: 35,
    deadline: new Date('2026-12-31'),
    milestones: [
      { title: 'Mapbox integration & route rendering', completed: true, completedAt: new Date('2026-07-15') },
      { title: 'Carbon calculation engine', completed: true, completedAt: new Date('2026-08-01') },
      { title: 'User-facing UI with route comparison', completed: false },
      { title: 'Transit data API integration', completed: false },
      { title: 'MVP launch', completed: false },
    ],
  },
  {
    title: 'SkillSwap Backend',
    description:
      'Building the backend API for SkillSwap: user matching algorithm, time-bank ledger, skill verification, and real-time session scheduling.',
    technologies: ['Node.js', 'Express', 'MongoDB', 'Socket.io', 'Redis'],
    status: 'planning',
    visibility: 'public',
    progress: 10,
    milestones: [
      { title: 'Schema design & API skeleton', completed: true, completedAt: new Date('2026-08-05') },
      { title: 'Matching algorithm', completed: false },
      { title: 'Time-bank transaction system', completed: false },
    ],
  },
];

const TASKS_PROJECT_0 = [
  { title: 'Set up Mapbox GL token and base map', status: 'completed', priority: 'high', description: 'Configure environment and render campus map tiles' },
  { title: 'Build route calculation API', status: 'completed', priority: 'high', description: 'Python FastAPI service returning carbon-optimized routes' },
  { title: 'Create route comparison UI', status: 'in-progress', priority: 'high', description: 'Side-by-side comparison of driving vs. walking vs. transit with CO2 badges' },
  { title: 'Add transit data feed', status: 'todo', priority: 'medium', description: 'Integrate campus bus schedule API' },
  { title: 'Add user preferences (transport mode)', status: 'todo', priority: 'low', description: 'Let users set preferred transport modes and save favorites' },
  { title: 'Write integration tests', status: 'todo', priority: 'medium', description: 'Test route API + map rendering' },
];

const TASKS_PROJECT_1 = [
  { title: 'Design User and Skill schemas', status: 'completed', priority: 'high', description: 'Define Mongoose models for users, skills, and time-bank transactions' },
  { title: 'Implement matching algorithm', status: 'todo', priority: 'high', description: 'Match users based on complementary skills and availability' },
  { title: 'Build skill verification flow', status: 'todo', priority: 'medium', description: 'Review step before a skill is listed' },
  { title: 'Create session scheduling API', status: 'todo', priority: 'medium', description: 'Calendar integration for booking skill exchange sessions' },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(config.mongoUri);
  console.log('Connected\n');

  if (DRY_RUN) console.log('DRY RUN — no changes will be made\n');

  // Clear existing data
  if (!DRY_RUN) {
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Idea.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Comment.deleteMany({}),
      Notification.deleteMany({}),
    ]);
  }

  // ── Users ──────────────────────────────────────
  // NOTE: Do NOT pre-hash the password — User.create() triggers the
  // pre-save hook which hashes it automatically. Pre-hashing causes
  // a double-hash that makes login fail ("Invalid credentials").
  console.log('Creating users...');
  const users = [];
  for (const u of USERS) {
    if (DRY_RUN) {
      users.push({ ...u, _id: new mongoose.Types.ObjectId() });
      console.log(`   - ${u.name} (${u.email})`);
    } else {
      const doc = await User.create({ ...u }); // plain text password — model hashes it
      users.push(doc);
      console.log(`   - ${doc.name} (${doc.email})`);
    }
  }
  console.log('');

  // ── Ideas ──────────────────────────────────────
  console.log('Creating ideas...');
  const ideas = [];
  const ideaAuthors = [0, 0, 2, 3, 2, 3]; // user index per idea
  for (let i = 0; i < IDEAS.length; i++) {
    const author = users[ideaAuthors[i]];
    if (DRY_RUN) {
      ideas.push({ ...IDEAS[i], _id: new mongoose.Types.ObjectId() });
      console.log(`   - ${IDEAS[i].title}`);
    } else {
      const doc = await Idea.create({ ...IDEAS[i], author: author._id });
      ideas.push(doc);
      await User.findByIdAndUpdate(author._id, { $push: { ideasCreated: doc._id } });
      console.log(`   - ${doc.title}`);
    }
  }
  console.log('');

  // ── Comments ───────────────────────────────────
  console.log('Creating comments...');
  const commentData = [
    { ideaIdx: 0, authorIdx: 2, text: 'Great idea for campus! Happy to help with the React Native part.' },
    { ideaIdx: 0, authorIdx: 3, text: 'Nice. Have you considered QR codes for tracking?' },
    { ideaIdx: 1, authorIdx: 1, text: 'Strong concept. Validate your carbon models with real data.' },
    { ideaIdx: 2, authorIdx: 0, text: 'The multilingual aspect is crucial. Well thought out.' },
    { ideaIdx: 4, authorIdx: 3, text: 'Love the social accountability angle!' },
  ];
  const comments = [];
  for (const c of commentData) {
    if (DRY_RUN) {
      comments.push({ _id: new mongoose.Types.ObjectId(), idea: ideas[c.ideaIdx]._id });
      console.log(`   - ${c.text.slice(0, 50)}...`);
    } else {
      const doc = await Comment.create({
        content: c.text,
        author: users[c.authorIdx]._id,
        idea: ideas[c.ideaIdx]._id,
      });
      comments.push(doc);
      await Idea.findByIdAndUpdate(ideas[c.ideaIdx]._id, { $inc: { commentsCount: 1 } });
      console.log(`   - ${c.text.slice(0, 50)}...`);
    }
  }
  console.log('');

  // ── Projects ───────────────────────────────────
  console.log('Creating projects...');
  const projects = [];
  const projectOwners = [2, 3]; // priya, james
  for (let i = 0; i < PROJECTS.length; i++) {
    const owner = users[projectOwners[i]];
    const linkedIdea = ideas[i + 1]._id;
    if (DRY_RUN) {
      projects.push({ ...PROJECTS[i], _id: new mongoose.Types.ObjectId() });
      console.log(`   - ${PROJECTS[i].title}`);
    } else {
      const doc = await Project.create({
        ...PROJECTS[i],
        owner: owner._id,
        idea: linkedIdea,
        members: [
          { user: owner._id, role: 'lead' },
          { user: users[0]._id, role: 'developer' },
        ],
      });
      projects.push(doc);
      await User.findByIdAndUpdate(owner._id, { $push: { projectsJoined: doc._id } });
      await User.findByIdAndUpdate(users[0]._id, { $push: { projectsJoined: doc._id } });
      await Idea.findByIdAndUpdate(linkedIdea, { convertedToProject: doc._id, status: 'in-progress' });
      console.log(`   - ${doc.title} (${doc.progress}%)`);
    }
  }
  console.log('');

  // ── Tasks ──────────────────────────────────────
  console.log('Creating tasks...');
  const taskLists = [TASKS_PROJECT_0, TASKS_PROJECT_1];
  for (let pi = 0; pi < taskLists.length; pi++) {
    for (let ti = 0; ti < taskLists[pi].length; ti++) {
      const t = taskLists[pi][ti];
      const assignee = users[pi + 2]; // priya for project 0, james for project 1
      if (DRY_RUN) {
        console.log(`   - [${t.status}] ${t.title}`);
      } else {
        await Task.create({
          title: t.title,
          description: t.description,
          project: projects[pi]._id,
          createdBy: projects[pi].owner,
          assignedTo: assignee._id,
          priority: t.priority,
          status: t.status,
          completedAt: t.status === 'completed' ? new Date() : null,
          order: ti,
        });
        console.log(`   - [${t.status}] ${t.title}`);
      }
    }
  }
  console.log('');

  // ── Notifications ──────────────────────────────
  console.log('Creating notifications...');
  const notifData = [
    { recipientIdx: 2, senderIdx: 3, type: 'like', ideaIdx: 2 },
    // commentData[3] is the one comment that actually sits on ideas[2] (and its
    // author is users[0]), so the sender and the #comment- anchor both resolve
    // to something real rather than pointing at a comment on another idea.
    { recipientIdx: 2, senderIdx: 0, type: 'comment', ideaIdx: 2, commentIdx: 3 },
    { recipientIdx: 0, senderIdx: 2, type: 'like', ideaIdx: 0 },
  ];
  for (const n of notifData) {
    // Every seeded notification must carry a real actionUrl. The mobile app
    // resolves actionUrl to a screen (see resolveActionRoute) and silently
    // falls back to the notifications list when it is missing, so a seed
    // without one made "tap the notification" untestable and un-demoable --
    // the production controllers always set it, only the fixture did not.
    const idea = ideas[n.ideaIdx];
    const comment = n.commentIdx === undefined ? null : comments[n.commentIdx];
    const actionUrl = comment
      ? `/ideas/${idea._id}#comment-${comment._id}`
      : `/ideas/${idea._id}`;
    const title =
      n.type === 'like' ? 'New like on your idea' : 'New comment on your idea';
    const msg = comment
      ? `${users[n.senderIdx].name} commented on your idea`
      : `${users[n.senderIdx].name} liked your idea`;

    if (DRY_RUN) {
      console.log(`   - ${msg} → ${users[n.recipientIdx].name} (${actionUrl})`);
    } else {
      await Notification.create({
        recipient: users[n.recipientIdx]._id,
        sender: users[n.senderIdx]._id,
        type: n.type,
        title,
        message: msg,
        actionUrl,
      });
      console.log(`   - ${msg} → ${users[n.recipientIdx].name} (${actionUrl})`);
    }
  }
  console.log('');

  // ── Summary ────────────────────────────────────
  console.log('══════════════════════════════════════');
  console.log('Seed Summary');
  console.log('══════════════════════════════════════');
  console.log(`   Users:          ${USERS.length}`);
  console.log(`   Ideas:          ${IDEAS.length}`);
  console.log(`   Projects:       ${PROJECTS.length}`);
  console.log(`   Tasks:          ${TASKS_PROJECT_0.length + TASKS_PROJECT_1.length}`);
  console.log(`   Comments:       ${commentData.length}`);
  console.log(`   Notifications:  ${notifData.length}`);
  console.log('══════════════════════════════════════');
  console.log('');
  console.log('Demo Accounts (password: password123):');
  console.log('   admin@ideaconnect.dev   (Admin)');
  console.log('   mentor@ideaconnect.dev  (Mentor)');
  console.log('   priya@ideaconnect.dev   (Student)');
  console.log('   james@ideaconnect.dev   (Developer)');
  console.log('');

  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});