const bcrypt = require('bcryptjs');
const password = 'admin123';

bcrypt.hash(password, 12).then(hash => {
  console.log('HASH:', hash);
  // Verify it works
  return bcrypt.compare(password, hash).then(match => {
    console.log('MATCH:', match);
    console.log('SQL:', `UPDATE users SET password_hash = '${hash}', secret_password_hash = '${hash}' WHERE username = 'admin';`);
  });
});
