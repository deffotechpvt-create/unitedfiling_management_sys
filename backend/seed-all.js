// seed-all.js
const path = require('path');
const fs = require('fs');
const newman = require('newman');

const superAdminCollectionPath = path.join(__dirname, 'super_admin.json');
const adminCollectionPath = path.join(__dirname, 'admin.json');
const userCollectionPath = path.join(__dirname, 'user.json');

const superAdminCollection = JSON.parse(
    fs.readFileSync(superAdminCollectionPath, 'utf8')
);
const adminCollection = JSON.parse(
    fs.readFileSync(adminCollectionPath, 'utf8')
);
const userCollection = JSON.parse(
    fs.readFileSync(userCollectionPath, 'utf8')
);

// ---------------- SUPER_ADMIN scripts ----------------
function attachSuperAdminScripts(collection) {
    collection.item.forEach((item) => {
        if (!item.request) return;
        const url = item.request.url && item.request.url.raw;

        // Skip setup super admin
        if (item.name.startsWith('1. Setup Super Admin')) return;

        // Create admins
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
                            '  const id = json.admin.id;',
                            `  pm.collectionVariables.set('${varName}', id);`,
                            `  console.log('Set ${varName} =', id);`,
                            '}'
                        ]
                    }
                });
            }
        }

        // Create clients
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
                            'if (json.client && json.client.id) {',
                            '  const id = json.client.id;',
                            `  pm.collectionVariables.set('${varName}', id);`,
                            `  console.log('Set ${varName} =', id);`,
                            '}'
                        ]
                    }
                });
            }
        }
    });

    // Remove setup super admin request entirely
    collection.item = collection.item.filter(
        (item) => !item.name.startsWith('1. Setup Super Admin')
    );
}

// ---------------- ADMIN scripts ----------------
function attachAdminScripts(collection) {
    collection.item.forEach((item) => {
        if (!item.request) return;
        const url = item.request.url && item.request.url.raw;

        // Register users (Ananya, Karthik)
        if (url && url.includes('/api/auth/register') && item.request.method === 'POST') {
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
                            'if (json.user && json.user.id) {',
                            '  const id = json.user.id;',
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

// ---------------- USER scripts ----------------
function attachUserScripts(collection) {
    collection.item.forEach((item) => {
        if (!item.request) return;
        const url = item.request.url && item.request.url.raw;

        // Register Deepak
        if (url && url.includes('/api/auth/register') && item.request.method === 'POST') {
            const emailMatch = item.request.body?.raw?.match(/"email":\s*"([^"]+)"/);
            const email = emailMatch ? emailMatch[1] : '';
            if (email === 'deepak.rao@gmail.com') {
                item.event = item.event || [];
                item.event.push({
                    listen: 'test',
                    script: {
                        type: 'text/javascript',
                        exec: [
                            'const json = pm.response.json();',
                            'if (json.user && json.user.id) {',
                            '  const id = json.user.id;',
                            "  pm.collectionVariables.set('user_deepak_id', id);",
                            "  console.log('Set user_deepak_id =', id);",
                            '}'
                        ]
                    }
                });
            }
        }

        // Create Company 1 - capture company1_id
        if (
            url &&
            url.includes('/api/companies') &&
            item.request.method === 'POST' &&
            item.name.startsWith('3. Create Company 1')
        ) {
            item.event = item.event || [];
            item.event.push({
                listen: 'test',
                script: {
                    type: 'text/javascript',
                    exec: [
                        'const json = pm.response.json();',
                        'if (json.company && json.company.id) {',
                        '  const id = json.company.id;',
                        "  pm.collectionVariables.set('company1_id', id);",
                        "  console.log('Set company1_id =', id);",
                        '}'
                    ]
                }
            });
        }
    });
}

// Attach all scripts
attachSuperAdminScripts(superAdminCollection);
attachAdminScripts(adminCollection);
attachUserScripts(userCollection);

// Shared base env
const baseEnv = [
    { key: 'baseUrl', value: 'http://localhost:5000', enabled: true },
    { key: 'setupKey', value: 'your-super-secret-key-here-change-this', enabled: true }
];

console.log('▶ Running SUPER_ADMIN seed...');
newman.run(
    {
        collection: superAdminCollection,
        reporters: 'cli',
        environment: {
            name: 'Local',
            values: baseEnv
        }
    },
    (err, superSummary) => {
        if (err) {
            console.error('❌ SUPER_ADMIN seed failed:', err);
            process.exit(1);
        }

        const collVars =
            superSummary.collection && superSummary.collection.variables
                ? superSummary.collection.variables.members
                : [];
        console.log('SUPER collection vars:', collVars);

        const getVar = (k) => {
            const v = collVars.find((x) => x.key === k);
            return v ? v.value : '';
        };

        const client1Id = getVar('client1_id');
        const client5Id = getVar('client5_id');

        console.log('SUPER_ADMIN seed done. client1_id =', client1Id, ', client5_id =', client5Id);

        const adminEnv = [
            { key: 'baseUrl', value: 'http://localhost:5000', enabled: true },
            { key: 'client1_id', value: client1Id, enabled: true }
        ];

        console.log('▶ Running ADMIN seed...');
        newman.run(
            {
                collection: adminCollection,
                reporters: 'cli',
                environment: {
                    name: 'Local',
                    values: adminEnv
                }
            },
            (err2) => {
                if (err2) {
                    console.error('❌ ADMIN seed failed:', err2);
                    process.exit(1);
                }

                const userEnv = [
                    { key: 'baseUrl', value: 'http://localhost:5000', enabled: true },
                    { key: 'client5_id', value: client5Id, enabled: true }
                ];

                console.log('▶ Running USER seed...');
                newman.run(
                    {
                        collection: userCollection,
                        reporters: 'cli',
                        environment: {
                            name: 'Local',
                            values: userEnv
                        }
                    },
                    (err3) => {
                        if (err3) {
                            console.error('❌ USER seed failed:', err3);
                            process.exit(1);
                        }

                        console.log('✅ All seeding complete.');
                        process.exit(0);
                    }
                );
            }
        );
    }
);
