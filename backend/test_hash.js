const bcrypt = require('bcryptjs');
const hash = require('fs').readFileSync('C:/Users/Briann/Downloads/hash.txt', 'utf8').trim();
console.log('Hash from file:', hash);
bcrypt.compare('!Handler2026', hash).then(r => console.log('Match:', r));
