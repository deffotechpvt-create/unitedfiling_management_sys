// seed-super-admin.js
const fs = require('fs');
const path = require('path');
const newman = require('newman');

const collectionPath = path.join(__dirname, 'super_admin.json');
const rawCollection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// 1) Remove the Setup Super Admin request (index 0)
rawCollection.item = rawCollection.item.filter(
  (item) => !item.name.startsWith('1. Setup Super Admin')
);

// 2) Add scripts to capture IDs from responses
function attachScripts(collection) {
  collection.item.forEach((item) => {
    if (!item.request) return;

    const url = item.request.url && item.request.url.raw;

    // Create Admin requests
    if (url && url.includes('/api/users/admins') && item.request.method === 'POST') {
      const emailMatch = item.request.body?.raw?.match(/"email":\s*"([^"]+)"/);
      const email = emailMatch ? emailMatch[1] : '';

      let varName = '';
      if (email === 'rajesh.kumar@unitedfillings.com') varName = 'admin1_id';
      if (email === 'priya.sharma@unitedfillings.com') varName = 'admin2_id';
      if (email === 'amit.patel@unitedfillings.com') varName = 'admin3_id';

      if (varName) {
        item.event = item.event || [];
        item.event.push({
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'const json = pm.response.json();',
              'if (json.admin && json.admin.id) {',
              `  pm.collectionVariables.set('${varName}', json.admin.id);`,
              `  console.log('Set ${varName} =', json.admin.id);`,
              '}'
            ]
          }
        });
      }
    }

    // Create Client requests
    if (url && url.includes('/api/clients') && item.request.method === 'POST') {
      const emailMatch = item.request.body?.raw?.match(/"email":\s*"([^"]+)"/);
      const email = emailMatch ? emailMatch[1] : '';

      let varName = '';
      if (email === 'vikram@techcorp.com') varName = 'client1_id';
      if (email === 'sneha@innovatetech.com') varName = 'client2_id';
      if (email === 'arjun@globalent.com') varName = 'client3_id';
      if (email === 'kavya@alphatrading.com') varName = 'client4_id';
      if (email === 'rohit@digitaldynamics.com') varName = 'client5_id';

      if (varName) {
        item.event = item.event || [];
        item.event.push({
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'const json = pm.response.json();',
              'if (json.client && (json.client.id || json.client._id)) {',
              '  const id = json.client.id || json.client._id;',
              `  pm.collectionVariables.set('${varName}', id);`,
              `  console.log('Set ${varName} =', id);`,
              '}'
            ]
          }
        });
      }
    }
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
        { key: 'setupKey', value: 'your-super-secret-key-here-change-this', enabled: true }
      ]
    }
  },
  (err, summary) => {
    if (err) {
      console.error('❌ Seed run failed:', err);
      process.exit(1);
    }

    console.log('✅ Seed run completed');

    // Print stored variables
    const vars = summary.environment ? summary.environment.values : [];
    console.log('Environment vars:', vars);

    process.exit(0);
  }
);
