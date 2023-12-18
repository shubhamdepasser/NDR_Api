var model = require('../models/ndr_nonndr_model');
var widget = require('./widget')
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

// login error messages
var email_not_exist = "Email id does not exist.";
var email_pass_error = "Email id or password is invalid.";
var account_is_inctive = "Account is inactive. Try to contact Admin.";
var account_is_blocked = "Account is blocked. Try to contact Admin.";
var id_is_invalid = "id is invalid";
var access_denied = "Access Denied";
var Please_login = "Session Expired Please login";

// ndr error messages
var invalid_module_message = "Invalid module type";

// server errors
var something_error = "Something went wrong"
var error_occured = "An errror occured..!!"

// ndr and nonndr time submit
exports.ndr_time_submit = async function (req, res, form_data) {
	// console.log("inside service ndr_time_submit");
	var check_ndr_time_status;
	var update_ndr_datetime;
	var check_ndr_time_status_case = "";
	var query = "";
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
			new transports.File({
				filename: path.join(logDirectory,
					`${'ndr-time-submit_' + user_id + "_" + formattedDate}.txt`
				)
			})
		]

	});
	try {
		logger.info('Paylod :- ' + JSON.stringify(req.body));
		if (form_data.module_type == 0 || form_data.module_type == 1 || form_data.module_type == 2) 
		{
			// var now  = new Date();
			check_ndr_time_status = await model.check_ndr_time_status(form_data);
			check_ndr_time_status_case = await widget.check_ndr_time_status_case(form_data, check_ndr_time_status);
			//   res.status(200).json({
			// 	message:check_ndr_time_status_case[0].query,
			// 	check_ndr_time_status:check_ndr_time_status
			// 	})
			// 	return
			if (check_ndr_time_status_case[0].query == "") {
				html_status = status_error
				html_code = status_error_code;
				html_message = check_ndr_time_status_case[0].message;
			}
			else {
				query = check_ndr_time_status_case[0].query;
				update_ndr_datetime = await model.update_ndr_datetime(query);
				html_status = status_success;
				html_code = status_success_code;
				html_message = check_ndr_time_status_case[0].message;
			}
		}
		else {
			html_status = status_error
			html_code = status_error_code;
			html_message = invalid_module_message;
		}

		res.status(200).json({
			status_code: html_code,
			status: html_status,
			message: html_message,
		})
		logger.info('Response :-');
		logger.info('status_code: ' + JSON.stringify(html_code) + '');
		logger.info('status: ' + JSON.stringify(html_status) + '');
		logger.info('message: ' + JSON.stringify(html_message) + '');
		logger.end();
	} catch (error) {
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