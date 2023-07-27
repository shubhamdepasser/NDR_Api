var mysql = require('mysql');

var pool  = mysql.createPool({
  host : 'prodrds.cludb0m2tt0c.ap-south-1.rds.amazonaws.com',
  user : 'ithinklo_nodejs',
  password : '27g(>&q[N8GY<4md',
  database : 'ithinklo_live_new1',
  //waitForConnections: true,
  port: 3306,
 queueLimit : 0, // unlimited queueing
 connectionLimit : 0 ,// unlimited connections
 multipleStatements : true,
 connectTimeout  : 60 * 60 * 1000,
  acquireTimeout  : 60 * 60 * 1000,
  timeout         : 60 * 60 * 1000,
  debug : true
});

pool.on('connection', function (connection) {
  console.log('MySQL DB Connection established');
});

pool.on('acquire', function (connection) {
  console.log('Connection %d acquired', connection.threadId);
});

pool.on('enqueue', function () {
  console.log('Waiting for available connection slot...');
});

pool.on('release', function (connection) {
  console.log('Connection %d released', connection.threadId);
});

module.exports = pool;