const pgp = require('pg-promise')();
const connectionString = 'postgres://postgres:gre123@localhost:5432/login';
const db = pgp(connectionString);

//close all connections when the process is terminated
process.on('SIGTERM', () => {
    pgp.end();
});

module.exports = db;
