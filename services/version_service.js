var model = require('../models/ndr_nonndr_model');
const { createLogger, transports } = require('winston');
const { combine, timestamp, printf } = require('winston').format;
const fs = require('fs');
const path = require('path');

// status errors
var status_success = "success";
var status_error = "error";
var status_error_code = 400;
var status_success_code = 200;
var html_code;
var html_message;
var html_status;

// server errors
var something_error = "Something went wrong"

// version check
exports.version_service = async function (req, res, form_data) {
  var version = "1.0.8"
  url = ""
  function compare(ver1, ver2) {
    var str1 = ver1.toString();
    var str2 = ver2.toString();
    // console.log(str1.substr(0,str2.length).length>str2.substr(0,str2.length).length)
    // console.log(str1.substr(0,str1.length))
    // console.log(str2.substr(0,str2.length))
    if (str1.substr(0, str1.length) === str2.substr(0, str2.length)) {
      html_message = "version is up-to-date"
      url = ""
    }
    else if (str1.substr(0, str1.length) > str2.substr(0, str2.length)) {
      html_message = "update is available"
    }
    else if (str1.substr(0, str1.length) < str2.substr(0, str2.length)) {
      html_message = "version is invalid."
      url = ""
    } 

  }
  const logDirectory = path.join(__dirname, './../logs');
  var now = new Date();
  const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`; // Format it as "yyyy-mm-dd_hh:mm:ss"
   var user_id = form_data.id;
  const logFormat = printf(({ level, message, timestamp }) => {
    return `${message}`;
  });
  const logger = createLogger({
    level: 'info',
    format: combine(
      logFormat
    ),
    transports: [
      new transports.File({ filename: path.join(logDirectory, `${'check-version_' + user_id+"_"+formattedDate }.txt`
      ) })
    ]

  });
  try {
    logger.info('Paylod :- ' + JSON.stringify(req.body));
    compare(version, form_data.version)

    res.status(200).json({
      status_code: status_success_code,
      status: status_success,
      message: html_message,
      "is_update_required": 0,
      version: version,
      url: url
    })
    logger.info('Response :-');
		logger.info('status_code: ' + JSON.stringify(status_success_code) + '');
		logger.info('status: ' + JSON.stringify(status_success) + '');
		logger.info('message: ' + JSON.stringify(html_message) + '');
    logger.info('is_update_required: 0');
    logger.info('version: ' + JSON.stringify(version) + '');
    logger.info('url: ' + JSON.stringify(url) + '');
    logger.end();
  } catch (error) {
    // console.log(error)
    res.status(200).json({
      status_code: status_error_code,
      status: status_error,
      message: something_error
    })
    logger.info('error :-');
		logger.info(error);
    logger.end();
  }
}