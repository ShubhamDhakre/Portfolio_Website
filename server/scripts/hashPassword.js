import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.log('\nUsage: node server/scripts/hashPassword.js <your_password>\n');
  console.log('Example: node server/scripts/hashPassword.js mySecurePass123\n');
  process.exit(1);
}

const saltRounds = 10;
bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }

  console.log('\n==================================================');
  console.log('ADMIN PASSWORD HASH GENERATED SUCCESSFULLY');
  console.log('==================================================\n');
  console.log(`Add this line to your .env file:\n`);
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
  console.log('==================================================\n');
});
