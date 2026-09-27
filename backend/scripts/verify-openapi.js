// Verifies the generated OpenAPI spec is well-formed and covers the real routes.
const spec = require('../src/docs/swagger.js');

const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

// --- well-formedness -------------------------------------------------------
let operations = 0;
const documented = new Set();

for (const [p, item] of Object.entries(spec.paths || {})) {
  for (const [m, op] of Object.entries(item)) {
    if (!METHODS.includes(m)) continue;
    operations++;
    documented.add(`${m.toUpperCase()} ${p}`);
    if (!op.responses || Object.keys(op.responses).length === 0) {
      throw new Error(`Missing responses for ${m.toUpperCase()} ${p}`);
    }
    const tag = Array.isArray(op.tags) ? op.tags[0] : null;
    if (!tag) throw new Error(`Missing tags for ${m.toUpperCase()} ${p}`);
    if (!spec.tags.some((t) => t.name === tag)) {
      throw new Error(`Undeclared tag "${tag}" on ${m.toUpperCase()} ${p}`);
    }
  }
}

if (!spec.components?.schemas?.Error) throw new Error('Missing Error schema');
if (!spec.components?.securitySchemes?.bearerAuth) throw new Error('Missing bearerAuth scheme');

// --- coverage vs the real Express routers ---------------------------------
const express = require('express');
const path = require('path');

const ROUTE_FILES = {
  auth: 'auth.routes',
  user: 'user.routes',
  idea: 'idea.routes',
  project: 'project.routes',
  task: 'task.routes',
  chat: 'chat.routes',
  notification: 'notification.routes',
  mentor: 'mentor.routes',
  report: 'report.routes',
  ai: 'ai.routes',
  admin: 'admin.routes',
};

// Mount prefixes mirror src/app.js so the generated paths line up with the spec.
const MOUNTS = {
  auth: '/auth',
  user: '/users',
  idea: '/ideas',
  project: '/projects',
  task: '',
  chat: '/chats',
  notification: '/notifications',
  mentor: '/mentors',
  report: '/reports',
  ai: '/ai',
  admin: '/admin',
};

const toSpecPath = (full) =>
  full
    .replace(/:([A-Za-z0-9_]+)(\?)?/g, '{$1}')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';

const actual = new Set();

for (const [key, file] of Object.entries(ROUTE_FILES)) {
  // Each route module exports a fully-built router.
  const router = require(path.join(__dirname, '..', 'src', 'routes', file));

  for (const layer of router.stack) {
    if (!layer.route) continue;
    const p = toSpecPath(MOUNTS[key] + layer.route.path);
    for (const m of Object.keys(layer.route.methods)) {
      actual.add(`${m.toUpperCase()} ${p}`);
    }
  }
}

const missing = [...actual].filter((r) => !documented.has(r));

console.log(`spec paths        : ${Object.keys(spec.paths).length}`);
console.log(`spec operations   : ${operations}`);
console.log(`registered routes : ${actual.size}`);
console.log(`documented share  : ${documentsCover(actual, documented)}`);
if (missing.length) {
  console.log('\nundocumented routes:');
  missing.sort().forEach((m) => console.log('  ' + m));
}

function documentsCover(actualSet, docSet) {
  const n = [...actualSet].filter((r) => docSet.has(r)).length;
  return `${n}/${actualSet.size}`;
}

process.exit(missing.length ? 1 : 0);
