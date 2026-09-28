// One-time migration: mark existing accounts as verified.
//
//   node scripts/backfill-verified.js          -> dry run (lists what would change)
//   node scripts/backfill-verified.js --apply  -> persist
//
// Why this is needed: middlewares/auth.js now enforces checkVerification when
// NODE_ENV=production, and User.isVerified defaults to false. Every account
// that predates real email delivery would be locked out of all 16 write routes
// on the first production deploy. Run this once, as part of that deploy.
//
// New signups are unaffected — they still have to click the emailed link.

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const run = async () => {
  await connectDB();
  const apply = process.argv.includes('--apply');

  const unverified = await User.find({ isVerified: { $ne: true } })
    .select('name email isVerified isActive createdAt')
    .sort({ createdAt: 1 });

  console.log(`${unverified.length} account(s) would be marked verified:\n`);
  for (const u of unverified) {
    const when = u.createdAt ? u.createdAt.toISOString().slice(0, 10) : 'unknown';
    const active = u.isActive === false ? ' [SUSPENDED]' : '';
    console.log(`  ${u.email}  (joined ${when})${active}`);
  }
  if (unverified.length === 0) console.log('  (nothing to do — all accounts already verified)');

  if (apply && unverified.length > 0) {
    const res = await User.updateMany(
      { isVerified: { $ne: true } },
      { $set: { isVerified: true } }
    );
    console.log(`\nMarked ${res.modifiedCount} account(s) verified.`);
  } else if (apply) {
    console.log('\nNothing to apply.');
  } else {
    console.log('\nDRY RUN - no changes made. Re-run with --apply to persist.');
  }

  await mongoose.connection.close();
  process.exit(0);
};

run();
