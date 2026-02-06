// seed-admin.js
const fs = require('fs');
const path = require('path');
const newman = require('newman');

const collectionPath = path.join(__dirname, 'admin.json');
const rawCollection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Attach dynamic scripts (same style as super_admin.js)
function attachScripts(collection) {
  collection.item.forEach((item) => {
    if (!item.request) return;

    const url = item.request.url && item.request.url.raw;

    // Register User requests (Ananya, Karthik)
    if (
      url &&
      url.includes('/api/auth/register') &&
      item.request.method === 'POST'
    ) {
      const emailMatch = item.request.body?.raw?.match(/"email":\s*"([^"]+)"/);
      const email = emailMatch ? emailMatch[1] : '';

      let varName = '';
      if (email === 'ananya.iyer@techcorp.com') varName = 'user1_id';
      if (email === 'karthik.suresh@techcorp.com') varName = 'user2_id';

      if (varName) {
        item.event = item.event || [];
        item.event.push({
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'const json = pm.response.json();',
              'if (json.user && (json.user.id || json.user._id)) {',
              '  const id = json.user.id || json.user._id;',
              `  pm.collectionVariables.set('${varName}', id);`,
              `  console.log('Set ${varName} =', id);`,
              '}'
            ]
          }
        });
      }
    }

    // You can add more patterns here if needed (e.g., capture company ids)
    // Example for company create:
    // if (url && url.includes('/api/companies') && item.request.method === 'POST') { ... }
  });
}

attachScripts(rawCollection);

newman.run(
  {
    collection: rawCollection,
    reporters: 'cli',
    environment: {
      name: 'Local',
      values: [
        { key: 'baseUrl', value: 'http://localhost:5000', enabled: true },
        // client1_id is read from collection variable; if you prefer env:
        { key: 'client1_id', value: process.env.CLIENT1_ID || '', enabled: true }
      ]
    }
  },
  (err, summary) => {
    if (err) {
      console.error('❌ ADMIN seed run failed:', err);
      process.exit(1);
    }

    console.log('✅ ADMIN seed run completed');

    // Optional: log collection variables after run
    const collVars = summary.collection && summary.collection.variables
      ? summary.collection.variables.members
      : [];
    console.log('Collection vars after run:', collVars);

    process.exit(0);
  }
);
