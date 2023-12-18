const validator = require('validator');
const bcrypt = require('bcryptjs');
var express = require('express');
var mysqlpool = require('../dbconfig');
const {
	promisify
} = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
var session = require('express-session');
const app = express();
const md5 = require('md5');
const date = require('date-and-time');
var randomize = require('randomatic');
var decode = require('decode-html');
const nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');
var htmlspecialchars = require('htmlspecialchars');
var model = require('../models/ndr_nonndr_model');
const { json } = require('body-parser');
var http = require("http")
var querystring = require("querystring")
var request = require("request")
const { createLogger, transports } = require('winston');
const { combine, timestamp, printf } = require('winston').format;
const fs = require('fs');
const path = require('path');

exports.login_user = async function (form_data, req, res, next) {
	const logDirectory = path.join(__dirname, './../logs');
	var now = new Date();
	const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`; // Format it as "yyyy-mm-dd_hh:mm:ss"
	const logFormat = printf(({ level, message, timestamp }) => {
		return `${message}`;
	});
	const logger = createLogger({
		level: 'info',
		format: combine(
			logFormat
		),
		transports: [
			new transports.File({ filename: path.join(logDirectory, `${'login_' + form_data.email+"_"+formattedDate }.txt`) })
		]

	});
	try {
		
	logger.info('Paylod :- ' + JSON.stringify(req.body));
	var userdata = [];
	userdata = await User.login_user(form_data);
	//console.log(userdata);
	if (userdata.length == 0) {
		res.status(200).json({
			status_code: 400,
			status: 'error',
			message: "Email id does not exist.",
		});
		logger.info('Response :-');
		logger.info('status_code: 400');
		logger.info('status: error');
		logger.info('message: Email id does not exist.');
		logger.end();
		return;
	}
	else {
		var user_data_array = [];
		var reasons_array = [];
		const map = new Map();
		for (const user of userdata) {
			var db_user_email = user.email.toLowerCase();
			var formdata_user_email = form_data.email.toLowerCase();
			var db_user_password = user.password;
			var formdata_user_password = md5(form_data.password);
			var user_id = user.id
			var mobile_token_exp_date = user.mobile_token_exp_date;
			var mobile_access_token = user.mobile_access_token;
			const pattern = date.compile('YYYY-MM-DD');
			const now = new Date();
			var current_date = date.format(now, pattern);
			if ('0000-00-00' === mobile_token_exp_date) {
				mobile_token_exp_date = mobile_token_exp_date;
			}
			else {
				mobile_token_exp_date = date.format(mobile_token_exp_date, pattern);
			}


			if (mobile_token_exp_date > current_date) {

				mobile_access_token = mobile_access_token;
				mobile_token_exp_date = mobile_token_exp_date;

			}
			else {
				mobile_access_token = md5(randomize('*', 30)).substr(0, 30);
				mobile_token_exp_date = date.format(date.addYears(now, 1), pattern);
				console.log(mobile_token_exp_date)
				console.log(current_date)

			}
			if (db_user_email == formdata_user_email && db_user_password == formdata_user_password) {
				if (user.status == 1 || user.status == 0) {
					map.set(db_user_email, true);    // set any value to Map
					user_data_array.push({
						user_id: user.id,
						first_name: decode(user.first_name),
						last_name: decode(user.last_name),
						user_name: decode(user.user_name),
						user_type: user.user_type,
						email: decode(user.email),
						gender: decode(user.gender),
						date_of_birth: decode(user.date_of_birth),
						profile_pic: decode(user.profile_pic),
						mobile: user.mobile,
						mobile_verify: user.mobile_verify,
						email_verify: user.email_verify,
						status: user.status,
						mobile_access_token: mobile_access_token,
						mobile_token_exp_date: mobile_token_exp_date,
						aws_key_app: 'AKIAQG3FDVKGE4NISC5K',
						aws_sceret_app: 'Y7a5N/9pUYB9jI9cdfN0gE7v/yZFpDyXSHnH65Dw'
					});
					reasons_array = [
						{
							"reason_id": 1,
							"hold_reason": "Morning Tea Breakfast Break",
						},
						{
							"reason_id": 2,
							"hold_reason": "Lunch Break",
						},
						{
							"reason_id": 3,
							"hold_reason": "Evening Tea Break",
						},
					]


					var update_last_login_and_mobile_access_token = await User.update_last_login_and_mobile_access_token(user_id, mobile_access_token, mobile_token_exp_date, current_date);

					var insert_user_login_details_query = await User.insert_user_login_details_query(user_id, current_date, '1');

					res.status(200).json({
						status_code: 200,
						status: 'success',
						message: "Login successful",
						user: user_data_array,
						reasons_array: reasons_array
					});
					logger.info('Response :-');
					logger.info('status_code: 200');
					logger.info('status: success');
					logger.info('message: Login successful');
					logger.info('user: ' + JSON.stringify(user_data_array) + '');
					logger.info('reasons_array: ' + JSON.stringify(reasons_array) + '');
					logger.end();
					return;
				}
				else if (user.status == 2) {
					res.status(200).json({
						status_code: 400,
						status: 'error',
						message: "Account is blocked. Try to contact Admin.",
					});
					logger.info('Response :-');
					logger.info('status_code: 400');
					logger.info('status: error');
					logger.info('message: Account is blocked. Try to contact Admin.');
					logger.end();
					return;
				}
				else {
					console.log("user status error");
					res.status(200).json({
						status_code: 400,
						status: 'error',
						message: "Some Error Occured! Try again later.",
					});
					logger.info('Response :-');
					logger.info('status_code: 400');
					logger.info('status: error');
					logger.info('message: Some Error Occured! Try again later.');
					logger.end();
					return;
				}
			}
			else {

				res.status(200).json({
					status_code: 400,
					status: 'error',
					message: "Email id & password does not match.",
				});
					logger.info('Response :-');
					logger.info('status_code: 400');
					logger.info('status: error');
					logger.info('message: Email id & password does not match.');
					logger.end();
				return;
			}
		}

	}
	} catch (error) {
		res.status(200).json({
			status_code: 400,
			status: 'error',
			message: "Some Error Occured! Try again later.",
		});
		logger.info('error :- ');
		logger.info(error);
		logger.end();
		return;
	}
	

};
function secondsToHoursMinutesAndSeconds(seconds) {
	const hours = Math.floor(seconds / 3600);
	const remainingSecondsAfterHours = seconds % 3600;
	const minutes = Math.floor(remainingSecondsAfterHours / 60);
	const remainingSeconds = remainingSecondsAfterHours % 60;

	return { hours, minutes, remainingSeconds };
}

exports.view_call_summary_count = async function (form_data, req, res, next) {
	const logDirectory = path.join(__dirname, './../logs');
	var now = new Date();
	const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`; // Format it as "yyyy-mm-dd_hh:mm:ss"
	var user_id = htmlspecialchars(form_data.id);
	const logFormat = printf(({ level, message, timestamp }) => {
		return `${message}`;
	});
	const logger = createLogger({
		level: 'info', 
		format: combine(
			logFormat
		),
		transports: [
			new transports.File({ filename: path.join(logDirectory, 
				`${'view-call-summary-count_' + user_id+"_"+formattedDate }.txt`
				) })
		]

	});
	try {
		
	logger.info('Paylod :- ' + JSON.stringify(req.body));
	var version = "1.0.7";
	if (form_data.version == undefined || form_data.version == null || form_data.version == "") {
		form_data.version = "1.0.7"
	}
	var call_summary_count_array = [];
	var check_ndr_time_status;
	var call_summary_count = await User.view_call_summary_count(form_data);
	if (form_data.module_type == undefined || form_data.module_type == null || form_data.module_type == "") {
		check_ndr_time_status = await model.check_ndr_nonndr_event_status(form_data, 1);
	}
	else {
		check_ndr_time_status = await model.check_ndr_time_status(form_data);

	}

	const { hours, minutes, remainingSeconds } = secondsToHoursMinutesAndSeconds(call_summary_count[0].todays_total_call_duration);

	var event_type = "";
	for (const call_summary of call_summary_count) {
		if (form_data.version.substr(0, form_data.version.length) > version.substr(0, version.length)) {

			call_summary_count_array.push({
				total_count: call_summary.total_count,
				todays_total_call_duration: hours + " hrs " + minutes + " min " + remainingSeconds + " sec",
				today_count: JSON.stringify(call_summary.today_attended_count),
				Yesterday_count: call_summary.yesterday_attended_count + " - " + call_summary.Yesterday_count,
			});
		}
		else {

			call_summary_count_array.push({
				total_count: call_summary.total_count,
				todays_total_call_duration: hours + " hrs " + minutes + " min " + remainingSeconds + " sec",
				today_count: call_summary.today_attended_count + " - " + call_summary.today_count,
				Yesterday_count: call_summary.yesterday_attended_count + " - " + call_summary.Yesterday_count,
			});
		}
	}
	console.log(call_summary_count_array);
	if (call_summary_count.length > 0) {
		event_type = check_ndr_time_status.length == 0 ? "" : check_ndr_time_status[0].event_type
		res.status(200).json({
			status_code: 200,
			status: 'success',
			call_summary_count: call_summary_count_array,
			event_type: event_type
		});
		logger.info('Response :-');
		logger.info('status_code: 200');
		logger.info('status: success');
		logger.info('call_summary_count: ' + JSON.stringify(call_summary_count_array) + '');
		logger.info('event_type: ' + JSON.stringify(event_type) + '');
		logger.end();
		return;
	}
	else {
		res.status(200).json({
			status_code: 400,
			status: 'error',
			message: "Invalid request.."
		});
		logger.info('Response :-');
		logger.info('status_code: 400');
		logger.info('status: error');
		logger.info('message: Invalid request..');
		logger.end();
		return;
	}
	} catch (error) {
		res.status(200).json({
			status_code: 400,
			status: 'error',
			message: "Some Error Occured! Try again later.",
		});
		logger.info("error :- ");
		logger.info(error);
		logger.end();
		return;
	}

};

exports.view_call_status_count = async function (form_data, req, res, next) {
	const logDirectory = path.join(__dirname, './../logs');
	var now = new Date();
	const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`; // Format it as "yyyy-mm-dd_hh:mm:ss"
	var user_id = htmlspecialchars(form_data.id);
	const logFormat = printf(({ level, message, timestamp }) => {
		return `${message}`;
	});
	const logger = createLogger({
		level: 'info',
		format: combine(
			logFormat
		),
		transports: [
			new transports.File({ filename: path.join(logDirectory,
				
				`${'view-call-status-count_' + user_id+"_"+formattedDate }.txt`) })
		]

	});
	try {
		
	logger.info('Payload :- ' + JSON.stringify(req.body));
	var version = "1.0.7";
	if (form_data.version == undefined || form_data.version == null || form_data.version == "") {
		form_data.version = "1.0.7"
	}
	var call_status_count_array = [];
	var call_status_count = await User.view_call_status_count(form_data);
	for (const call_status of call_status_count) {
		if (form_data.version.substr(0, form_data.version.length) > version.substr(0, version.length)) {

			call_status_count_array.push({
				total_count: " " + call_status.total_count,
				new_count: "",
				ringing_count: JSON.stringify(call_status.todays_attended_ringing_count),
				reschedule_Call_count: JSON.stringify(call_status.todays_attended_reschedule_call_count),
				reattempt_count: JSON.stringify(call_status.todays_attended_reattempt_count),
				RTO_count: JSON.stringify(call_status.todays_attended_rto_count),
				other_count: JSON.stringify(call_status.todays_attended_other_count),
				close_count: JSON.stringify(call_status.todays_attended_close_count),
			});
		}
		else {
			call_status_count_array.push({
				total_count: " " + call_status.total_count,
				new_count: call_status.todays_attended_new_count + ' - ' + call_status.new_count,
				ringing_count: call_status.todays_attended_ringing_count + ' - ' + call_status.ringing_count,
				reschedule_Call_count: call_status.todays_attended_reschedule_call_count + ' - ' + call_status.reschedule_call_count,
				reattempt_count: call_status.todays_attended_reattempt_count + ' - ' + call_status.reattempt_count,
				RTO_count: call_status.todays_attended_rto_count + ' - ' + call_status.rto_count,
				other_count: call_status.todays_attended_other_count + ' - ' + call_status.other_count,
				close_count: call_status.todays_attended_close_count + ' - ' + call_status.close_count,
			});
		}
	}

	if (call_status_count.length > 0) {
		res.status(200).json({
			status_code: 200,
			status: 'success',
			call_status_count: call_status_count_array
		});
		logger.info('Response :-');
		logger.info('status_code: 200');
		logger.info('status: success');
		logger.info('call_status_count: ' + JSON.stringify(call_status_count_array) + '');
		logger.end();
		return;
	}
	else {
		res.status(200).json({
			status_code: 400,
			status: 'error',
			message: "Invalid request.."
		});
		logger.info('Response :-');
		logger.info('status_code: 400');
		logger.info('status: error');
		logger.info('message: Invalid request..');
		logger.end();
		return;
	}

	} catch (error) {
		res.status(200).json({
			status_code: 400,
			status: 'error',
			message: "Some Error Occured! Try again later.",
		});
		logger.info("error :- ");
		logger.info(error);
		logger.end();
		return;
	}
};

exports.view_call_details_pagination = async function (form_data, req, res, next) {
	const logDirectory = path.join(__dirname, './../logs');
	var now = new Date();
	const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`; // Format it as "yyyy-mm-dd_hh:mm:ss"
	var user_id = htmlspecialchars(form_data.id);
	const logFormat = printf(({ level, message, timestamp }) => {
		return `${message}`;
	});
	const logger = createLogger({
		level: 'info',
		format: combine(
			logFormat
		),
		transports: [
			new transports.File({ filename: path.join(logDirectory,
				`${'view-call-details2_' + user_id+"_"+formattedDate }.txt`
				) })
		]

	});
	try {
		logger.info('Payload :- ' + JSON.stringify(req.body));
	var version = "1.0.7";
	var version_6 = "1.0.6";
	if (form_data.version == undefined || form_data.version == null || form_data.version == "") {
	form_data.version = "1.0.7"
	}
	var remark_id_from_data = form_data.remark_id;
	var page = form_data.page;
	var is_more_data = 0;
	var last_limit = (Number(page) + 1) * 50;;
	if (page != '') {
		last_limit = (Number(page) + 1) * 50;
	}
	else {
		last_limit = 50;
	}
	var call_status_array = [];
	var call_details = await User.view_call_details_pagination(form_data);
	var get_total_count = await User.view_call_details_get_count(form_data);
	console.log(get_total_count[0].total);
	if (last_limit < get_total_count[0].total && last_limit != get_total_count[0].total) {
		is_more_data = 1;
	}
	else {
		is_more_data = 0;
	}
	console.log(call_details);
	const pattern = date.compile('DD-MM-YYYY');
	const pattern2 = date.compile('DD-MM-YYYY hh:mm A');
	var current_date = date.format(now, pattern);
	var set_mobile = 0;
	var set_mobile_number = '';
	if(form_data.version.substr(0, form_data.version.length) > version.substr(0, version.length)&& form_data.remark_id == 0) 
	{
		var options = {
			'method': 'POST',
			'url': 'https://my.ithinklogistics.com/ndr_call_api_v3/ndr_calls/get.json',
			'headers': {
				'Content-Type': 'application/json',
				'Cookie': 'PHPSESSID=mdbejqqfclb7i2n883kij7otsk'
			},
			body: JSON.stringify({
				"access_token": "90739f2b646c6362e0c332bf0e01c3fd",
				"secret_key": "53d21009aad5b50487956953096c2027",
				"user_id": form_data.id
			})

		};
		request(options, async function (error, response) {
			if (error) throw new Error(error);
			res.status(200).json(JSON.parse(response.body));
			logger.info('Response :-');
			logger.info(JSON.stringify(response.body));
			logger.end();

		});

		return
	}
	for (const call_detail of call_details) {
		if (set_mobile == 0) {
			set_mobile_number = '8097228680';
			set_mobile = 1;
		}
		else {
			set_mobile_number = '8097228680';
			set_mobile = 0;
		}
		if (call_detail.total_attempt <= 3) {

			if (form_data.version.substr(0, form_data.version.length) > version.substr(0, version.length)) {
				if (parseInt(form_data.remark_id) != 0) {
					
					call_status_array.push(
						{
							id: call_detail.id,
							remark_id: call_detail.remark_id == null ? '' : call_detail.remark_id,
							recording_file: call_detail.recording_file == null ? '' : call_detail.recording_file,
							first_name: call_detail.first_name == null ? '' : call_detail.first_name,
							last_name: call_detail.last_name == null ? '' : call_detail.last_name,
							user_id: call_detail.user_id == null ? '' : call_detail.user_id,
							airway_bill_no: call_detail.airway_bill_no == null ? '' : call_detail.airway_bill_no,
							customer_name: call_detail.customer_name == null ? '' : call_detail.customer_name + '-(' + call_detail.id + ')',
							customer_mobile: call_detail.customer_mobile == null ? '' : validate_mobile_numbers(call_detail.customer_mobile),//call_detail.customer_mobile,8097228680
							final_order_total: call_detail.final_order_total == null ? '0' : call_detail.final_order_total,
							order_type: call_detail.order_type == null ? '' : call_detail.order_type.toUpperCase() + '  $  ' + call_detail.customer_address + ', ' + call_detail.pincode + ', ' + call_detail.customer_city + '-' + call_detail.customer_state + ',' + call_detail.customer_country,
							ndr_visit_count: call_detail.ndr_visit_count == null ? '' : call_detail.ndr_visit_count,
							last_inscan_datetime: call_detail.last_inscan_datetime == null ? '' : date.format(new Date(call_detail.last_inscan_datetime), pattern),
							company_name: call_detail.store_name != null ? call_detail.store_name : call_detail.vendor_website != '' ? call_detail.vendor_website : call_detail.company_name == null ? '' : call_detail.company_name,
							last_call_date: call_detail.modified_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.modified_date, pattern2),
							total_attempt: call_detail.total_attempt == null ? '' : call_detail.total_attempt,
							is_calling: call_detail.remark_id != 2 ? 1 : call_detail.reschedule_date == '0000-00-00 00:00:00' ? 1 : date.format(call_detail.reschedule_date, pattern) == current_date ? 1 : 0,
							reschedule_date: call_detail.reschedule_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.reschedule_date, pattern),
							reattempt_date: call_detail.reattempt_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.reattempt_date, pattern),
							is_record_playing: 0,
							"call_details_array":
								[

									{
										"priority": 1,
										"is_show": 0,
										"name": "Total Attempt",
										"value": call_detail.total_attempt == null ? '' : call_detail.total_attempt
									},

									{
										"priority": 2,
										"is_show": 0,
										"name": "Customer Name",
										"value": call_detail.customer_name == null ? '' : call_detail.customer_name + '-(' + call_detail.id + ')'
									},
									{
										"priority": 3,
										"is_show": 0,
										"name": "Mobile Number",
										"value": call_detail.customer_mobile == null ? '' : validate_mobile_numbers(call_detail.customer_mobile)
									},
									{
										"priority": 4,
										"is_show": 0,
										"name": "Last Call Date",
										"value": call_detail.modified_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.modified_date, pattern2)
									},
								],
							"info_array": [

								{
									"priority": 1,
									"is_show": 0,
									"name": "Seller Name",
									"value": call_detail.store_name != null ? call_detail.store_name : call_detail.vendor_website != '' ? call_detail.vendor_website : call_detail.company_name == null ? '' : call_detail.company_name
								},
								{
									"priority": 2,
									"is_show": 0,
									"name": "AWB NO",
									"value": call_detail.airway_bill_no == null ? '' : call_detail.airway_bill_no
								},
								{
									"priority": 5,
									"is_show": 0,
									"name": "Customer Name",
									"value": call_detail.customer_name == null ? '' : call_detail.customer_name + '-(' + call_detail.id + ')'
								},
								{
									"priority": 6,
									"is_show": 0,
									"name": "Mobile Number",
									"value": call_detail.customer_mobile == null ? '' : validate_mobile_numbers(call_detail.customer_mobile)
								},
								{
									"priority": 7,
									"is_show": 0,
									"name": "Product Name",
									"value": call_detail.product_description == null ? '' : call_detail.product_description
								},
								{
									"priority": 8,
									"is_show": 0,
									"name": "Order Type",
									"value": call_detail.order_type == null ? '' : call_detail.order_type.toUpperCase() + ' $ ' + call_detail.customer_address + ', ' + call_detail.pincode + ', ' + call_detail.customer_city + '-' + call_detail.customer_state + ',' + call_detail.customer_country
								},
								{
									"priority": 9,
									"is_show": 0,
									"name": "Amount",
									"value": call_detail.final_order_total == null ? '0' : call_detail.final_order_total
								},
								{
									"priority": 10,
									"is_show": 0,
									"name": "Dispatch Count",
									"value": call_detail.ndr_visit_count == null ? '' : call_detail.ndr_visit_count
								},
								{
									"priority": 11,
									"is_show": 0,
									"name": "Last Scan Date",
									"value": call_detail.last_inscan_datetime == null ? '' : date.format(new Date(call_detail.last_inscan_datetime), pattern)
								},
								{
									"priority": 12,
									"is_show": 0,
									"name": "Last Call Date",
									"value": call_detail.modified_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.modified_date, pattern2)
								},
								{
									"priority": 13,
									"is_show": 0,
									"name": "NDR Remarks",
									"value": call_detail.ndr_remark == null ? '' : call_detail.ndr_remark
								},
								{
									"priority": 14,
									"is_show": 0,
									"name": "Other Remark",
									"value": call_detail.other_remarks == null ? '' : call_detail.other_remarks
								},
								{
									"priority": 3,
									"is_show": 0,
									"name": "Order ID",
									"value": call_detail.order_id == null ? '' : call_detail.order_id
								},
								{
									"priority": 4,
									"is_show": 0,
									"name": "Order Date",
									"value": call_detail.order_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.order_date, pattern2)
								},
							],
						});
				}

			}
			else {
				if (form_data.version.substr(0, form_data.version.length) === version_6.substr(0, version_6.length)) 
				{

				call_status_array.push({
					id: call_detail.id,
					remark_id: call_detail.remark_id == null ? '' : call_detail.remark_id,
					recording_file: call_detail.recording_file == null ? '' : call_detail.recording_file,
					first_name: call_detail.first_name == null ? '' : call_detail.first_name,
					last_name: call_detail.last_name == null ? '' : call_detail.last_name,
					user_id: call_detail.user_id == null ? '' : call_detail.user_id,
					airway_bill_no: call_detail.airway_bill_no == null ? '' : call_detail.airway_bill_no,
					customer_name: call_detail.customer_name == null ? '' : call_detail.customer_name + '-(' + call_detail.id + ')',
					customer_mobile: call_detail.customer_mobile == null ? '' : validate_mobile_numbers(call_detail.customer_mobile),//call_detail.customer_mobile,8097228680
					product_description: call_detail.product_description == null ? '' : call_detail.product_description,
					final_order_total: call_detail.final_order_total == null ? '0' : call_detail.final_order_total,
					order_type: call_detail.order_type == null ? '' : call_detail.order_type.toUpperCase() + '  $  ' + call_detail.customer_address + ', ' + call_detail.pincode + ', ' + call_detail.customer_city + '-' + call_detail.customer_state + ',' + call_detail.customer_country,
					ndr_visit_count: call_detail.ndr_visit_count == null ? '' : call_detail.ndr_visit_count,
					last_inscan_datetime: call_detail.last_inscan_datetime == null ? '' : date.format(new Date(call_detail.last_inscan_datetime), pattern),
					company_name: call_detail.store_name != null ? call_detail.store_name : call_detail.vendor_website != '' ? call_detail.vendor_website : call_detail.company_name == null ? '' : call_detail.company_name,
					ndr_remark: call_detail.ndr_remark == null ? '' : call_detail.ndr_remark,
					other_remarks: call_detail.other_remarks == null ? '' : call_detail.other_remarks,
					last_call_date: call_detail.modified_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.modified_date, pattern2),
					ndr_remark: call_detail.ndr_remark == null ? '' : call_detail.ndr_remark,
					total_attempt: call_detail.total_attempt == null ? '' : call_detail.total_attempt,
					is_calling: call_detail.remark_id != 2 ? 1 : call_detail.reschedule_date == '0000-00-00 00:00:00' ? 1 : date.format(call_detail.reschedule_date, pattern) == current_date ? 1 : 0,
					reschedule_date: call_detail.reschedule_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.reschedule_date, pattern),
					reattempt_date: call_detail.reattempt_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.reattempt_date, pattern),
					rto_remark: call_detail.rto_remarks == '' ? '' : call_detail.rto_remarks,
					order_id :call_detail.order_id == null ? '' : call_detail.order_id,
					order_date: call_detail.order_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.order_date, pattern2),
					is_record_playing: 0,
				})
			}
			else
			{
				call_status_array.push({
					id: call_detail.id,
					remark_id: call_detail.remark_id == null ? '' : call_detail.remark_id,
					recording_file: call_detail.recording_file == null ? '' : call_detail.recording_file,
					first_name: call_detail.first_name == null ? '' : call_detail.first_name,
					last_name: call_detail.last_name == null ? '' : call_detail.last_name,
					user_id: call_detail.user_id == null ? '' : call_detail.user_id,
					airway_bill_no: call_detail.airway_bill_no == null ? '' : call_detail.airway_bill_no,
					customer_name: call_detail.customer_name == null ? '' : call_detail.customer_name + '-(' + call_detail.id + ')',
					customer_mobile: call_detail.customer_mobile == null ? '' : validate_mobile_numbers(call_detail.customer_mobile),//call_detail.customer_mobile,8097228680
					product_description: call_detail.product_description == null ? '' : call_detail.product_description,
					final_order_total: call_detail.final_order_total == null ? '0' : call_detail.final_order_total,
					order_type: call_detail.order_type == null ? '' : call_detail.order_type.toUpperCase() + '  $  ' + call_detail.customer_address + ', ' + call_detail.pincode + ', ' + call_detail.customer_city + '-' + call_detail.customer_state + ',' + call_detail.customer_country,
					ndr_visit_count: call_detail.ndr_visit_count == null ? '' : call_detail.ndr_visit_count,
					last_inscan_datetime: call_detail.last_inscan_datetime == null ? '' : date.format(new Date(call_detail.last_inscan_datetime), pattern),
					company_name: call_detail.store_name != null ? call_detail.store_name : call_detail.vendor_website != '' ? call_detail.vendor_website : call_detail.company_name == null ? '' : call_detail.company_name,
					ndr_remark: call_detail.ndr_remark == null ? '' : call_detail.ndr_remark,
					other_remarks: call_detail.other_remarks == null ? '' : call_detail.other_remarks,
					last_call_date: call_detail.modified_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.modified_date, pattern2),
					ndr_remark: call_detail.ndr_remark == null ? '' : call_detail.ndr_remark,
					total_attempt: call_detail.total_attempt == null ? '' : call_detail.total_attempt,
					is_calling: call_detail.remark_id != 2 ? 1 : call_detail.reschedule_date == '0000-00-00 00:00:00' ? 1 : date.format(call_detail.reschedule_date, pattern) == current_date ? 1 : 0,
					reschedule_date: call_detail.reschedule_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.reschedule_date, pattern),
					reattempt_date: call_detail.reattempt_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.reattempt_date, pattern),
					rto_remark: call_detail.rto_remarks == '' ? '' : call_detail.rto_remarks,
					is_record_playing: 0,
				})
			}
			}




		}
	}

	if (call_details.length > 0) {
		res.status(200).json({
			status_code: 200,
			status: 'success',
			remark_id: remark_id_from_data,
			call_details: call_status_array,
			is_more_data: is_more_data,
			total: get_total_count[0].total,
			last_limit: last_limit
		});
		logger.info('Response :-');
		logger.info('status_code: 200');
		logger.info('status: success');
		logger.info('remark_id: ' + JSON.stringify(remark_id_from_data) + '');
		logger.info('call_details: ' + JSON.stringify(call_status_array) + '');
		logger.info('is_more_data: ' + JSON.stringify(is_more_data) + '');
		logger.info('total: ' + JSON.stringify(get_total_count[0].total) + '');
		logger.info('last_limit: ' + JSON.stringify(last_limit) + '');
		logger.end();
		return;
	}
	else {
		res.status(200).json({
			status_code: 400,
			status: 'error',
			message: "Invalid request..",
			call_details: [],
			is_more_data: is_more_data
		});
		logger.info('Response :-');
		logger.info('status_code: 400');
		logger.info('status: error');
		logger.info('remark_id: ' + JSON.stringify(remark_id_from_data) + '');
		logger.info('call_details: ' + JSON.stringify([]) + '');
		logger.info('is_more_data: ' + JSON.stringify(is_more_data) + '');
		logger.end();
		return;
	}
		
	} catch (error) {
		res.status(200).json({
			status_code: 400,
			status: 'error',
			message: "Some Error Occured! Try again later.",
		});
		logger.info("error :- ");
		logger.info(error);
		logger.end();
		return;
	}
	

};

exports.view_call_details = async function (form_data, req, res, next) {
	var user_id = htmlspecialchars(form_data.id);
	var remark_id_from_data = form_data.remark_id;
	var call_status_array = [];
	var call_details = await User.view_call_details(form_data);
	console.log(call_details);
	const pattern = date.compile('DD-MM-YYYY');
	const pattern2 = date.compile('DD-MM-YYYY hh:mm a');
	const now = new Date();
	var current_date = date.format(now, pattern);
	var set_mobile = 0;
	var set_mobile_number = '';
	for (const call_detail of call_details) {
		if (set_mobile == 0) {
			set_mobile_number = '8097228680';
			set_mobile = 1;
		}
		else {
			set_mobile_number = '8097228680';
			set_mobile = 0;
		}
		if (call_detail.total_attempt <= 3) {
			call_status_array.push({
				id: call_detail.id,
				airway_bill_no: call_detail.airway_bill_no == null ? 'NA' : call_detail.airway_bill_no,
				remark_id: call_detail.remark_id == null ? 'NA' : call_detail.remark_id,
				recording_file: call_detail.recording_file == null ? 'NA' : call_detail.recording_file,
				first_name: call_detail.first_name == null ? 'NA' : call_detail.first_name,
				last_name: call_detail.last_name == null ? 'NA' : call_detail.last_name,
				company_name: call_detail.company_name == null ? 'NA' : call_detail.company_name,
				user_id: call_detail.user_id == null ? 'NA' : call_detail.user_id,
				customer_name: call_detail.customer_name == null ? 'NA' : call_detail.customer_name + '-(' + call_detail.id + ')',
				customer_mobile: call_detail.customer_mobile == null ? 'NA' : validate_mobile_numbers(call_detail.customer_mobile),//call_detail.customer_mobile,8097228680
				product_description: call_detail.product_description == null ? 'NA' : call_detail.product_description,
				final_order_total: call_detail.final_order_total == null ? '0' : call_detail.final_order_total,
				order_type: call_detail.order_type == null ? 'NA' : call_detail.order_type.toUpperCase() + '  $  ' + call_detail.customer_address + ', ' + call_detail.pincode + ', ' + call_detail.customer_city + '-' + call_detail.customer_state + ',' + call_detail.customer_country,
				ndr_visit_count: call_detail.ndr_visit_count == null ? 'NA' : call_detail.ndr_visit_count,
				last_inscan_datetime: call_detail.last_inscan_datetime == null ? 'NA' : date.format(new Date(call_detail.last_inscan_datetime), pattern),
				ndr_remark: call_detail.ndr_remark == null ? 'NA' : call_detail.ndr_remark,
				total_attempt: call_detail.total_attempt == null ? 'NA' : call_detail.total_attempt,
				other_remarks: call_detail.other_remarks == null ? 'NA' : call_detail.other_remarks,
				is_calling: call_detail.remark_id != 2 ? 1 : call_detail.reschedule_date == '0000-00-00 00:00:00' ? 1 : date.format(call_detail.reschedule_date, pattern) == current_date ? 1 : 0,
				reschedule_date: call_detail.reschedule_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.reschedule_date, pattern),
				reattempt_date: call_detail.reattempt_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.reattempt_date, pattern),
				last_call_date: call_detail.modified_date == '0000-00-00 00:00:00' ? 'NA' : date.format(call_detail.modified_date, pattern2),
				rto_remark: call_detail.rto_remarks == '' ? '' : call_detail.rto_remarks,
				is_record_playing: 0
			});
		}
	}

	if (call_details.length > 0) {
		res.status(200).json({
			status_code: 200,
			status: 'success',
			remark_id: remark_id_from_data,
			call_details: call_status_array
		});
		return;
	}
	else {
		res.status(200).json({
			status_code: 400,
			status: 'error',
			message: "Invalid request..",
			call_details: []
		});
		return;
	}

};

function validate_mobile_numbers(input_number) {
	//$return_array = array();
	//console.log("done");
	//console.log(input_number);
	input_number = input_number.replace(/\W|_/g, "");;//remove all special chaarc and alphabets
	//console.log(input_number);
	input_number = input_number.replace(' ', '');

	var filter3 = input_number;

	if (input_number.length == 12) {
		var filter2 = input_number.substr(0, 2);//identify 91 in prefix
		if (filter2 == '91') {
			filter3 = input_number.substr(2, 12);//extract first 10 digits
		}
	}
	else if (input_number.length == 11) {
		filter2 = input_number.substr(0, 1);//identify 0 in prefix
		if (filter2 == '0') {
			filter3 = input_number.substr(1, 11);//extract first 10 digits
		}
	}
	//console.log(filter3);
	return filter3;
}


exports.update_call_status_new = async function (form_data, req, res, next) {
	//console.log(form_data)
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
			new transports.File({ filename: path.join(logDirectory, 
				`${'update-call-status-new_' + user_id+"_"+formattedDate }.txt`
				) })
		]

	});
	try {
		logger.info('Payload :- ' + JSON.stringify(req.body));

	var ndr_call_details_id = htmlspecialchars(form_data.ndr_call_details_id);
	const pattern = date.compile('YYYY-MM-DD HH:MM:SS');

	var current_date = date.format(now, pattern);

	var date4 = new Date();
	var d = date4.getHours() + ':' + date4.getMinutes() + ':' + date4.getSeconds() + ':' + date4.getMilliseconds();
	var time_array = form_data.airway_bill_no + '_' + d;
	var remark_id = htmlspecialchars(form_data.remark_id);
	var reschedule_date = htmlspecialchars(form_data.reschedule_date);

	reschedule_date = new Date(reschedule_date);
	reschedule_date = date.format(reschedule_date, pattern);
	var reattempt_date = htmlspecialchars(form_data.reattempt_date);
	reattempt_date = new Date(reattempt_date);
	reattempt_date = date.format(reattempt_date, pattern);
	var rto_remarks = htmlspecialchars(form_data.rto_remarks);
	var other_remark = htmlspecialchars(form_data.other_remark);
	var total_attempt = htmlspecialchars(form_data.total_attempt);
	var audio_file = htmlspecialchars(form_data.audio_file);
	var action_by_user_id = form_data.id;
	var rto_remark = htmlspecialchars(form_data.rto_remarks);
	var reattempt_date_time = htmlspecialchars(form_data.reattempt_date);
	var scheduled_call_date_time = htmlspecialchars(form_data.reschedule_date);
	var call_recording = htmlspecialchars(form_data.call_recording);
	var airway_bill_no = htmlspecialchars(form_data.airway_bill_no);
	var ndr_action = htmlspecialchars(form_data.ndr_action);
	var call_recording_id = htmlspecialchars(form_data.call_recording_id);
	var recording_file = form_data.recording_file;
	var ringing_time = htmlspecialchars(form_data.ringing_time);
	var call_duration = htmlspecialchars(form_data.call_duration);

	var call_status_count_array = [];
	var update_query = "";
	var update_query_data = [];
	var Request = require("request");
	var form_data = {
		"access_token": "90739f2b646c6362e0c332bf0e01c3fd",
		"secret_key": "53d21009aad5b50487956953096c2027",
		"airway_bill_no": airway_bill_no,
		"ndr_action": ndr_action,
		"call_recording": call_recording,
		"scheduled_call_date_time": scheduled_call_date_time,
		"reattempt_date_time": reattempt_date_time,
		"rto_remark": rto_remark,
		"other_remark": other_remark,
		"action_by_user_id": action_by_user_id,
		"total_attempt": total_attempt,
		"audio_file": "",
		"audio_file_name": recording_file,
		"ringing_time": ringing_time,
		"call_duration": call_duration

	}
	//console.log("upload json");
	if (ringing_time == undefined || ringing_time == null || ringing_time == "") {
		ringing_time = "00"
	}
	if (call_duration == undefined || call_duration == null || call_duration == "") {
		call_duration = "00"
	}
	var date1 = new Date();
	var d1 = date1.getHours() + ':' + date1.getMinutes() + ':' + date1.getSeconds() + ':' + date1.getMilliseconds();
	time_array += '_' + d1;

	Request.post({
		"headers": { "content-type": "application/json" },
		"url": "https://my.ithinklogistics.com/ndr_call_api_v3/ndr_calls/update.json",
		// "url": "https://alpha2.ithinklogistics.com/ndr_calls_api/ndr_calls/update.json",
		"body": JSON.stringify(form_data)
	}, async (error, response, body) => {
		
				if(error)
				{
					const phplogDirectory = path.join(__dirname, './../php_error');
				const phplogger = createLogger({
					level: 'info',
					format: combine(
						logFormat
					),
					transports: [
						new transports.File({ filename: path.join(phplogDirectory, 
							`${'ndr-ithinklogistics-update_' + user_id+"_"+formattedDate }.txt`
							) })
					]
			
				});
				phplogger.info('Payload :- ' + JSON.stringify(req.body));
					phplogger.info('error :-');
					phplogger.info(error)
					phplogger.end();
				}
			
	});
				var date2 = new Date();
				var d2 = date2.getHours() + ':' + date2.getMinutes() + ':' + date2.getSeconds() + ':' + date2.getMilliseconds();
				time_array += '_' + d2;
				console.log('success');
				console.log('success from php');
				//var recording_file =body.file_name == null ? "" : body.file_name;

				var call_details = await User.save_call_record_upload_file_name_new(recording_file, call_recording_id, user_id);
				//console.log("upload"+call_details);


				if (call_details == 1) {
					if (remark_id == 1) {
						update_query = `update ndr_call_details set remark_id = 1, other_remarks = ?, updated_user_id = ?,total_attempt = ?,ringing = ?, modified_date = now() where id=?`;
						update_query_data = [other_remark, user_id, total_attempt, ringing_time, ndr_call_details_id];
					} else if (remark_id == 2) {
						update_query = `update ndr_call_details set remark_id = 2, reschedule_date = ?, updated_user_id = ?, total_attempt = ?, ringing = ?, call_duration = ?, modified_date = now() where id=?`;
						update_query_data = [reschedule_date, user_id, total_attempt, ringing_time, call_duration, ndr_call_details_id];
					} else if (remark_id == 3) {
						update_query = `update ndr_call_details set remark_id = 3, reattempt_date = ?, updated_user_id = ?, total_attempt = ?, ringing = ?, call_duration = ?, modified_date = now() where id=?`;
						update_query_data = [reattempt_date, user_id, total_attempt, ringing_time, call_duration, ndr_call_details_id];
					} else if (remark_id == 4) {
						update_query = `update ndr_call_details set remark_id = 4, rto_remarks = ?, updated_user_id = ?, total_attempt = ?, ringing = ?, call_duration = ?, modified_date = now() where id=?`;
						update_query_data = [rto_remarks, user_id, total_attempt, ringing_time, call_duration, ndr_call_details_id];
					} else if (remark_id == 5) {
						update_query = `update ndr_call_details set remark_id = 5, other_remarks = ?, updated_user_id = ?, total_attempt = ?, ringing = ?, call_duration = ?, modified_date = now() where id=?`;
						update_query_data = [other_remark, user_id, total_attempt, ringing_time, call_duration, ndr_call_details_id];
					} else if (remark_id == 6) {
						update_query = `update ndr_call_details set remark_id = 6, other_remarks = ?, updated_user_id = ?, total_attempt = ?, ringing = ?, call_duration = ?, modified_date = now() where id=?`;
						update_query_data = [other_remark, user_id, total_attempt, ringing_time, call_duration, ndr_call_details_id];
					}
					//console.log(update_query);
					//console.log(update_query_data);
					var call_details = await User.update_call_status(update_query, update_query_data);
					//console.log(call_details);
					if (call_details == 1) {
						var date3 = new Date();
						var d3 = date3.getHours() + ':' + date3.getMinutes() + ':' + date3.getSeconds() + ':' + date3.getMilliseconds();
						time_array += '_' + d3;
						console.log(time_array);
						res.status(200).json({
							status_code: 200,
							status: 'success',
							message: "success",
							call_details: call_details
						});
						logger.info('Response :-');
						logger.info('status_code: 200');
						logger.info('status: success');
						logger.info('message: success');
						logger.info('call_details: ' + JSON.stringify(call_details) + '');
						logger.end();
						return;
					}
					else {
						res.status(200).json({
							status_code: 400,
							status: 'error',
							message: "Something went wrong!!! please try again.",
							call_details: []
						});
						logger.info('Response :-');
						logger.info('status_code: 400');
						logger.info('status: error');
						logger.info('message: Something went wrong!!! please try again.');
						logger.info('call_details: ' + JSON.stringify([]) + '');
						logger.end();
						return;
					}

				}
				else {
					res.status(200).json({
						status_code: 400,
						status: 'error',
						message: "Something went wrong!!! please try again.",
					});
					logger.info('Response :-');
					logger.info('status_code: 400');
					logger.info('status: error');
					logger.info('message: Something went wrong!!! please try again.');
					logger.end();
					return;
				}


	} catch (error) {
		res.status(200).json({
			status_code: 400,
			status: 'error',
			message: "Some Error Occured! Try again later.",
		});
		logger.info("error :- ");
		logger.info(error);
		logger.end();
		return;
	}
};

exports.update_call_status = async function (form_data, req, res, next) {
	var ndr_call_details_id = htmlspecialchars(form_data.ndr_call_details_id);
	var user_id = form_data.id;
	const pattern = date.compile('YYYY-MM-DD HH:MM:SS');
	const now = new Date();
	var current_date = date.format(now, pattern);
	var remark_id = htmlspecialchars(form_data.remark_id);
	var reschedule_date = htmlspecialchars(form_data.reschedule_date);

	reschedule_date = new Date(reschedule_date);
	reschedule_date = date.format(reschedule_date, pattern);
	var reattempt_date = htmlspecialchars(form_data.reattempt_date);
	reattempt_date = new Date(reattempt_date);
	reattempt_date = date.format(reattempt_date, pattern);
	var rto_remarks = htmlspecialchars(form_data.rto_remarks);
	var other_remark = htmlspecialchars(form_data.other_remark);
	var total_attempt = htmlspecialchars(form_data.total_attempt);
	var call_status_count_array = [];
	var update_query = "";
	var update_query_data = [];
	if (remark_id == 1) {
		update_query = `update ndr_call_details set remark_id = 1,  other_remarks = ?, updated_user_id = ?,total_attempt = ?, modified_date = now() where id=?`;
		update_query_data = [other_remark, user_id, total_attempt, ndr_call_details_id];
	} else if (remark_id == 2) {
		update_query = `update ndr_call_details set remark_id = 2, reschedule_date = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
		update_query_data = [reschedule_date, user_id, total_attempt, ndr_call_details_id];
	} else if (remark_id == 3) {
		update_query = `update ndr_call_details set remark_id = 3, reattempt_date = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
		update_query_data = [reattempt_date, user_id, total_attempt, ndr_call_details_id];
	} else if (remark_id == 4) {
		update_query = `update ndr_call_details set remark_id = 4, rto_remarks = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
		update_query_data = [rto_remarks, user_id, total_attempt, ndr_call_details_id];
	} else if (remark_id == 5) {
		update_query = `update ndr_call_details set remark_id = 5, other_remarks = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
		update_query_data = [other_remark, user_id, total_attempt, ndr_call_details_id];
	} else if (remark_id == 6) {
		update_query = `update ndr_call_details set remark_id = 6, other_remarks = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
		update_query_data = [other_remark, user_id, total_attempt, ndr_call_details_id];
	}
	console.log(update_query);
	console.log(update_query_data);
	var call_details = await User.update_call_status(update_query, update_query_data);
	console.log(call_details);
	if (call_details == 1) {
		res.status(200).json({
			status_code: 200,
			status: 'success',
			call_details: call_details
		});
		return;
	}
	else {
		res.status(200).json({
			status_code: 400,
			status: 'error',
			message: "Invalid request..",
			call_details: []
		});
		
		return;
	}

};


exports.save_call_record_upload_file_name = async function (form_data, req, res, next) {
	var user_id = htmlspecialchars(form_data.id);

	var call_status_count_array = [];
	var call_details = await User.save_call_record_upload_file_name(form_data);
	console.log("upload" + call_details);


	if (call_details == 1) {
		res.status(200).json({
			status_code: 200,
			status: 'success',
			message: 'File uploaded'
		});
		return;
	}
	else {
		res.status(200).json({
			status_code: 400,
			status: 'error',
			message: "Invalid request..",
		});
		return;
	}

};


exports.mobile_update_call_status = async function (form_data, req, res, next) {
	//console.log(form_data)
	var ndr_call_details_id = form_data.ndr_call_details_id;
	var call_details_update_status;
	var user_id = form_data.id;
	const pattern = date.compile("YYYY-MM-DD HH:MM:SS");
	var now = new Date();
	var loggedin_user_id;
	var ndr_action_user_id;
	var data_array = [];
	var is_from_backend;
	var is_more_data = [];
	var order_management_query;
	// var get_order_management_query;
	var result_order_management_query = [];
	// var all_order_management_data_array = [];
	var om_row_id;
	var get_om_data_query;
	var om_result_get_query;
	// var  all_om_row_data_array = [];
	var om_row_get_query;
	var created_date = "";
	var update_itl_custom_query = "";
	var om_status = "";
	var logistic_id = "";
	var om_user_id = "";
	var dispatch_count;
	var last_scan_date = "";
	var remarks = "";
	var comment_category_id = "";
	var issue_id = "";
	var logistics_name = "";
	var product_description = "";
	var vendor_company_name = "";
	var ivr_response = "";
	var ndr_call_response = "";
	var temp_ndr_action;
	var itl_dispatch_count_vs_action = "";
	var vendor_dispatch_count_vs_action = "";
	var buyer_dispatch_count_vs_action = "";
	var customer_address = "";
	var customer_pincode = "";
	var is_reverse = "";
	var dispatch_count_vs_manual_ndr_call_count = "";
	var customer_mobile;
	var logistic_key_id;
	var logistics_service_type;
	var new_live_status;
	var other_remarks;
	var ndr_action_by;
	var dispatch_count_vs_manual_ndr_call_count_array = [];
	var latest_dispatch_count_vs_manual_ndr_call_count_array = [];
	var manual_ndr_call_dispatch_count;
	var manual_ndr_call_attempt_count;
	var latest_dispatch_count_vs_manual_ndr_call_count_data;
	var insert_ndr_timeline_history_query;
	var result_insert_ndr_timeline_history_query;
	var update_itl_undelivered_orders_query;
	var result_update_itl_undelivered_orders_query;
	var update_buyer_custom_query;
	var insert_buyer_response_ndr_timeline_history_query;
	var result_insert_buyer_response_ndr_timeline_history_query;
	var insert_reattempt_ndr_timeline_history_query;
	var result_insert_reattempt_ndr_timeline_history_query;
	var update_buyer_undelivered_orders_query;
	var result_update_buyer_undelivered_orders_query;
	// var current_date = date.format(now, pattern);

	var date4 = new Date();
	var d =
		date4.getHours() +
		":" +
		date4.getMinutes() +
		":" +
		date4.getSeconds() +
		":" +
		date4.getMilliseconds();
	var modified_date = d;
	var time_array = form_data.airway_bill_no + "_" + d;
	var remark_id = form_data.remark_id;
	var reschedule_date = form_data.reschedule_date;

	reschedule_date = new Date(reschedule_date);
	reschedule_date = date.format(reschedule_date, pattern);
	var reattempt_date = form_data.reattempt_date;
	reattempt_date = new Date(reattempt_date);
	reattempt_date = date.format(reattempt_date, pattern);
	var rto_remarks = form_data.rto_remarks;
	var other_remark = form_data.other_remark;
	var total_attempt = form_data.total_attempt;
	var audio_file = form_data.audio_file;
	var action_by_user_id = form_data.id;
	var rto_remark = form_data.rto_remarks;
	var reattempt_date_time = form_data.reattempt_date;
	var scheduled_call_date_time = form_data.reschedule_date;

	var airway_bill_no = form_data.airway_bill_no;
	var ndr_action = form_data.ndr_action;
	var call_recording_id = form_data.call_recording_id; //htmlspecialchar
	var recording_file = form_data.recording_file;
	var call_recording = form_data.recording_file;
	// var call_status_count_array = [];
	var update_query = "";
	var update_query_data = [];
	// var Request = require("request");

	var date2 = new Date();
	var d2 =
		date2.getHours() +
		":" +
		date2.getMinutes() +
		":" +
		date2.getSeconds() +
		":" +
		date2.getMilliseconds();
	time_array += "_" + d2;
	//console.log('success');
	// var recording_file =body.file_name == null ? "" : body.file_name;

	var call_details_save_record_file_name =
		await User.save_call_record_upload_file_name_new(
			recording_file,
			call_recording_id,
			user_id
		);
	//console.log("upload"+call_details);

	if (call_details_save_record_file_name == 1) {
		if (remark_id == 1) {
			update_query = `update ndr_call_details set remark_id = 1,  other_remarks = ?, updated_user_id = ?,total_attempt = ?, modified_date = now() where id=?`;
			update_query_data = [
				other_remark,
				user_id,
				total_attempt,
				ndr_call_details_id,
			];
		} else if (remark_id == 2) {
			update_query = `update ndr_call_details set remark_id = 2, reschedule_date = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
			update_query_data = [
				reschedule_date,
				user_id,
				total_attempt,
				ndr_call_details_id,
			];
		} else if (remark_id == 3) {
			update_query = `update ndr_call_details set remark_id = 3, reattempt_date = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
			update_query_data = [
				reattempt_date,
				user_id,
				total_attempt,
				ndr_call_details_id,
			];
		} else if (remark_id == 4) {
			update_query = `update ndr_call_details set remark_id = 4, rto_remarks = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
			update_query_data = [
				rto_remarks,
				user_id,
				total_attempt,
				ndr_call_details_id,
			];
		} else if (remark_id == 5) {
			update_query = `update ndr_call_details set remark_id = 5, other_remarks = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
			update_query_data = [
				other_remark,
				user_id,
				total_attempt,
				ndr_call_details_id,
			];
		} else if (remark_id == 6) {
			update_query = `update ndr_call_details set remark_id = 6, other_remarks = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
			update_query_data = [
				other_remark,
				user_id,
				total_attempt,
				ndr_call_details_id,
			];
		}
		//console.log(update_query);
		//console.log(update_query_data);
		call_details_update_status = await User.update_call_status(
			update_query,
			update_query_data
		);
		//php code..........................................................................................................................................................................................................................................

		//   access_token = access_token;
		//   secret_key = secret_key;
		//   airway_bill_no = airway_bill_no;
		//   ndr_action = ndr_action;
		//   scheduled_call_date_time = scheduled_call_date_time;
		//   reattempt_date_time = reattempt_date_time;
		//   rto_remark = rto_remark;
		//   other_remarks = other_remarks;

		if (typeof data_array["action_by_user_id"] !== "undefined") {
			loggedin_user_id = action_by_user_id;
		} else {
			loggedin_user_id = 1;
		}
		ndr_action_user_id = loggedin_user_id;
		audio_file = data_array["audio_file"];
		if (typeof data_array["is_from_backend"] !== "undefined") {
			is_from_backend = data_array["is_from_backend"];
		} else {
			is_from_backend = 0;
		}
		// call_recording = "";
		if (ndr_action == "9") {
			if (scheduled_call_date_time != "") {
				scheduled_call_date_time = date.format(new Date(scheduled_call_date_time), pattern);

			} else {
				res.status(200).json({
					status_code: 400,
					status: "error",
					message: "Please Enter Reshedule Date",
					is_more_data: is_more_data,
				});
				return;
				// return["message"] = 'Please Enter Reshedule Date';
				// return["status_code"] = 200;
				// return["status"] = "error";
				// console.log(json_encode(return));
				// exit;
			}
		}
		if (ndr_action == "10") {
			if (reattempt_date_time != "") {

				reattempt_date_time = date.format(new Date(reattempt_date_time), pattern);
			} else {
				res.status(200).json({
					status_code: 400,
					status: "error",
					message: "Please Enter Reattempt Date",
					is_more_data: is_more_data,
				});
				return;
				// return["message"] = 'Please Enter Reattempt Date';
				// return["status_code"] = 200;
				// return["status"] = "error";
				// console.log(json_encode(return));
				// exit;
			}
		}
		console.log(airway_bill_no);
		console.log("airway_bill_no");
		console.log("call_details_update_status");
		console.log(call_details_update_status);
		if (call_details_update_status == 1) {

			if (airway_bill_no != "") {
				order_management_query =
					"SELECT * from order_management where airway_bill_no like " +
					airway_bill_no +
					" and is_reverse = 0 and is_deleted = 0";

				console.log(order_management_query);
				result_order_management_query = await User.common_query(
					order_management_query
				);

				om_row_id = result_order_management_query[0].id;
				var om_customer_mobile_no = result_order_management_query[0].customer_mobile;
				console.log(om_row_id);
				// while (
				//   (
				// get_order_management_query = mysqli_fetch_assoc(
				// result_order_management_query)
				// ))
				// ) {
				// all_order_management_data_array =


				// }
				if (result_order_management_query.length > 0) {

					get_om_data_query =
						"SELECT om.customer_phone_number, om.customer_mobile, om.customer_address as om_customer_address,om.customer_address1 as om_customer_address1,om.customer_address2 as om_customer_address2,om.customer_address3 as om_customer_address3,om.customer_country as om_customer_country,om.customer_state as om_customer_state,om.customer_city as om_customer_city,om.pincode as om_customer_pincode,uo.*,l.logistics_name,om.airway_bill_no,om.product_description,u.first_name,u.last_name,u.company_name,om.logistic_id as om_logistic_id,om.logistics_service_type as om_logistics_service_type,om.new_live_status,om.customer_name,u.email,om.order_sub_order_no,om.is_reverse from undelivered_orders uo LEFT JOIN order_management om ON om.id = uo.o_m_row_id LEFT JOIN logistics l ON uo.logistic_id = l.id LEFT JOIN user u ON uo.user_id = u.id where om.id = " +
						om_row_id +
						" and uo.is_deleted = '0'";
					console.log(om_row_id);
					console.log("om_row_id");
					om_result_get_query = await User.common_query(get_om_data_query);

					// while (
					// om_row_get_query = mysqli_fetch_assoc(om_result_get_query)
					// ) {
					// k__1 = Settlement.default_key(all_om_row_data_array);
					// all_om_row_data_array = om_result_get_query;
					// }
					if (om_result_get_query.length > 0) {
						created_date = date.format(new Date(), pattern);
						update_itl_custom_query = "";
						om_status = om_result_get_query[0]["status"];
						logistic_id = om_result_get_query[0]["logistic_id"];
						om_user_id = om_result_get_query[0]["user_id"];
						om_row_id = om_result_get_query[0]["o_m_row_id"];
						dispatch_count = om_result_get_query[0]["dispatch_count"];
						last_scan_date = date.format(new Date(om_result_get_query[0]["last_scan_date"]), pattern);

						remarks = om_result_get_query[0]["remarks"];
						comment_category_id = om_result_get_query[0]["comment_category_id"];
						issue_id = om_result_get_query[0]["issue_id"];
						logistics_name = om_result_get_query[0]["logistics_name"];
						airway_bill_no = om_result_get_query[0]["airway_bill_no"];
						product_description = om_result_get_query[0]["product_description"];
						vendor_company_name = om_result_get_query[0]["company_name"];
						ivr_response = om_result_get_query[0]["ivr_response"];
						ndr_call_response = om_result_get_query[0]["ndr_call_response"];
						itl_dispatch_count_vs_action =
							om_result_get_query[0]["itl_dispatch_count_vs_action"];
						vendor_dispatch_count_vs_action =
							om_result_get_query[0]["vendor_dispatch_count_vs_action"];
						buyer_dispatch_count_vs_action =
							om_result_get_query[0]["buyer_dispatch_count_vs_action"];
						customer_address = om_result_get_query[0]["om_customer_address"];
						customer_pincode = om_result_get_query[0]["om_customer_pincode"];
						is_reverse = om_result_get_query[0]["is_reverse"];
						dispatch_count_vs_manual_ndr_call_count =
							om_result_get_query[0]["dispatch_count_vs_manual_ndr_call_count"];
						if (om_result_get_query[0]["customer_mobile"] == null) {
							customer_mobile = om_customer_mobile_no;
						} else {
							if (om_result_get_query[0]["customer_mobile"] != "") {
								customer_mobile = om_result_get_query[0]["customer_mobile"];
							} else {
								customer_mobile = om_result_get_query[0]["customer_phone_number"];
							}
						}
						console.log(customer_mobile);
						console.log("customer_mobile");
						console.log(om_result_get_query[0]["customer_mobile"]);
						console.log(om_result_get_query[0]["customer_phone_number"]);
						// $customer_mobile        = "+918898238172";
						if (customer_mobile.length == 13) {
							customer_mobile = customer_mobile.replace(
								"/^\\+91/",
								"",
								customer_mobile
							);
							// preg_replace("/^\\+91/", "", customer_mobile);
						}
						if (customer_mobile.length == 12) {
							customer_mobile = customer_mobile.replace(
								"/^91/",
								"",
								customer_mobile
							);
							// preg_replace("/^91/", "", customer_mobile);
						}
						if (customer_mobile.length == 11) {
							customer_mobile = customer_mobile.replace(
								"/^0/",
								"",
								customer_mobile
							);
							// preg_replace("/^0/", "", customer_mobile);
						}
						if (om_status == 0) {
							logistic_key_id = om_result_get_query[0]["om_logistic_id"];
							logistics_service_type =
								om_result_get_query[0]["om_logistics_service_type"];
							new_live_status = om_result_get_query[0]["new_live_status"];
							ndr_action_by = 3;
							if (
								itl_dispatch_count_vs_action.length > 0 &&
								itl_dispatch_count_vs_action != ""
							) {
								itl_dispatch_count_vs_action +=
									"," + dispatch_count + "-" + ndr_action;
							} else {
								itl_dispatch_count_vs_action =
									dispatch_count + "-" + ndr_action;
							}
							update_itl_custom_query +=
								"itl_dispatch_count_vs_action = '" +
								itl_dispatch_count_vs_action +
								"', ";
							if (
								false
							) {
								dispatch_count_vs_manual_ndr_call_count_array =
									dispatch_count_vs_manual_ndr_call_count.split(",");
								// Settlement.explode(
								//     ",",
								//     dispatch_count_vs_manual_ndr_call_count
								//   );
								latest_dispatch_count_vs_manual_ndr_call_count_data =
									dispatch_count_vs_manual_ndr_call_count_array.slice(-1);
								// end(
								//   dispatch_count_vs_manual_ndr_call_count_array
								// );
								latest_dispatch_count_vs_manual_ndr_call_count_array =
									latest_dispatch_count_vs_manual_ndr_call_count_data.split(
										"-"
									);
								// Settlement.explode(
								//     "-",
								//     latest_dispatch_count_vs_manual_ndr_call_count_data
								//   );
								manual_ndr_call_dispatch_count =
									latest_dispatch_count_vs_manual_ndr_call_count_array[0];
								manual_ndr_call_attempt_count =
									latest_dispatch_count_vs_manual_ndr_call_count_array[1];
							} else {
								manual_ndr_call_dispatch_count = dispatch_count;
								manual_ndr_call_attempt_count = 0;
							}
							if (manual_ndr_call_attempt_count == 0) {
								dispatch_count_vs_manual_ndr_call_count = dispatch_count + "-1";
							} else {
								manual_ndr_call_attempt_count =
									manual_ndr_call_attempt_count + 1;
								if (dispatch_count == manual_ndr_call_dispatch_count) {
									dispatch_count_vs_manual_ndr_call_count =
										dispatch_count_vs_manual_ndr_call_count.substr(0, -1);
									// substr(
									//   dispatch_count_vs_manual_ndr_call_count,
									//   0,
									//   -1
									// );
									dispatch_count_vs_manual_ndr_call_count =
										dispatch_count_vs_manual_ndr_call_count +
										"" +
										manual_ndr_call_attempt_count;
								} else {
									dispatch_count_vs_manual_ndr_call_count =
										dispatch_count_vs_manual_ndr_call_count +
										"," +
										dispatch_count +
										"-" +
										manual_ndr_call_attempt_count;
								}
							}
							update_itl_custom_query +=
								"dispatch_count_vs_manual_ndr_call_count = '" +
								dispatch_count_vs_manual_ndr_call_count +
								"', ";
							if (ndr_action == 8 || ndr_action == 12 || ndr_action == 13) {
								//NDR Call Not Received
								insert_ndr_timeline_history_query =
									"INSERT IGNORE INTO ndr_timeline_history (logistic_id,user_id,om_row_id,dispatch_count,last_scan_date,remarks,scheduled_call_date_time,ndr_action,ndr_action_by,ndr_action_user_id,comment_category_id,issue_id,created_date,is_deleted,entry_point,ndr_call_response,call_recording,other_remarks) VALUES ('" +
									logistic_id +
									"','" +
									user_id +
									"','" +
									om_row_id +
									"','" +
									dispatch_count +
									"','" +
									last_scan_date +
									"','" +
									remarks +
									"','','" +
									ndr_action +
									"','" +
									ndr_action_by +
									"','" +
									loggedin_user_id +
									"','" +
									comment_category_id +
									"','" +
									issue_id +
									"','" +
									created_date +
									"','0','11','3','" +
									call_recording +
									"','" +
									other_remarks +
									"');";
								result_insert_ndr_timeline_history_query =
									await User.common_query(insert_ndr_timeline_history_query);
							} else {
								if (ndr_action == 9) {
									//NDR Call Reschedule
									insert_ndr_timeline_history_query =
										"INSERT IGNORE INTO ndr_timeline_history (logistic_id,user_id,om_row_id,dispatch_count,last_scan_date,remarks,scheduled_call_date_time,ndr_action,ndr_action_by,ndr_action_user_id,comment_category_id,issue_id,created_date,is_deleted,entry_point,ndr_call_response,call_recording) VALUES ('" +
										logistic_id +
										"','" +
										user_id +
										"','" +
										om_row_id +
										"','" +
										dispatch_count +
										"','" +
										last_scan_date +
										"','" +
										remarks +
										"','','" +
										ndr_action +
										"','" +
										ndr_action_by +
										"','" +
										loggedin_user_id +
										"','" +
										comment_category_id +
										"','" +
										issue_id +
										"','" +
										created_date +
										"','0','11','3','" +
										call_recording +
										"');";
									result_insert_ndr_timeline_history_query =
										await User.common_query(insert_ndr_timeline_history_query);
								} else {
									if (ndr_action == 10) {
										//NDR Call Reattempt
										insert_ndr_timeline_history_query =
											"INSERT IGNORE INTO ndr_timeline_history (logistic_id,user_id,om_row_id,dispatch_count,last_scan_date,remarks,scheduled_call_date_time,ndr_action,ndr_action_by,ndr_action_user_id,comment_category_id,issue_id,created_date,is_deleted,entry_point,ndr_call_response,call_recording) VALUES ('" +
											logistic_id +
											"','" +
											user_id +
											"','" +
											om_row_id +
											"','" +
											dispatch_count +
											"','" +
											last_scan_date +
											"','" +
											remarks +
											"','','" +
											ndr_action +
											"','" +
											ndr_action_by +
											"','" +
											loggedin_user_id +
											"','" +
											comment_category_id +
											"','" +
											issue_id +
											"','" +
											created_date +
											"','0','11','3','" +
											call_recording +
											"');";
										result_insert_ndr_timeline_history_query =
											await User.common_query(
												insert_ndr_timeline_history_query
											);
									} else {
										if (ndr_action == 11) {
											// NDR Call RTO
											insert_ndr_timeline_history_query =
												"INSERT IGNORE INTO ndr_timeline_history (logistic_id,user_id,om_row_id,dispatch_count,last_scan_date,remarks,scheduled_call_date_time,ndr_action,ndr_action_by,ndr_action_user_id,comment_category_id,issue_id,created_date,is_deleted,entry_point,ndr_call_response,call_recording,rto_remark) VALUES ('" +
												logistic_id +
												"','" +
												user_id +
												"','" +
												om_row_id +
												"','" +
												dispatch_count +
												"','" +
												last_scan_date +
												"','" +
												remarks +
												"','','" +
												ndr_action +
												"','" +
												ndr_action_by +
												"','" +
												loggedin_user_id +
												"','" +
												comment_category_id +
												"','" +
												issue_id +
												"','" +
												created_date +
												"','0','11','3','" +
												call_recording +
												"','" +
												rto_remark +
												"');";
											result_insert_ndr_timeline_history_query =
												await User.common_query(
													insert_ndr_timeline_history_query
												);
										} else {
											res.status(200).json({
												status_code: 400,
												status: "error",
												message:
													"Invalid Ndr Action",
											});
											return;
										}
									}
								}
							}
							await new Promise(resolve => setTimeout(resolve, 300));

							console.log(result_insert_ndr_timeline_history_query.insertId);
							console.log("result_insert_ndr_timeline_history_query " + result_insert_ndr_timeline_history_query.insertId);
							if (result_insert_ndr_timeline_history_query.insertId > 0) {
								update_itl_custom_query += "ndr_call_response = '3', ";
								update_itl_undelivered_orders_query =
									"UPDATE undelivered_orders SET " +
									update_itl_custom_query +
									"  ndr_action = " +
									ndr_action +
									", ndr_action_by = " +
									ndr_action_by +
									",ndr_action_user_id = " +
									ndr_action_user_id +
									" WHERE o_m_row_id=" +
									om_row_id +
									"";
								result_update_itl_undelivered_orders_query =
									await User.common_query(update_itl_undelivered_orders_query);
								update_buyer_custom_query = "";
								if (ndr_action == 9) {
									//NDR Call Reschedule
									ndr_call_response = 4;
									update_buyer_custom_query +=
										"ndr_call_response = " + ndr_call_response + ", ";
									ndr_action_by = "4";
									//$ndr_action_user_id = '0';
									if (
										buyer_dispatch_count_vs_action.length > 0 &&
										buyer_dispatch_count_vs_action != ""
									) {
										buyer_dispatch_count_vs_action +=
											"," + dispatch_count + "-" + ndr_action;
									} else {
										buyer_dispatch_count_vs_action =
											dispatch_count + "-" + ndr_action;
									}
									update_buyer_custom_query +=
										"buyer_dispatch_count_vs_action = '" +
										buyer_dispatch_count_vs_action +
										"', ";
									insert_buyer_response_ndr_timeline_history_query =
										"INSERT IGNORE INTO ndr_timeline_history (logistic_id,user_id,om_row_id,dispatch_count,last_scan_date,remarks,scheduled_call_date_time,ndr_action,ndr_action_by,ndr_action_user_id,comment_category_id,issue_id,created_date,is_deleted,entry_point,ndr_call_response) VALUES ('" +
										logistic_id +
										"','" +
										user_id +
										"','" +
										om_row_id +
										"','" +
										dispatch_count +
										"','" +
										last_scan_date +
										"','" +
										remarks +
										"','" +
										scheduled_call_date_time +
										"','" +
										ndr_action +
										"','4','0','" +
										comment_category_id +
										"','" +
										issue_id +
										"','" +
										created_date +
										"','0','11','" +
										ndr_call_response +
										"');";
									result_insert_buyer_response_ndr_timeline_history_query =
										await User.common_query(
											insert_buyer_response_ndr_timeline_history_query
										);
								}
								if (ndr_action == 10) {
									//NDR Call Reattempt
									if (is_reverse == "0") {
										ndr_call_response = 1;
										update_buyer_custom_query +=
											"ndr_call_response = " + ndr_call_response + ", ";
										temp_ndr_action = 1;
										update_buyer_custom_query +=
											"buyer_reattempt_rto_action = '1', ";
										if (
											buyer_dispatch_count_vs_action.length > 0 &&
											buyer_dispatch_count_vs_action != ""
										) {
											buyer_dispatch_count_vs_action +=
												"," + dispatch_count + "-" + temp_ndr_action;
										} else {
											buyer_dispatch_count_vs_action =
												dispatch_count + "-" + temp_ndr_action;
										}
										update_buyer_custom_query +=
											"buyer_dispatch_count_vs_action = '" +
											buyer_dispatch_count_vs_action +
											"', ";
										update_buyer_custom_query +=
											"itl_reattempt_rto_action = '1', ";
										if (
											itl_dispatch_count_vs_action.length > 0 &&
											itl_dispatch_count_vs_action != ""
										) {
											itl_dispatch_count_vs_action +=
												"," + dispatch_count + "-" + temp_ndr_action;
										} else {
											itl_dispatch_count_vs_action =
												dispatch_count + "-" + temp_ndr_action;
										}
										update_buyer_custom_query +=
											"itl_dispatch_count_vs_action = '" +
											itl_dispatch_count_vs_action +
											"', ";
									}
									insert_buyer_response_ndr_timeline_history_query =
										"INSERT IGNORE INTO ndr_timeline_history (logistic_id,user_id,om_row_id,dispatch_count,last_scan_date,remarks,scheduled_call_date_time,ndr_action,ndr_action_by,ndr_action_user_id,comment_category_id,issue_id,created_date,is_deleted,entry_point,ndr_call_response) VALUES ('" +
										logistic_id +
										"','" +
										user_id +
										"','" +
										om_row_id +
										"','" +
										dispatch_count +
										"','" +
										last_scan_date +
										"','" +
										remarks +
										"','" +
										reattempt_date_time +
										"','" +
										ndr_action +
										"','4','0','" +
										comment_category_id +
										"','" +
										issue_id +
										"','" +
										created_date +
										"','0','11','" +
										ndr_call_response +
										"');";
									console.log(insert_buyer_response_ndr_timeline_history_query);
									result_insert_buyer_response_ndr_timeline_history_query =
										await User.common_query(
											insert_buyer_response_ndr_timeline_history_query
										);
									if (
										result_insert_buyer_response_ndr_timeline_history_query.insertId >
										0 &&
										is_reverse == "0"
									) {
										ndr_action = "1";
										ndr_action_by = "3";
										//$ndr_action_user_id                                   = '1';
										insert_reattempt_ndr_timeline_history_query =
											"INSERT IGNORE INTO ndr_timeline_history (logistic_id,user_id,om_row_id,dispatch_count,last_scan_date,remarks,scheduled_call_date_time,ndr_action,ndr_action_by,ndr_action_user_id,comment_category_id,issue_id,created_date,is_deleted,entry_point,ndr_call_response,reattempt_date_time) VALUES ('" +
											logistic_id +
											"','" +
											user_id +
											"','" +
											om_row_id +
											"','" +
											dispatch_count +
											"','" +
											last_scan_date +
											"','" +
											remarks +
											"','" +
											reattempt_date_time +
											"','1','3','1','" +
											comment_category_id +
											"','" +
											issue_id +
											"','" +
											created_date +
											"','0','11','" +
											ndr_call_response +
											"','" +
											reattempt_date_time +
											"');";
										result_insert_reattempt_ndr_timeline_history_query =
											await User.common_query(
												insert_reattempt_ndr_timeline_history_query
											);
									}
								}
								if (ndr_action == 11) {
									//NDR Call RTO
									ndr_call_response = 2;
									update_buyer_custom_query +=
										"ndr_call_response = " + ndr_call_response + ", ";
									temp_ndr_action = 2;
									update_buyer_custom_query +=
										"buyer_reattempt_rto_action = '2', ";
									if (
										buyer_dispatch_count_vs_action.length > 0 &&
										buyer_dispatch_count_vs_action != ""
									) {
										buyer_dispatch_count_vs_action +=
											"," + dispatch_count + "-" + temp_ndr_action;
									} else {
										buyer_dispatch_count_vs_action =
											dispatch_count + "-" + temp_ndr_action;
									}
									update_buyer_custom_query +=
										"buyer_dispatch_count_vs_action = '" +
										buyer_dispatch_count_vs_action +
										"', ";
									insert_buyer_response_ndr_timeline_history_query =
										"INSERT IGNORE INTO ndr_timeline_history (logistic_id,user_id,om_row_id,dispatch_count,last_scan_date,remarks,scheduled_call_date_time,ndr_action,ndr_action_by,ndr_action_user_id,comment_category_id,issue_id,created_date,is_deleted,entry_point,ndr_call_response) VALUES ('" +
										logistic_id +
										"','" +
										user_id +
										"','" +
										om_row_id +
										"','" +
										dispatch_count +
										"','" +
										last_scan_date +
										"','" +
										remarks +
										"','" +
										scheduled_call_date_time +
										"','" +
										ndr_action +
										"','4','0','" +
										comment_category_id +
										"','" +
										issue_id +
										"','" +
										created_date +
										"','0','11','" +
										ndr_call_response +
										"');";
									result_insert_buyer_response_ndr_timeline_history_query =
										await User.common_query(
											insert_buyer_response_ndr_timeline_history_query
										);
									if (
										result_insert_buyer_response_ndr_timeline_history_query.insertId > 0
									) {
										ndr_action_by = "4";
										//$ndr_action_user_id                                   = '0';
									}
								}
								update_buyer_undelivered_orders_query =
									"UPDATE undelivered_orders SET " +
									update_buyer_custom_query +
									"  ndr_action = " +
									ndr_action +
									", ndr_action_by = " +
									ndr_action_by +
									",ndr_action_user_id = " +
									ndr_action_user_id +
									" WHERE o_m_row_id=" +
									om_row_id +
									"";
								result_update_buyer_undelivered_orders_query =
									await User.common_query(
										update_buyer_undelivered_orders_query
									);
							} else {
								res.status(200).json({
									status_code: 400,
									status: "error",
									message:
										"Some Error Occured While adding NDR Escalation Data",
								});
								return;
							}
						} else {
							if (om_status == 1) {
								res.status(200).json({
									status_code: 400,
									status: "error",
									message: "Parcel is Delivered",
								});
								return;
								// exit;
							} else {
								if (om_status == 2) {
									res.status(200).json({
										status_code: 400,
										status: "error",
										message: "Parcel is RTO Delivered",
									});
									return;
								} else {
									res.status(200).json({
										status_code: 400,
										status: "error",
										message: "Some Error Occured.Please Try Again",
									});
									return;
								}
							}
						}
					} else {
						res.status(200).json({
							status_code: 400,
							status: "error",
							message: "Not Found Undelivered order Data",
						});
						return;
					}

				} else {
					res.status(200).json({
						status_code: 400,
						status: "error",
						message: "Not Found Data",
					});
					return;
				}
			} else {
				res.status(200).json({
					status_code: 400,
					status: "error",
					message: "Access Token Not Match",
				});
				return;
			}


			var date3 = new Date();
			var d3 =
				date3.getHours() +
				":" +
				date3.getMinutes() +
				":" +
				date3.getSeconds() +
				":" +
				date3.getMilliseconds();
			time_array += "_" + d3;
			console.log(time_array);
			res.status(200).json({
				status_code: 200,
				status: "success",
				message: "success",
				call_details_update_status: call_details_update_status,
			});
			return;
		} else {
			res.status(200).json({
				status_code: 400,
				status: "error",
				message: "Something went wrong!!! please try again.",
				call_details: [],
			});
			return;
		}
	} else {
		res.status(200).json({
			status_code: 400,
			status: "error",
			message: "Something went wrong!!! please try again.",
		});
		return;
	}
};
