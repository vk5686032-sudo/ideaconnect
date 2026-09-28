// IMPORTANT: dedicated test DB BEFORE requiring the app, same as api.test.js.
// Its own database: the runner executes test files concurrently, and api.test.js
// wipes the shared user collection in beforeEach.
process.env.MONGODB_URI =
  process.env.MONGODB_URI_SOCKETAUTH ||
  'mongodb://localhost:27017/ideaconnect_test_socketauth';
process.env.NODE_ENV = 'test';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const http = require('http');
const { io: ioClient } = require('socket.io-client');

const { generateToken } = require('../utils/jwt');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const connectDB = require('../config/db');
const { initSocket } = require('../config/socket');

let server;
let port;
let member;
let other;
let outsider;
let chat;

const mkUser = (name, email) =>
  User.create({ name, email, password: 'password123', role: 'user' });

// Open an authenticated socket for `user` and wait for the handshake.
const connectAs = (user) =>
  new Promise((resolve, reject) => {
    const socket = ioClient(`http://localhost:${port}`, {
      auth: { token: generateToken(user._id) },
      transports: ['websocket'],
      forceNew: true,
    });
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', reject);
  });

// Resolve true if `event` arrives within `ms`, false on timeout.
const receives = (socket, event, ms = 700) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), ms);
    socket.once(event, () => {
      clearTimeout(timer);
      resolve(true);
    });
  });

before(async () => {
  await connectDB();

  server = http.createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  port = server.address().port;
  initSocket(server);

  [member, other, outsider] = await Promise.all([
    mkUser('Member', 'member@test.com'),
    mkUser('Other', 'other@test.com'),
    mkUser('Outsider', 'outsider@test.com'),
  ]);
  chat = await Chat.create({
    type: 'direct',
    participants: [member._id, other._id],
  });
});

after(async () => {
  await Message.deleteMany({});
  await Chat.deleteMany({});
  await User.deleteMany({});
  await mongoose.disconnect();
  if (server) server.close();
  // Open client sockets keep the event loop alive, which would stop the test
  // runner from ever reporting a summary. Nothing here needs them afterwards.
  process.exit(0);
});

beforeEach(async () => {
  await Message.deleteMany({});
});

// --- chat:join authorization -------------------------------------------

test('a non-participant cannot receive another chat\'s messages via chat:join', async () => {
  const victim = await connectAs(outsider);
  const peer = await connectAs(other);

  // Outsider attempts to join a chat they are not in.
  victim.emit('chat:join', chat._id.toString());
  await new Promise((resolve) => setTimeout(resolve, 150));

  // A legitimate member then sends; the outsider must NOT see it.
  const gotIt = receives(victim, 'message:received');
  peer.emit('message:send', { chatId: chat._id.toString(), content: 'secret' });
  assert.equal(await gotIt, false, 'outsider received a message from a chat they are not in');

  victim.close();
  peer.close();
});

test('a participant CAN receive messages after chat:join', async () => {
  const memberSocket = await connectAs(member);
  const peer = await connectAs(other);

  memberSocket.emit('chat:join', chat._id.toString());
  await new Promise((resolve) => setTimeout(resolve, 150));

  const gotIt = receives(memberSocket, 'message:received');
  peer.emit('message:send', { chatId: chat._id.toString(), content: 'hello' });
  assert.equal(await gotIt, true, 'legitimate participant did not receive the message');

  memberSocket.close();
  peer.close();
});

// --- message:send authorization ----------------------------------------

test('a non-participant cannot write a message into a chat', async () => {
  const intruder = await connectAs(outsider);

  intruder.emit('message:send', {
    chatId: chat._id.toString(),
    content: 'injected',
  });
  await new Promise((resolve) => setTimeout(resolve, 400));

  const count = await Message.countDocuments({ chat: chat._id });
  assert.equal(count, 0, 'a non-participant persisted a message into someone else\'s chat');

  intruder.close();
});

test('a non-participant sending to a non-existent chat leaks no orphan message', async () => {
  const intruder = await connectAs(outsider);
  const missing = new mongoose.Types.ObjectId().toString();

  intruder.emit('message:send', { chatId: missing, content: 'orphan' });
  await new Promise((resolve) => setTimeout(resolve, 400));

  const count = await Message.countDocuments({ chat: missing });
  assert.equal(count, 0, 'an orphaned message row was persisted for a missing chat');

  intruder.close();
});

test('a participant CAN send a message, and sender identity comes from the socket', async () => {
  const sender = await connectAs(member);

  const acked = new Promise((resolve) => {
    sender.emit(
      'message:send',
      { chatId: chat._id.toString(), content: 'legit' },
      resolve
    );
  });

  const result = await acked;
  assert.equal(result.ok, true);
  assert.equal(result.message.sender._id.toString(), member._id.toString());

  const stored = await Message.findById(result.message._id);
  assert.equal(stored.sender.toString(), member._id.toString());

  sender.close();
});

test('a client cannot spoof another user as the message sender', async () => {
  // A legitimate sender who ALSO passes a spoofed senderId must still be
  // recorded as themselves — the payload field is ignored entirely.
  const impostor = await connectAs(member);

  const acked = new Promise((resolve) => {
    impostor.emit(
      'message:send',
      {
        chatId: chat._id.toString(),
        content: 'spoof attempt',
        senderId: other._id.toString(), // must be ignored
      },
      resolve
    );
  });

  const result = await acked;
  assert.equal(result.ok, true);
  assert.equal(
    result.message.sender._id.toString(),
    member._id.toString(),
    'server trusted a client-supplied senderId'
  );

  const stored = await Message.findById(result.message._id);
  assert.equal(stored.sender.toString(), member._id.toString());

  impostor.close();
});

// --- read receipts -----------------------------------------------------

test('a socket cannot forge read receipts for another user', async () => {
  const sender = await connectAs(other);
  const attacker = await connectAs(outsider);

  const acked = new Promise((resolve) => {
    sender.emit(
      'message:send',
      { chatId: chat._id.toString(), content: 'read me' },
      resolve
    );
  });
  const { message } = await acked;

  // Attacker claims the victim read it.
  attacker.emit('messages:read', {
    chatId: chat._id.toString(),
    userId: member._id.toString(),
  });
  await new Promise((resolve) => setTimeout(resolve, 400));

  const stored = await Message.findById(message._id);
  const forged = stored.readBy.some((r) => r.user.toString() === member._id.toString());
  assert.equal(forged, false, 'an outsider forged a read receipt for another user');

  sender.close();
  attacker.close();
});

test('a participant CAN mark messages read, and only for themselves', async () => {
  const sender = await connectAs(other);
  const reader = await connectAs(member);

  const acked = new Promise((resolve) => {
    sender.emit(
      'message:send',
      { chatId: chat._id.toString(), content: 'read me' },
      resolve
    );
  });
  const { message } = await acked;

  reader.emit('messages:read', {
    chatId: chat._id.toString(),
    userId: member._id.toString(),
  });
  await new Promise((resolve) => setTimeout(resolve, 400));

  const stored = await Message.findById(message._id);
  assert.ok(
    stored.readBy.some((r) => r.user.toString() === member._id.toString()),
    'the reader\'s own receipt was not recorded'
  );

  sender.close();
  reader.close();
});

test('messages:read does not echo the sender its own receipt', async () => {
  const sender = await connectAs(other);

  const acked = new Promise((resolve) => {
    sender.emit(
      'message:send',
      { chatId: chat._id.toString(), content: 'echo check' },
      resolve
    );
  });
  await acked;

  const echoed = receives(sender, 'messages:read', 700);
  sender.emit('messages:read', {
    chatId: chat._id.toString(),
    userId: other._id.toString(),
  });
  assert.equal(await echoed, false, 'sender received its own read-receipt broadcast');

  sender.close();
});

// --- presence scoping ---------------------------------------------------

test('presence:snapshot lists only users who share a chat with me', async () => {
  // `other` is in the same chat as `member`; `outsider` shares nothing.
  const listener = await connectAs(member);
  const peer = await connectAs(other);
  const stranger = await connectAs(outsider);

  // Everyone is connected and online before the snapshot is taken.
  await new Promise((resolve) => setTimeout(resolve, 250));

  // The peer and the stranger register as online; only the peer shares a chat.
  peer.emit('join');
  stranger.emit('join');
  await new Promise((resolve) => setTimeout(resolve, 250));

  const snapshot = new Promise((resolve) => {
    listener.on('presence:snapshot', resolve);
    listener.emit('join');
  });

  const online = await snapshot;
  const ids = online.map((id) => id.toString());

  assert.ok(ids.includes(member._id.toString()), 'snapshot omitted the listener');
  assert.ok(ids.includes(other._id.toString()), 'snapshot omitted a chat peer');
  assert.ok(
    !ids.includes(outsider._id.toString()),
    'snapshot leaked a user who shares no chat with the listener'
  );

  listener.close();
  peer.close();
  stranger.close();
});

test('a user:online event is not broadcast to unrelated users', async () => {
  const stranger = await connectAs(outsider);
  await new Promise((resolve) => setTimeout(resolve, 200));

  const leaked = receives(stranger, 'user:online', 700);
  const newcomer = await connectAs(other);
  // `other` is a chat peer of `member` but shares nothing with `outsider`.
  newcomer.emit('join');

  assert.equal(
    await leaked,
    false,
    'user:online leaked to a user who shares no chat with the newcomer'
  );

  stranger.close();
  newcomer.close();
});

// --- notification event shape -----------------------------------------

test('a chat message emits chat:unread, not a notification event', async () => {
  const sender = await connectAs(member);
  const recipient = await connectAs(other);
  recipient.emit('join');
  await new Promise((resolve) => setTimeout(resolve, 200));

  // The recipient must not be told a Notification row exists for a chat
  // message: no such row is created, and the two used to share one event name
  // with two incompatible payload shapes.
  const asNotification = receives(recipient, 'notification', 800);
  const asUnread = new Promise((resolve) => {
    recipient.on('chat:unread', resolve);
  });

  sender.emit('message:send', { chatId: chat._id.toString(), content: 'ping' });
  await new Promise((resolve) => setTimeout(resolve, 400));

  assert.equal(await asNotification, false, 'a chat message was emitted as a notification');
  const payload = await asUnread;
  assert.ok(payload, 'no chat:unread event was emitted');
  assert.equal(payload.chatId, chat._id.toString());

  sender.close();
  recipient.close();
});

test('a real notification still emits the notification event with a notification payload', async () => {
  const { getIO } = require('../config/socket');
  assert.ok(getIO(), 'socket server should be initialised');

  // Mentions create a real Notification row via the service, which is the
  // other producer of this event. It must keep the { notification } shape.
  const recipient = await connectAs(other);
  recipient.emit('join');
  await new Promise((resolve) => setTimeout(resolve, 200));

  const received = new Promise((resolve) => {
    recipient.on('notification', resolve);
  });

  const notificationService = require('../services/notification.service');
  await notificationService.create({
    recipient: other._id,
    sender: member._id,
    type: 'system',
    title: 'Test notice',
    message: 'body',
    actionUrl: `/ideas/${chat._id}`,
  });

  const payload = await received;
  assert.ok(payload.notification, 'notification event carried no notification');
  assert.equal(payload.notification.title, 'Test notice');

  recipient.close();
});

// --- authentication ----------------------------------------------------

test('a socket without a token is rejected', async () => {
  await new Promise((resolve, reject) => {
    const socket = ioClient(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
    });
    socket.on('connect', () => {
      socket.close();
      reject(new Error('unauthenticated socket was allowed to connect'));
    });
    socket.on('connect_error', () => {
      socket.close();
      resolve();
    });
  });
});
