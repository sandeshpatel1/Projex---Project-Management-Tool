const admin = require('firebase-admin');

// Firebase Admin SDK initialization
// The service account JSON is referenced from the environment variable
let serviceAccount;

try {
  // Option 1: path to service account JSON file
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  }
  // Option 2: inline JSON string in env (useful for deployment)
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    throw new Error('No Firebase service account configuration found in environment variables.');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin SDK initialized');
  }
} catch (err) {
  console.error('❌ Firebase Admin SDK initialization failed:', err.message);
  console.error('👉 Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in your .env');
  process.exit(1);
}

module.exports = admin;
