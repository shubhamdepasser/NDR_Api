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
const { setTimeout } = require('timers');

       
exports.view_nonNDRcall_summary_count = async function(form_data, req, res, next) 
{
    var user_id = htmlspecialchars(form_data.id);
   
    var call_summary_count_array = [];
    var call_summary_count = await User.view_nonNDRcall_summary_count(form_data);
    for (const call_summary of call_summary_count) 
    {
        call_summary_count_array.push({
            total_count              : call_summary.total_count,
            today_count              : call_summary.today_attended_count+" - "+call_summary.today_count,
            Yesterday_count          : call_summary.yesterday_attended_count+" - "+call_summary.Yesterday_count,     
        });
    }
          
    if (call_summary_count.length>0)
    { 
        res.status(200).json({
            status_code : 200,
            status: 'success',
            call_summary_count: call_summary_count_array
        });
        return;
    }
    else
    {
        res.status(200).json({
            status_code : 400,
            status: 'error',
            message : "Invalid request.."
        });
        return;
    }
     
};

exports.view_nonNDRcall_status_count = async function(form_data, req, res, next) 
{
    var user_id = htmlspecialchars(form_data.id);
   
    var call_status_count_array = [];
    var call_status_count = await User.view_nonNDRcall_status_count(form_data);
    for (const call_status of call_status_count) 
    {
        call_status_count_array.push({
            total_count                 :" "+call_status.total_count,
            new_count                   :call_status.todays_attended_new_count+' - '+call_status.new_count, 
            ringing_count               :call_status.todays_attended_ringing_count+' - '+call_status.ringing_count,
            reschedule_Call_count       :call_status.todays_attended_reschedule_call_count+' - '+call_status.reschedule_call_count,
            reattempt_count             :call_status.todays_attended_reattempt_count+' - '+call_status.reattempt_count,
            RTO_count                   :call_status.todays_attended_rto_count+' - '+call_status.rto_count,    
            other_count                 :call_status.todays_attended_other_count+' - '+call_status.other_count,   
            close_count                 :call_status.todays_attended_close_count+' - '+call_status.close_count,   
        });
    }
          
    if (call_status_count.length>0)
    { 
        res.status(200).json({
            status_code : 200,
            status: 'success',
            call_status_count: call_status_count_array
        });
        return;
    }
    else
    {
        res.status(200).json({
            status_code : 400,
            status: 'error',
            message : "Invalid request.."
        });
        return;
    }
     
};

exports.view_nonNDRcall_details_pagination = async function(form_data, req, res, next) 
{
    var user_id = htmlspecialchars(form_data.id);
    var remark_id_from_data = form_data.remark_id;
    var page = form_data.page;
    var is_more_data = 0;
    var last_limit = (Number(page)+1)*50;;
    if(page != '')
    {
        last_limit = (Number(page)+1)*50;
    }
    else
    {
        last_limit = 50;
    }
    var call_status_array = [];
    var call_details = await User.view_nonNDRcall_details_pagination(form_data);
    var get_total_count = await User.view_nonNDRcall_details_get_count(form_data);
    console.log(get_total_count[0].total);
    if(last_limit<get_total_count[0].total && last_limit != get_total_count[0].total)
    {
        is_more_data = 1;
    }
    else{
        is_more_data = 0;
    }
    console.log(call_details);
    const pattern = date.compile('DD-MM-YYYY');
    const pattern2 = date.compile('DD-MM-YYYY hh:mm A');
    const now = new Date();
    var current_date = date.format(now, pattern);
    var set_mobile = 0;
    var set_mobile_number = '';
    for (const call_detail of call_details) 
    {
        if(set_mobile == 0)
        {
            set_mobile_number = '8097228680';
            set_mobile = 1;
        }
        else
        {
            set_mobile_number = '7350664377';
            set_mobile = 0;
        }
        if(call_detail.total_attempt <= 3)
        {
        call_status_array.push({
            id : call_detail.id,
            airway_bill_no: call_detail.airway_bill_no == null ? 'NA': call_detail.airway_bill_no,
            remark_id: call_detail.remark_id == null ? 'NA': call_detail.remark_id,
            recording_file: call_detail.recording_file == null ? 'NA': call_detail.recording_file,
            first_name: call_detail.first_name == null ? 'NA': call_detail.first_name,
            last_name: call_detail.last_name == null ? 'NA': call_detail.last_name,
            company_name: call_detail.store_name != null
			? call_detail.store_name : call_detail.vendor_website != '' ? call_detail.vendor_website : call_detail.company_name == null ? 'NA': call_detail.company_name,

            user_id: call_detail.user_id == null ? 'NA': call_detail.user_id,
            customer_name: call_detail.customer_name == null ? 'NA': call_detail.customer_name+'-('+call_detail.id+')',
            customer_mobile: call_detail.customer_mobile == null ? 'NA': validate_mobile_numbers(call_detail.customer_mobile),//call_detail.customer_mobile,8097228680
            product_description: call_detail.product_description == null ? 'NA': call_detail.product_description,
            final_order_total: call_detail.final_order_total == null ? '0': call_detail.final_order_total,
            order_type: call_detail.order_type == null ? 'NA': call_detail.order_type.toUpperCase()+'  $  '+call_detail.customer_address+', '+call_detail.pincode+', '+call_detail.customer_city+'-'+call_detail.customer_state+','+call_detail.customer_country,
            ndr_visit_count: call_detail.ndr_visit_count == null ? 'NA': call_detail.ndr_visit_count,
            last_inscan_datetime: call_detail.last_inscan_datetime == null ? 'NA': date.format(call_detail.last_inscan_datetime, pattern),
            ndr_remark: call_detail.ndr_remark == null ? 'NA': call_detail.ndr_remark,
            ndr_remark: call_detail.ndr_remark == null ? 'NA': call_detail.ndr_remark,
            total_attempt: call_detail.total_attempt == null ? 'NA': call_detail.total_attempt,
            other_remarks: call_detail.other_remarks == null ? 'NA': call_detail.other_remarks,
            is_calling: call_detail.remark_id != 2 ? 1 : call_detail.reschedule_date == '0000-00-00 00:00:00' ? 1 : date.format(call_detail.reschedule_date, pattern) == current_date ? 1:0,
            reschedule_date: call_detail.reschedule_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.reschedule_date, pattern),
            reattempt_date: call_detail.reattempt_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.reattempt_date, pattern),
            last_call_date: call_detail.modified_date == '0000-00-00 00:00:00' ? 'NA' : date.format(call_detail.modified_date, pattern2),
            rto_remark: call_detail.rto_remarks == '' ? '' : call_detail.rto_remarks,
            is_record_playing: 0
        });
        }
    }
          
    if (call_details.length>0)
    { 
        res.status(200).json({
            status_code : 200,
            status: 'success',
            remark_id: remark_id_from_data,
            call_details: call_status_array,
            is_more_data: is_more_data,
            total: get_total_count[0].total,
            last_limit: last_limit
        });
        return;
    }
    else
    {
        res.status(200).json({
            status_code : 400,
            status: 'error',
            message : "Invalid request..",
            call_details: [],
            is_more_data: is_more_data
        });
        return;
    }
     
};

exports.view_nonNDRcall_details = async function(form_data, req, res, next) 
{
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
    for (const call_detail of call_details) 
    {
        if(set_mobile == 0)
        {
            set_mobile_number = '8097228680';
            set_mobile = 1;
        }
        else
        {
            set_mobile_number = '7350664377';
            set_mobile = 0;
        }
        if(call_detail.total_attempt <= 3)
        {
        call_status_array.push({
            id : call_detail.id,
            airway_bill_no: call_detail.airway_bill_no == null ? 'NA': call_detail.airway_bill_no,
            remark_id: call_detail.remark_id == null ? 'NA': call_detail.remark_id,
            recording_file: call_detail.recording_file == null ? 'NA': call_detail.recording_file,
            first_name: call_detail.first_name == null ? 'NA': call_detail.first_name,
            last_name: call_detail.last_name == null ? 'NA': call_detail.last_name,
            company_name: call_detail.company_name == null ? 'NA': call_detail.company_name,
            user_id: call_detail.user_id == null ? 'NA': call_detail.user_id,
            customer_name: call_detail.customer_name == null ? 'NA': call_detail.customer_name+'-('+call_detail.id+')',
            customer_mobile: call_detail.customer_mobile == null ? 'NA': validate_mobile_numbers(call_detail.customer_mobile),//call_detail.customer_mobile,8097228680
            product_description: call_detail.product_description == null ? 'NA': call_detail.product_description,
            final_order_total: call_detail.final_order_total == null ? '0': call_detail.final_order_total,
            order_type: call_detail.order_type == null ? 'NA': call_detail.order_type.toUpperCase()+'  $  '+call_detail.customer_address+', '+call_detail.pincode+', '+call_detail.customer_city+'-'+call_detail.customer_state+','+call_detail.customer_country,
            ndr_visit_count: call_detail.ndr_visit_count == null ? 'NA': call_detail.ndr_visit_count,
            last_inscan_datetime: call_detail.last_inscan_datetime == null ? 'NA': date.format(call_detail.last_inscan_datetime, pattern),
            ndr_remark: call_detail.ndr_remark == null ? 'NA': call_detail.ndr_remark,
            total_attempt: call_detail.total_attempt == null ? 'NA': call_detail.total_attempt,
            other_remarks: call_detail.other_remarks == null ? 'NA': call_detail.other_remarks,
            is_calling: call_detail.remark_id != 2 ? 1 : call_detail.reschedule_date == '0000-00-00 00:00:00' ? 1 : date.format(call_detail.reschedule_date, pattern) == current_date ? 1:0,
            reschedule_date: call_detail.reschedule_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.reschedule_date, pattern),
            reattempt_date: call_detail.reattempt_date == '0000-00-00 00:00:00' ? '' : date.format(call_detail.reattempt_date, pattern),
            last_call_date: call_detail.modified_date == '0000-00-00 00:00:00' ? 'NA' : date.format(call_detail.modified_date, pattern2),
            rto_remark: call_detail.rto_remarks == '' ? '' : call_detail.rto_remarks,
            is_record_playing: 0
        });
        }
    }
          
    if (call_details.length>0)
    { 
        res.status(200).json({
            status_code : 200,
            status: 'success',
            remark_id: remark_id_from_data,
            call_details: call_status_array
        });
        return;
    }
    else
    {
        res.status(200).json({
            status_code : 400,
            status: 'error',
            message : "Invalid request..",
            call_details: []
        });
        return;
    }
     
};

function validate_mobile_numbers(input_number)
{
    //$return_array = array();
  
  input_number = input_number.replace(/\W|_/g, "");;//remove all special chaarc and alphabets
   //console.log(input_number);
   input_number = input_number.replace(' ','');
   
   var filter3 = input_number;
   
   if(input_number.length == 12)
   { 
       var filter2 = input_number.substr(0, 2);//identify 91 in prefix
       if(filter2 == '91')
       {
           filter3 = input_number.substr(2, 12);//extract first 10 digits
       }
   }
   else if(input_number.length == 11)
   {
       filter2 = input_number.substr(0, 1);//identify 0 in prefix
       if(filter2 == '0')
       { 
           filter3 = input_number.substr(1, 11);//extract first 10 digits
       }
   }
   //console.log(filter3);
   return filter3;
}


exports.update_nonNDRcall_status_new = async function(form_data, req, res, next) 
{
    var ndr_call_details_id = htmlspecialchars(form_data.ndr_call_details_id);
    var user_id = form_data.id;
    const pattern = date.compile('YYYY-MM-DD HH:MM:SS');
    var now = new Date();
    
    var current_date = date.format(now, pattern);
    
    var date4 = new Date();
    var d = date4.getHours()+':'+date4.getMinutes()+':'+date4.getSeconds()+':'+date4.getMilliseconds();
    var time_array = form_data.airway_bill_no+'_'+d;
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
	var recording_file =form_data.recording_file;
    var call_status_count_array = [];
    var update_query = "";
    var update_query_data = [];
    var Request = require("request");
    
    //console.log("upload json");
    var date1 = new Date();
    var d1 = date1.getHours()+':'+date1.getMinutes()+':'+date1.getSeconds()+':'+date1.getMilliseconds();
    time_array += '_'+d1;
    
	var call_details = await User.save_nonNDRcall_record_upload_file_name_new(recording_file,call_recording_id,user_id);
    var date2 = new Date();
    var d2 = date2.getHours()+':'+date2.getMinutes()+':'+date2.getSeconds()+':'+date2.getMilliseconds();
    time_array += '_'+d2;
        
    if (true)
    { 
        if(remark_id == 1){
            update_query = `update non_ndr_call_details set remark_id = 1,  other_remarks = ?, updated_user_id = ?,total_attempt = ?, modified_date = now() where id=?`;
            update_query_data = [other_remark,user_id,total_attempt,ndr_call_details_id];
        }else if(remark_id == 2){
            update_query = `update non_ndr_call_details set remark_id = 2, reschedule_date = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
            update_query_data = [reschedule_date,user_id,total_attempt, ndr_call_details_id];
        }else if(remark_id == 3){
            update_query = `update non_ndr_call_details set remark_id = 3, reattempt_date = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
            update_query_data = [reattempt_date,user_id,total_attempt, ndr_call_details_id];
        }else if(remark_id == 4){
            update_query = `update non_ndr_call_details set remark_id = 4, rto_remarks = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
            update_query_data = [rto_remarks,user_id,total_attempt, ndr_call_details_id];
        }else if(remark_id == 5){
            update_query = `update non_ndr_call_details set remark_id = 5, other_remarks = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
            update_query_data = [other_remark,user_id,total_attempt, ndr_call_details_id];
        }else if(remark_id == 6){
            update_query = `update non_ndr_call_details set remark_id = 6, other_remarks = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
            update_query_data = [other_remark,user_id,total_attempt, ndr_call_details_id];
        }
        var call_details = await User.update_nonNDRcall_status(update_query,update_query_data);
        
        if (call_details == 1)
        { 
            var date3 = new Date();
            var d3 = date3.getHours()+':'+date3.getMinutes()+':'+date3.getSeconds()+':'+date3.getMilliseconds();
            time_array += '_'+d3;
            console.log(time_array);
            res.status(200).json({
                status_code : 200,
                status: 'success',
                message : "success",
                call_details: call_details
            });
            return;
        }
        else
        {
            res.status(200).json({
                status_code : 400,
                status: 'error',
                message : "Something went wrong!!! please try again.",
                call_details: []
            });
            return;
        }
        
    }
    else
    {
    }
     
};

exports.update_nonNDRcall_status = async function(form_data, req, res, next) 
{
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
    if(remark_id == 1){
        update_query = `update non_ndr_call_details set remark_id = 1,  other_remarks = ?, updated_user_id = ?,total_attempt = ?, modified_date = now() where id=?`;
        update_query_data = [other_remark,user_id,total_attempt,ndr_call_details_id];
    }else if(remark_id == 2){
        update_query = `update non_ndr_call_details set remark_id = 2, reschedule_date = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
        update_query_data = [reschedule_date,user_id,total_attempt, ndr_call_details_id];
    }else if(remark_id == 3){
        update_query = `update non_ndr_call_details set remark_id = 3, reattempt_date = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
        update_query_data = [reattempt_date,user_id,total_attempt, ndr_call_details_id];
    }else if(remark_id == 4){
        update_query = `update non_ndr_call_details set remark_id = 4, rto_remarks = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
        update_query_data = [rto_remarks,user_id,total_attempt, ndr_call_details_id];
    }else if(remark_id == 5){
        update_query = `update non_ndr_call_details set remark_id = 5, other_remarks = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
        update_query_data = [other_remark,user_id,total_attempt, ndr_call_details_id];
    }else if(remark_id == 6){
        update_query = `update non_ndr_call_details set remark_id = 6, other_remarks = ?, updated_user_id = ?, total_attempt = ?, modified_date = now() where id=?`;
        update_query_data = [other_remark,user_id,total_attempt, ndr_call_details_id];
    }
    console.log(update_query);
    console.log(update_query_data);
    var call_details = await User.update_nonNDRcall_status(update_query,update_query_data);
        console.log(call_details);
    if (call_details == 1)
    { 
        res.status(200).json({
            status_code : 200,
            status: 'success',
            call_details: call_details
        });
        return;
    }
    else
    {
        res.status(200).json({
            status_code : 400,
            status: 'error',
            message : "Invalid request..",
            call_details: []
        });
        return;
    }
     
};

