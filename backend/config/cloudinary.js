// const { S3Client } = require('@aws-sdk/client-s3');

// Cloudflare R2 is S3-compatible
// COMMENTED OUT - Will be implemented in Phase 4
/*
const r2Client = new S3Client({
  region: 'auto', // R2 uses 'auto' region
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

console.log('☁️  Cloudflare R2 client initialized');

module.exports = r2Client;
*/

// Temporary placeholder for Phase 4
module.exports = null;

console.log('⚠️  Cloudflare R2 disabled - Will be configured in Phase 4');
