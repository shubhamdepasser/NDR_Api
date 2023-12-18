//const mongoose = require('mongoose');
const dotenv = require('dotenv');
var express = require('express');
var router = express.Router();
dotenv.config({
    path: './config.env'
});
var debug = require('debug')('mean-app:server');
var http = require('http');
const fs = require('fs');

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION!!! config shutting down...');
    console.log(err.name, err.message);
 
    process.exit(1);
});

const app = require('./app');

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION!!!  port shutting down ...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
var port = process.env.PORT;
app.set('port', port);

var server =  http.createServer(app);
server.listen(port);
server.on('listening', onListening);


function onListening() {
  var addr = server.address();
  debug('Listening on ' + port);
}