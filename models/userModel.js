const validator = require('validator');
const bcrypt = require('bcryptjs');
var express = require('express');
var mysqlpool = require('../dbconfig');
const md5 = require('md5');
var htmlspecialchars = require('htmlspecialchars');
var decode = require('decode-html');
const date = require('date-and-time');
const { rescheduleJob } = require('node-schedule');

exports.login_user = async function(form_data) 
{
    var Email = form_data.email;
    //var HTML_secial_char = htmlspecialchars("</script>'foo! @ & % < > /");
    //console.log(HTML_secial_char);
    //console.log(decode(HTML_secial_char));
    
    return new Promise(function(resolve, reject) 
    {
        
        mysqlpool.getConnection(async function(err, connection) 
        {
            await connection.query("select * from user where user_type='2' and lower(email)=? and is_deleted = '0' limit 1 ",
			 [Email], function (error, results, fields) {
                if (error)
                { 
                    connection.release();
                    reject(error);
                }
                else
                {
                    connection.release();
                    resolve(results);
                }
            });
        });
    });
};

exports.get_user_mobile_access_token = async function(user_id) 
{
    //var HTML_secial_char = htmlspecialchars("</script>'foo! @ & % < > /");
    //console.log(HTML_secial_char);
    //console.log(decode(HTML_secial_char));
    
    return new Promise(function(resolve, reject) 
    {
        
        mysqlpool.getConnection(async function(err, connection) 
        {
            await connection.query("select mobile_access_token from user where user_type='2' and id=? and is_deleted = '0' limit 1 ", [user_id], function (error, results, fields) {
                if (error)
                { 
                    connection.release();
                    reject(error);
                }
                else
                {
                    connection.release();
                    resolve(results);
                }
            });
        });
    });
};
exports.update_last_login_and_mobile_access_token = async function(user_id,mobile_access_token,mobile_token_exp_date,current_date) 
{
    var user_id = user_id;
    var mobile_access_token = mobile_access_token;
    var mobile_token_exp_dat = mobile_token_exp_dat;
    var current_date = current_date;
    return new Promise(function(resolve, reject) 
    {
        
        mysqlpool.getConnection(async function(err, connection) 
        {
            await connection.query("update user set mobile_access_token=?,mobile_token_exp_date=?,app_last_login=? where id = ?",[htmlspecialchars(mobile_access_token),htmlspecialchars(mobile_token_exp_date),htmlspecialchars(current_date),htmlspecialchars(user_id)], function (error, results, fields) {
                if (error)
                { 
                    connection.release();
                    reject(error);
                }
                else
                {
                    connection.release();
                    resolve(results);
                }
            });
        });
    });
};

exports.insert_user_login_details_query = async function(user_id,current_date,type) 
{
    var user_id = user_id;
    var current_date = current_date;
    var type = type;
    return new Promise(function(resolve, reject) 
    {    
        mysqlpool.getConnection(async function(err, connection) 
        {
            await connection.query("INSERT INTO user_login_details (user_id, ip_address, user_agent, login_date_time,is_deleted) VALUES (?,?,?,?,?)",[htmlspecialchars(user_id),"''","''",htmlspecialchars(current_date),0], function (error, results, fields) {
                if (error)
                { 
                    connection.release();
                    //console.log("f")
                    reject(error);
                    
                }
                else
                {
                    connection.release();
                    //console.log("t")
                    resolve(results);
                    
                }
            });
        });
    });
};
exports.view_call_summary_count = async function(form_data) 
{
    var user_id = form_data.id;
    const pattern = date.compile('YYYY-MM-DD');
    const now = new Date();
    var current_date = date.format(now, pattern);
    console.log(current_date);

    var last_date=new Date(now.setDate(now.getDate()-1));
    console.log(last_date);
    var yesterday_date = date.format(last_date, pattern);
    
    return new Promise(function(resolve, reject) 
    {
        mysqlpool.getConnection(async function(err, connection) 
        {
            await connection.query(`select count(*) as total_count, 
            (select count(*) from ndr_call_details where calling_date <= "`+current_date+`" and user_id = "`+user_id+`" and is_deleted = 0 and status = 1) as today_count,
            (select count(*) from ndr_call_details where DATE(calling_date) <= "`+current_date+`" and DATE(modified_date) = "`+current_date+`" and user_id = "`+user_id+`" and updated_user_id = "`+user_id+`" and is_deleted = 0 and status = 1) as today_attended_count,
            (select count(*) from ndr_call_details where calling_date <= "`+yesterday_date+`" and user_id = "`+user_id+`" and is_deleted = 0 and status = 1) as Yesterday_count,
            (select count(*) from ndr_call_details where DATE(calling_date) <= "`+yesterday_date+`" and DATE(modified_date) = "`+yesterday_date+`" and user_id = "`+user_id+`" and updated_user_id = "`+user_id+`" and is_deleted = 0 and status = 1) as yesterday_attended_count
             from ndr_call_details where calling_date <= "`+current_date+`" and user_id = "`+user_id+`" and is_deleted = 0 and status = 1`, function (error, results, fields) {
                if (error)
                { 
                    connection.release();
                    //console.log("f")
                    reject(error);
                }
                else
                {
                    connection.release();
                    //console.log("t")
                    resolve(results);
                }
            });
        });
    });
};

exports.view_call_status_count = async function(form_data) 
{
    var user_id = form_data.id;
    const pattern = date.compile('YYYY-MM-DD');
    const now = new Date();
    var current_date = date.format(now, pattern);  
    
    return new Promise(function(resolve, reject) 
    {
        mysqlpool.getConnection(async function(err, connection) 
        {
            await connection.query(`select count(*) as total_count, 
            (select count(*) from ndr_call_details where calling_date <= "`+current_date+`" and user_id = "`+user_id+`" and remark_id = "0" and is_deleted = 0 and status = 1) as new_count,
            (select count(*) from ndr_call_details where calling_date <= "`+current_date+`" and user_id = "`+user_id+`"  and DATE(modified_date) = "`+current_date+`" and user_id = "`+user_id+`" and updated_user_id = "`+user_id+`" and remark_id = "0" and is_deleted = 0 and status = 1) as todays_attended_new_count,
            (select count(*) from ndr_call_details where calling_date <= "`+current_date+`" and user_id = "`+user_id+`"  and remark_id = "1" and is_deleted = 0 and status = 1) as ringing_count,
            (select count(*) from ndr_call_details where calling_date <= "`+current_date+`" and user_id = "`+user_id+`"  and DATE(modified_date) = "`+current_date+`" and user_id = "`+user_id+`" and updated_user_id = "`+user_id+`" and remark_id = "1" and is_deleted = 0 and status = 1) as todays_attended_ringing_count,
            (select count(*) from ndr_call_details where calling_date <= "`+current_date+`" and user_id = "`+user_id+`" and remark_id = "2" and is_deleted = 0 and status = 1) as reschedule_call_count,
            (select count(*) from ndr_call_details where calling_date <= "`+current_date+`" and user_id = "`+user_id+`"  and DATE(modified_date) = "`+current_date+`" and user_id = "`+user_id+`" and updated_user_id = "`+user_id+`" and remark_id = "2" and is_deleted = 0 and status = 1) as todays_attended_reschedule_call_count,
            (select count(*) from ndr_call_details where calling_date <= "`+current_date+`" and user_id = "`+user_id+`" and remark_id = "3" and is_deleted = 0 and status = 1) as reattempt_count,
            (select count(*) from ndr_call_details where calling_date <= "`+current_date+`" and user_id = "`+user_id+`"  and DATE(modified_date) = "`+current_date+`" and user_id = "`+user_id+`" and updated_user_id = "`+user_id+`" and remark_id = "3" and is_deleted = 0 and status = 1) as todays_attended_reattempt_count,
            (select count(*) from ndr_call_details where calling_date <= "`+current_date+`" and user_id = "`+user_id+`" and remark_id = "4" and is_deleted = 0 and status = 1) as rto_count,
            (select count(*) from ndr_call_details where calling_date <= "`+current_date+`" and user_id = "`+user_id+`"  and DATE(modified_date) = "`+current_date+`" and user_id = "`+user_id+`" and updated_user_id = "`+user_id+`" and remark_id = "4" and is_deleted = 0 and status = 1) as todays_attended_rto_count,
            (select count(*) from ndr_call_details where calling_date <= "`+current_date+`" and user_id = "`+user_id+`" and remark_id = "5" and is_deleted = 0 and status = 1) as other_count,
            (select count(*) from ndr_call_details where calling_date <= "`+current_date+`" and user_id = "`+user_id+`"  and DATE(modified_date) = "`+current_date+`" and user_id = "`+user_id+`" and updated_user_id = "`+user_id+`" and remark_id = "5" and is_deleted = 0 and status = 1) as todays_attended_other_count,
            (select count(*) from ndr_call_details where calling_date <= "`+current_date+`" and user_id = "`+user_id+`" and remark_id = "6" and is_deleted = 0 and status = 1) as close_count,
            (select count(*) from ndr_call_details where calling_date <= "`+current_date+`" and user_id = "`+user_id+`"  and DATE(modified_date) = "`+current_date+`" and user_id = "`+user_id+`" and updated_user_id = "`+user_id+`" and remark_id = "6" and is_deleted = 0 and status = 1) as todays_attended_close_count
             from ndr_call_details where calling_date <= "`+current_date+`" and  user_id = "`+user_id+`" and is_deleted = 0 and status = 1`, function (error, results, fields) {
                if (error)
                { 
                    connection.release();
                    //console.log("f")
                    reject(error);
                }
                else
                {
                    connection.release();
                    //console.log("t")
                    resolve(results);
                }
            });
        });
    });
};

exports.view_call_details = async function(form_data) 
{
    var user_id = form_data.id;
    var remark_id = form_data.remark_id;
    const pattern = date.compile('YYYY-MM-DD');
    const now = new Date();
    var current_date = date.format(now, pattern);
    var reschedule_date = '';
    if(remark_id == 2)
    {
        reschedule_date = ` and reschedule_date = "`+current_date+`" `;
    }
    
    return new Promise(function(resolve, reject) 
    {
        mysqlpool.getConnection(async function(err, connection) 
        {
            await connection.query(`SELECT DISTINCT  ncd.id,
            ncd.airway_bill_no, 
            ncd.remark_id,
            ncd.recording_file,
            ncd.reschedule_date,
            ncd.reattempt_date,
            ncd.rto_remarks,
            ncd.modified_date,
            ncd.total_attempt,
            ncd.other_remarks,
            u.first_name,
            u.last_name,
            u.company_name,  
            om.customer_address,
            om.pincode,
            om.customer_city,
            om.customer_country,
            om.user_id,
            om.customer_name,
            om.airway_bill_no,
            om.customer_mobile,
            om.customer_name,
            om.product_description,
            om.product_mrp,
            om.final_order_total,
            om.order_type,
            ud.dispatch_count as ndr_visit_count,
            ud.last_scan_date as last_inscan_datetime,
            ud.remarks as ndr_remark,
            ud.status
            FROM ndr_call_details ncd
            LEFT JOIN order_management om
            ON ncd.airway_bill_no = om.airway_bill_no
            LEFT JOIN user u ON om.user_id = u.id
            LEFT JOIN undelivered_orders ud
            on om.id = ud.o_m_row_id
            where ncd.user_id = "`+user_id+`" and ncd.remark_id = "`+remark_id+`" and ncd.calling_date <= "`+current_date+`" and ncd.is_deleted = 0 and ud.status = 0 and ncd.status = 1 order by om.customer_mobile,ncd.total_attempt desc`, function (error, results, fields) {
                if (error)
                { 
                    connection.release();
                    //console.log("f")
                    reject(error);
                }
                else
                {
                    connection.release();
                    //console.log("t")
                    resolve(results);
                }
            });
        });
    });
};

exports.view_call_details_pagination = async function(form_data) 
{
    var user_id = form_data.id;
    var remark_id = form_data.remark_id;
    var page = form_data.page;
    const pattern = date.compile('YYYY-MM-DD');
    const now = new Date();
    var current_date = date.format(now, pattern);
    var reschedule_date = '';
    var om_id = '';
    if(user_id != '2716' || user_id != '2717' || user_id != '2720' || user_id != '2850')
    {
        //om_id = `om.user_id="2681"`;
    }
    if(remark_id == 2)
    {
        reschedule_date = ` and reschedule_date = "`+current_date+`" `;
    }
    var limit = '';
    if(page != '')
    {
        var first_limit = (Number(page)*50)+1;
        var last_limit = (Number(page)+1)*50;
        limit = ' limit '+first_limit+', 50';
        console.log(limit);
    }
    else
    {
        limit = ' limit 0, 50'
    }
    console.log(`SELECT DISTINCT  ncd.id,
    ncd.airway_bill_no, 
    ncd.remark_id,
    ncd.recording_file,
    ncd.reschedule_date,
    ncd.reattempt_date,
    ncd.rto_remarks,
    ncd.modified_date,
    ncd.total_attempt,
    ncd.other_remarks,
    u.first_name,
    u.last_name,
    u.company_name,  
    om.user_id,
    om.customer_name,
    om.airway_bill_no,
    om.customer_mobile,
    om.customer_name,
    om.product_description,
    om.product_mrp,
    om.final_order_total,
    om.order_type,
    ud.dispatch_count as ndr_visit_count,
    ud.last_scan_date as last_inscan_datetime,
    ud.remarks as ndr_remark,
    ud.status
    FROM ndr_call_details ncd
    LEFT JOIN order_management om
    ON ncd.airway_bill_no = om.airway_bill_no
    LEFT JOIN user u ON om.user_id = u.id
    LEFT JOIN undelivered_orders ud
    on om.id = ud.o_m_row_id
    where ncd.user_id = "`+user_id+`" and ncd.remark_id = "`+remark_id+`"  and ncd.calling_date <= "`+current_date+`" and ncd.is_deleted = 0 and ud.status = 0 and ncd.status = 1 order by om.customer_mobile,ncd.total_attempt desc`+limit);
    return new Promise(function(resolve, reject) 
    {
        mysqlpool.getConnection(async function(err, connection) 
        {
            await connection.query(`SELECT DISTINCT  ncd.id,
            ncd.airway_bill_no, 
            ncd.remark_id,
            ncd.recording_file,
            ncd.reschedule_date,
            ncd.reattempt_date,
            ncd.rto_remarks,
            ncd.modified_date,
            ncd.total_attempt,
            ncd.other_remarks,
            ncd.priority,
            u.first_name,
            u.last_name,
            u.company_name, 
            u.vendor_website, 
            om.customer_address,
            om.pincode,
            om.customer_city,
            om.customer_country,
            om.user_id,
            om.customer_name,
            om.airway_bill_no,
            om.customer_mobile,
            om.customer_name,
            om.product_description,
            om.product_mrp,
            om.final_order_total,
            om.order_type,
            ud.dispatch_count as ndr_visit_count,
            ud.last_scan_date as last_inscan_datetime,
            ud.remarks as ndr_remark,
            ud.status,
			ust.store_name
            FROM ndr_call_details ncd
            LEFT JOIN order_management om
            ON ncd.airway_bill_no = om.airway_bill_no
            LEFT JOIN user u ON om.user_id = u.id
            LEFT JOIN undelivered_orders ud
            on om.id = ud.o_m_row_id
			LEFT JOIN user_store ust
            on om.store_id = ust.id
            where ncd.user_id = "`+user_id+`" and ncd.remark_id = "`+remark_id+`" and ncd.calling_date <= "`+current_date+`" and ncd.is_deleted = 0 and ud.status = 0 and ncd.status = 1 order by ncd.priority asc`+limit, function (error, results, fields) {
                if (error)
                { 
                    connection.release();
                    //console.log("f")
                    reject(error);
                }
                else
                {
                    connection.release();
                    //console.log("t")
                    resolve(results);
                }
            });
        });
    });
};

exports.view_call_details_get_count = async function(form_data) 
{
    var user_id = form_data.id;
    var remark_id = form_data.remark_id;
    var page = form_data.page;
    const pattern = date.compile('YYYY-MM-DD');
    const now = new Date();
    var current_date = date.format(now, pattern);
    var reschedule_date = '';
    if(remark_id == 2)
    {
        reschedule_date = ` and reschedule_date = "`+current_date+`" `;
    }
    
    return new Promise(function(resolve, reject) 
    {
        mysqlpool.getConnection(async function(err, connection) 
        {	
            await connection.query(`SELECT count(*) as total
            FROM ndr_call_details ncd
            LEFT JOIN order_management om
            ON ncd.airway_bill_no = om.airway_bill_no
            LEFT JOIN user u ON om.user_id = u.id
            LEFT JOIN undelivered_orders ud
            on om.id = ud.o_m_row_id
            where ncd.user_id = "`+user_id+`" and ncd.remark_id = "`+remark_id+`"  and om.user_id="2681" and ncd.calling_date <= "`+current_date+`" and ncd.is_deleted = 0 and ud.status = 0 and ncd.status = 1 order by om.customer_mobile,ncd.total_attempt desc`, function (error, results, fields) {
                if (error)
                { 
                    connection.release();
                    //console.log("f")
                    reject(error);
                }
                else
                {
                    connection.release();
                    
                    console.log(Object.values(JSON.parse(JSON.stringify(results))));
                    resolve(Object.values(JSON.parse(JSON.stringify(results))));
                }
            });
        });
    });
};



exports.update_call_status = async function(update_query,update_query_data) 
{

  
    return new Promise(function(resolve, reject) 
    {  
        mysqlpool.getConnection(async function(err, connection) 
        {
            await connection.query(update_query,update_query_data,async function (error, results, fields) {
                if (error)                                         
                { 
                    console.log(error);
                    connection.release();
                    reject(0);
                }else
                {
                    console.log(results);
                    connection.release();
                    resolve(1);
                }
            });
        });
    });
};

exports.common_query = async function(update_query) 
{

  
    return new Promise(function(resolve, reject) 
    {  
        mysqlpool.getConnection(async function(err, connection) 
        {
            await connection.query(update_query,async function (error, results, fields) {
                if (error)                                         
                { 
                    console.log(error);
                    connection.release();
                    reject(0);
                }else
                {
                    console.log(results);
                    connection.release();
                    resolve(1);
                }
            });
        });
    });
};

exports.save_call_record_upload_file_name_new = async function(recording_file,id,user_id) 
{
 
    const pattern = date.compile('YYYY-MM-DD');
    const now = new Date();
    var current_date = date.format(now, pattern);  

    return new Promise(function(resolve, reject) 
    {  
        mysqlpool.getConnection(async function(err, connection) 
        {
            await connection.query("update ndr_call_details set recording_file = ?, updated_user_id = ?, modified_date = now() where id= ? and user_id = ?",[recording_file,user_id,id,user_id],async function (error, results, fields) {
                if (error)                                         
                { 
                    console.log(error);
                    connection.release();
                    reject(0);
                }else
                {
                    console.log(results);
                    connection.release();
                    resolve(1);
                }
            });
        });
    });
};

exports.save_call_record_upload_file_name = async function(form_data) 
{
    var recording_file =form_data.file_name;
    var id = form_data.call_recording_id;
    var user_id = form_data.id;
    const pattern = date.compile('YYYY-MM-DD');
    const now = new Date();
    var current_date = date.format(now, pattern);  

    return new Promise(function(resolve, reject) 
    {  
        mysqlpool.getConnection(async function(err, connection) 
        {
            await connection.query("update ndr_call_details set recording_file = ?, updated_user_id = ?, modified_date = now() where id= ? and user_id = ?",[recording_file,user_id,id,user_id],async function (error, results, fields) {
                if (error)                                         
                { 
                    console.log(error);
                    connection.release();
                    reject(0);
                }else
                {
                    console.log(results);
                    connection.release();
                    resolve(1);
                }
            });
        });
    });
};