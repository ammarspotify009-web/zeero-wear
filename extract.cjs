const fs = require('fs');
const content = fs.readFileSync('../index.html', 'utf8');
const start = content.indexOf('<style>') + 7;
const end = content.indexOf('</style>');
const style = content.substring(start, end);
fs.writeFileSync('src/index.css', style);
console.log('CSS extracted');
