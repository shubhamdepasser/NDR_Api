const validator = require('validator');
const bcrypt = require('bcryptjs');
var express = require('express');
var mysqlpool = require('../dbconfig');
const {
    promisify
} = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/nonNDRModel');
var session = require('express-session');
const app = express();
const md5 = require('md5');
const date = require('date-and-time');
var randomize = require('randomatic');
var decode = require('decode-html');
const nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');
var htmlspecialchars = require('htmlspecialchars');
const { json } = require('body-parser');
var model = require('../models/ndr_nonndr_model');
const { setTimeout } = require('timers');
const { createLogger, transports } = require('winston');
const { combine, timestamp, printf } = require('winston').format;
const path = require('path');

function secondsToHoursMinutesAndSeconds(seconds) {
    const hours = Math.floor(seconds / 3600);
    const remainingSecondsAfterHours = seconds % 3600;
    const minutes = Math.floor(remainingSecondsAfterHours / 60);
    const remainingSeconds = remainingSecondsAfterHours % 60;

    return { hours, minutes, remainingSeconds };
}
exports.view_nonNDRcall_summary_count = async function (form_data, req, res, next) {
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
            new transports.File({
                filename: path.join(logDirectory,
                    `${'view-nonNDRcall-summary-count_' + user_id + "_" + formattedDate}.txt`
                )
            })
        ]

    });
    try {
        logger.info('Paylod :- ' + JSON.stringify(req.body));
        var call_summary_count_array = [];
        var check_ndr_time_status;
        var call_summary_count = await User.view_nonNDRcall_summary_count(form_data);
        if (form_data.module_type == undefined || form_data.module_type == null || form_data.module_type == "") {
            check_ndr_time_status = await model.check_ndr_nonndr_event_status(form_data, 2);
        }
        else {
            check_ndr_time_status = await model.check_ndr_time_status(form_data);

        }
        const { hours, minutes, remainingSeconds } = secondsToHoursMinutesAndSeconds(call_summary_count[0].todays_total_call_duration);

        var event_type = "";
        for (const call_summary of call_summary_count) {
            call_summary_count_array.push({
                total_count: call_summary.total_count,
                todays_total_call_duration: hours + " hrs " + minutes + " min " + remainingSeconds + " sec",
                today_count: call_summary.today_attended_count + " - " + call_summary.today_count,
                Yesterday_count: call_summary.yesterday_attended_count + " - " + call_summary.Yesterday_count,
            });
        }

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

exports.view_nonNDRcall_status_count = async function (form_data, req, res, next) {
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
            new transports.File({
                filename: path.join(logDirectory,

                    `${'view-nonNDRcall-status-count_' + user_id + "_" + formattedDate}.txt`)
            })
        ]

    });
    try {
        logger.info('Payload :- ' + JSON.stringify(req.body));

        var call_status_count_array = [];
        var call_status_count = await User.view_nonNDRcall_status_count(form_data);
        for (const call_status of call_status_count) {
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

exports.view_nonNDRcall_details_pagination = async function (form_data, req, res, next) {
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
            new transports.File({
                filename: path.join(logDirectory,
                    `${'view-nonNDRcall-details2_' + user_id + "_" + formattedDate}.txt`
                )
            })
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
        var call_details = await User.view_nonNDRcall_details_pagination(form_data);
        var get_total_count = await User.view_nonNDRcall_details_get_count(form_data);
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
                set_mobile_number = '7350664377';
                set_mobile = 0;
            }
            if (call_detail.total_attempt <= 3) {
                if (form_data.version.substr(0, form_data.version.length) > version.substr(0, version.length)) {
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
                            ]
                        });
                }
                else {
                    if (form_data.version.substr(0, form_data.version.length) === version_6.substr(0, version_6.length)) {
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
                            order_id: call_detail.order_id == null ? '' : call_detail.order_id,
                            order_date: call_detail.order_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.order_date, pattern2),
                            is_record_playing: 0,
                        })
                    }
                    else {
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
                // call_status_array.push({
                //     id : call_detail.id,
                //     airway_bill_no: call_detail.airway_bill_no == null ? 'NA': call_detail.airway_bill_no,
                //     remark_id: call_detail.remark_id == null ? 'NA': call_detail.remark_id,
                //     recording_file: call_detail.recording_file == null ? 'NA': call_detail.recording_file,
                //     first_name: call_detail.first_name == null ? 'NA': call_detail.first_name,
                //     last_name: call_detail.last_name == null ? 'NA': call_detail.last_name,
                //     company_name: call_detail.store_name != null ? call_detail.store_name : call_detail.vendor_website != '' ? call_detail.vendor_website : call_detail.company_name == null ? 'NA': call_detail.company_name,

                //     user_id: call_detail.user_id == null ? 'NA': call_detail.user_id,
                //     customer_name: call_detail.customer_name == null ? 'NA': call_detail.customer_name+'-('+call_detail.id+')',
                //     customer_mobile: call_detail.customer_mobile == null ? 'NA': validate_mobile_numbers(call_detail.customer_mobile),//call_detail.customer_mobile,8097228680
                //     product_description: call_detail.product_description == null ? 'NA': call_detail.product_description,
                //     final_order_total: call_detail.final_order_total == null ? '0': call_detail.final_order_total,
                //     order_type: call_detail.order_type == null ? 'NA': call_detail.order_type.toUpperCase()+'  $  '+call_detail.customer_address+', '+call_detail.pincode+', '+call_detail.customer_city+'-'+call_detail.customer_state+','+call_detail.customer_country,
                //     ndr_visit_count: call_detail.ndr_visit_count == null ? 'NA': call_detail.ndr_visit_count,
                //     last_inscan_datetime: call_detail.last_inscan_datetime == null ? 'NA': date.format(call_detail.last_inscan_datetime, pattern),
                //     ndr_remark: call_detail.ndr_remark == null ? 'NA': call_detail.ndr_remark,
                //     ndr_remark: call_detail.ndr_remark == null ? 'NA': call_detail.ndr_remark,
                //     total_attempt: call_detail.total_attempt == null ? 'NA': call_detail.total_attempt,
                //     other_remarks: call_detail.other_remarks == null ? 'NA': call_detail.other_remarks,
                //     is_calling: call_detail.remark_id != 2 ? 1 : call_detail.reschedule_date == '0000-00-00 00:00:00' ? 1 : date.format(call_detail.reschedule_date, pattern) == current_date ? 1:0,
                //     reschedule_date: call_detail.reschedule_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.reschedule_date, pattern),
                //     reattempt_date: call_detail.reattempt_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.reattempt_date, pattern),
                //     last_call_date: call_detail.modified_date == '0000-00-00 00:00:00' ? 'NA' : date.format(call_detail.modified_date, pattern2),
                //     rto_remark: call_detail.rto_remarks == '' ? '' : call_detail.rto_remarks,
                //     is_record_playing: 0
                // });
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
            logger.end()
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
            logger.info('remark_id: ' + JSON.stringify(remark_id_from_data));
            logger.info('call_details: ' + JSON.stringify([]));
            logger.info('is_more_data: ' + JSON.stringify(is_more_data));
            logger.end()
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
        logger.end()
        return;
    }


};

exports.view_nonNDRcall_details = async function (form_data, req, res, next) {
    var user_id = htmlspecialchars(form_data.id);
    var remark_id_from_data = form_data.remark_id;
    var call_status_array = [];
    var call_details = await User.view_nonNDRcall_details(form_data);
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
            set_mobile_number = '7350664377';
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
                last_inscan_datetime: call_detail.last_inscan_datetime == null ? 'NA' : date.format(call_detail.last_inscan_datetime, pattern),
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


exports.update_nonNDRcall_status_new = async function (form_data, req, res, next) {
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
                    `${'update_nonNDRcall_status_new_' + user_id + "_" + formattedDate}.txt`
                )
            })
        ]

    });
    try {
        logger.info('Payload :- ' + JSON.stringify(req.body));
        var ndr_call_details_id = htmlspecialchars(form_data.ndr_call_details_id);
        const pattern = date.compile('YYYY-MM-DD HH:MM:SS');
        var now = new Date();

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
        var ringing_time = htmlspecialchars(form_data.ringing_time);
        var call_duration = htmlspecialchars(form_data.call_duration);
        var recording_file = form_data.recording_file;
        var call_status_count_array = [];
        var update_query = "";
        var update_query_data = [];
        var Request = require("request");

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
        //var recording_file ="";
        if (audio_file != "") {
            var form_data = {
                "access_token": "90739f2b646c6362e0c332bf0e01c3fd",
                "secret_key": "53d21009aad5b50487956953096c2027",

                "audio_file": audio_file,
                "audio_file_name": recording_file,

            }
            await Request.post({
                "headers": { "content-type": "application/json" },
                "url": "https://my.ithinklogistics.com/ndr_call_api_v3/non_ndr_calls/get_recording.json",
                // "url": "https://alpha2.ithinklogistics.com/ndr_calls_api/non_ndr_calls/get_recording.json",
                "body": JSON.stringify(form_data)
            }, async (error, response, body) => {
                if (error) {
                    const phplogDirectory = path.join(__dirname, './../php_error');
                    const phplogger = createLogger({
                        level: 'info',
                        format: combine(
                            logFormat
                        ),
                        transports: [
                            new transports.File({
                                filename: path.join(phplogDirectory,
                                    `${'Nonndr-ithinklogistics-update_' + user_id + "_" + formattedDate}.txt`
                                )
                            })
                        ]

                    });
                    phplogger.info('Payload :- ' + JSON.stringify(req.body));
                    phplogger.info("error :-");
                    phplogger.info(error)
                    phplogger.end();
                } 
                // else {
                //     body = JSON.parse(body);
                //     //console.log(body.status);
                //     console.log(body);

                //     if (body.status == 'success') {
                //         console.log("this is success")
                //         //recording_file = body.file_name == null ? "" : body.file_name;
                //         var call_details = await User.save_nonNDRcall_record_upload_file_name_new(recording_file, call_recording_id, user_id);

                //     }
                    // else {
                    //     console.log("this is error")
                    //     res.status(200).json({
                    //         status_code: 400,
                    //         status: 'error',
                    //         message: body.message
                    //     });
                    //     logger.info('Response :-');
                    //     logger.info('status_code: 400');
                    //     logger.info('status: error');
                    //     logger.info('message: ' + JSON.stringify(body.message) + '');
                    //     logger.end()
                    //     const phplogDirectory = path.join(__dirname, './../php_error');
                    //     const phplogger = createLogger({
                    //         level: 'info',
                    //         format: combine(
                    //             logFormat
                    //         ),
                    //         transports: [
                    //             new transports.File({
                    //                 filename: path.join(phplogDirectory,
                    //                     `${'ndr-ithinklogistics-update_' + user_id + "_" + formattedDate}.txt`
                    //                 )
                    //             })
                    //         ]

                    //     });
                    //     phplogger.info('Payload :- ' + JSON.stringify(req.body));
                    //     phplogger.info("error :-");
                    //     phplogger.info(error)
                    //     phplogger.end();
                    //     return;
                    // }
                // }
                //console.dir(JSON.parse(body));
            });
            var call_details = await User.save_nonNDRcall_record_upload_file_name_new(recording_file, call_recording_id, user_id);
        }
        var date2 = new Date();
        var d2 = date2.getHours() + ':' + date2.getMinutes() + ':' + date2.getSeconds() + ':' + date2.getMilliseconds();
        time_array += '_' + d2;
        //console.log('success');


        //console.log("upload"+call_details);


        if (true) {
            if (remark_id == 1) {
                update_query = `update non_ndr_call_details set remark_id = 1, other_remarks = ?, updated_user_id = ?,total_attempt = ?, ringing = ?, modified_date = now() where id=?`;
                update_query_data = [other_remark, user_id, total_attempt, ringing_time, ndr_call_details_id];
            } else if (remark_id == 2) {
                update_query = `update non_ndr_call_details set remark_id = 2, reschedule_date = ?, updated_user_id = ?, total_attempt = ?, ringing = ?, call_duration = ?, modified_date = now() where id=?`;
                update_query_data = [reschedule_date, user_id, total_attempt, ringing_time, call_duration, ndr_call_details_id];
            } else if (remark_id == 3) {
                update_query = `update non_ndr_call_details set remark_id = 3, reattempt_date = ?, updated_user_id = ?, total_attempt = ?, ringing = ?, call_duration = ?, modified_date = now() where id=?`;
                update_query_data = [reattempt_date, user_id, total_attempt, ringing_time, call_duration, ndr_call_details_id];
            } else if (remark_id == 4) {
                update_query = `update non_ndr_call_details set remark_id = 4, rto_remarks = ?, updated_user_id = ?, total_attempt = ?, ringing = ?, call_duration = ?, modified_date = now() where id=?`;
                update_query_data = [rto_remarks, user_id, total_attempt, ringing_time, call_duration, ndr_call_details_id];
            } else if (remark_id == 5) {
                update_query = `update non_ndr_call_details set remark_id = 5, other_remarks = ?, updated_user_id = ?, total_attempt = ?, ringing = ?, call_duration = ?, modified_date = now() where id=?`;
                update_query_data = [other_remark, user_id, total_attempt, ringing_time, call_duration, ndr_call_details_id];
            } else if (remark_id == 6) {
                update_query = `update non_ndr_call_details set remark_id = 6, other_remarks = ?, updated_user_id = ?, total_attempt = ?, ringing = ?, call_duration = ?, modified_date = now() where id=?`;
                update_query_data = [other_remark, user_id, total_attempt, ringing_time, call_duration, ndr_call_details_id];
            }

            //console.log(update_query);
            //console.log(update_query_data);
            var call_details = await User.update_nonNDRcall_status(update_query, update_query_data);

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
    //console.log(form_data)

};

exports.update_nonNDRcall_status = async function (form_data, req, res, next) {
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
        update_query = `update non_ndr_call_details set remark_id = 1,  other_remarks = ?, updated_user_id = ?,total_attempt = ?, modified_date = now() where id=?`;
        update_query_data = [other_remark, user_id, total_attempt, ndr_call_details_id];
    } else if (remark_id == 2) {
        update_query = `update non_ndr_call_details set remark_id = 2, reschedule_date = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
        update_query_data = [reschedule_date, user_id, total_attempt, ndr_call_details_id];
    } else if (remark_id == 3) {
        update_query = `update non_ndr_call_details set remark_id = 3, reattempt_date = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
        update_query_data = [reattempt_date, user_id, total_attempt, ndr_call_details_id];
    } else if (remark_id == 4) {
        update_query = `update non_ndr_call_details set remark_id = 4, rto_remarks = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
        update_query_data = [rto_remarks, user_id, total_attempt, ndr_call_details_id];
    } else if (remark_id == 5) {
        update_query = `update non_ndr_call_details set remark_id = 5, other_remarks = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
        update_query_data = [other_remark, user_id, total_attempt, ndr_call_details_id];
    } else if (remark_id == 6) {
        update_query = `update non_ndr_call_details set remark_id = 6, other_remarks = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
        update_query_data = [other_remark, user_id, total_attempt, ndr_call_details_id];
    }
    console.log(update_query);
    console.log(update_query_data);
    var call_details = await User.update_nonNDRcall_status(update_query, update_query_data);
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


exports.save_nonNDRcall_record_upload_file_name = async function (form_data, req, res, next) {
    var user_id = htmlspecialchars(form_data.id);

    var call_status_count_array = [];
    var call_details = await User.save_nonNDRcall_record_upload_file_name(form_data);
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