const fs = require('fs');
const path = require('path');

const folders = [
    "app/(auth)/login",
    "app/(auth)/register",
    "app/(dashboard)/dashboard",
    "app/(dashboard)/availability",
    "app/(dashboard)/events",
    "app/api/auth/[...nextauth]",
    "app/api/events",
    "app/api/availability",
    "app/api/calendar",
    "app/[username]/[eventType]",
    "components/auth",
    "components/dashboard",
    "components/booking",
    "components/ui",
    "lib/db",
    "lib/auth",
    "lib/validations",
    "lib/utils",
    "models",
    "types"
];

folders.forEach(folder => {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`✓ Created: ${folder}`);
});

console.log('\n✅ All folders created successfully!');