const validator = require("validator");
const bcrypt = require("bcryptjs");
var express = require("express");
var mysqlpool = require("../dbconfig");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
var session = require("express-session");
const app = express();
const md5 = require("md5");
const date = require("date-and-time");
var randomize = require("randomatic");
var decode = require("decode-html");
const nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");
var htmlspecialchars = require("htmlspecialchars");
const { json } = require("body-parser");

exports.login_user = async function (form_data, req, res, next) {
  var userdata = [];
  userdata = await User.login_user(form_data);
  //console.log(userdata);
  if (userdata.length == 0) {
    res.status(200).json({
      status_code: 400,
      status: "error",
      message: "Email id does not exist.",
    });
    return;
  } else {
    var user_data_array = [];
    const map = new Map();
    for (const user of userdata) {
      var db_user_email = user.email.toLowerCase();
      var formdata_user_email = form_data.email.toLowerCase();
      var db_user_password = user.password;
      var formdata_user_password = md5(form_data.password);
      var user_id = user.id;
      var mobile_token_exp_date = user.mobile_token_exp_date;
      var mobile_access_token = user.mobile_access_token;
      const pattern = date.compile("YYYY-MM-DD");
      const now = new Date();
      var current_date = date.format(now, pattern);
      if ("0000-00-00" === mobile_token_exp_date) {
        mobile_token_exp_date = mobile_token_exp_date;
      } else {
        mobile_token_exp_date = date.format(mobile_token_exp_date, pattern);
      }

      if (mobile_token_exp_date > current_date) {
        mobile_access_token = mobile_access_token;
        mobile_token_exp_date = mobile_token_exp_date;
      } else {
        mobile_access_token = md5(randomize("*", 30)).substr(0, 30);
        mobile_token_exp_date = date.format(date.addYears(now, 1), pattern);
        console.log(mobile_token_exp_date);
        console.log(current_date);
      }
      if (
        db_user_email == formdata_user_email &&
        db_user_password == formdata_user_password
      ) {
        if (user.status == 1 || user.status == 0) {
          map.set(db_user_email, true); // set any value to Map
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
          });

          var update_last_login_and_mobile_access_token =
            await User.update_last_login_and_mobile_access_token(
              user_id,
              mobile_access_token,
              mobile_token_exp_date,
              current_date
            );

          var insert_user_login_details_query =
            await User.insert_user_login_details_query(
              user_id,
              current_date,
              "1"
            );

          res.status(200).json({
            status_code: 200,
            status: "success",
            message: "Login successful",
            user: user_data_array,
          });
          return;
        } else if (user.status == 2) {
          res.status(200).json({
            status_code: 400,
            status: "error",
            message: "Account is blocked. Try to contact Admin.",
          });
          return;
        } else {
          console.log("user status error");
          res.status(200).json({
            status_code: 400,
            status: "error",
            message: "Some Error Occured! Try again later.",
          });
          return;
        }
      } else {
        res.status(200).json({
          status_code: 400,
          status: "error",
          message: "Email id & password does not match.",
        });
        return;
      }
    }
  }
};

exports.view_call_summary_count = async function (form_data, req, res, next) {
  var user_id = htmlspecialchars(form_data.id);

  var call_summary_count_array = [];
  var call_summary_count = await User.view_call_summary_count(form_data);
  for (const call_summary of call_summary_count) {
    call_summary_count_array.push({
      total_count: call_summary.total_count,
      today_count:
        call_summary.today_attended_count + " - " + call_summary.today_count,
      Yesterday_count:
        call_summary.yesterday_attended_count +
        " - " +
        call_summary.Yesterday_count,
    });
  }

  if (call_summary_count.length > 0) {
    res.status(200).json({
      status_code: 200,
      status: "success",
      call_summary_count: call_summary_count_array,
    });
    return;
  } else {
    res.status(200).json({
      status_code: 400,
      status: "error",
      message: "Invalid request..",
    });
    return;
  }
};

exports.view_call_status_count = async function (form_data, req, res, next) {
  var user_id = htmlspecialchars(form_data.id);

  var call_status_count_array = [];
  var call_status_count = await User.view_call_status_count(form_data);
  for (const call_status of call_status_count) {
    call_status_count_array.push({
      total_count: " " + call_status.total_count,
      new_count:
        call_status.todays_attended_new_count + " - " + call_status.new_count,
      ringing_count:
        call_status.todays_attended_ringing_count +
        " - " +
        call_status.ringing_count,
      reschedule_Call_count:
        call_status.todays_attended_reschedule_call_count +
        " - " +
        call_status.reschedule_call_count,
      reattempt_count:
        call_status.todays_attended_reattempt_count +
        " - " +
        call_status.reattempt_count,
      RTO_count:
        call_status.todays_attended_rto_count + " - " + call_status.rto_count,
      other_count:
        call_status.todays_attended_other_count +
        " - " +
        call_status.other_count,
      close_count:
        call_status.todays_attended_close_count +
        " - " +
        call_status.close_count,
    });
  }

  if (call_status_count.length > 0) {
    res.status(200).json({
      status_code: 200,
      status: "success",
      call_status_count: call_status_count_array,
    });
    return;
  } else {
    res.status(200).json({
      status_code: 400,
      status: "error",
      message: "Invalid request..",
    });
    return;
  }
};

exports.view_call_details_pagination = async function (
  form_data,
  req,
  res,
  next
) {
  var user_id = htmlspecialchars(form_data.id);
  var remark_id_from_data = form_data.remark_id;
  var page = form_data.page;
  var is_more_data = 0;
  var last_limit = (Number(page) + 1) * 50;
  if (page != "") {
    last_limit = (Number(page) + 1) * 50;
  } else {
    last_limit = 50;
  }
  var call_status_array = [];
  var call_details = await User.view_call_details_pagination(form_data);
  var get_total_count = await User.view_call_details_get_count(form_data);
  console.log(get_total_count[0].total);
  if (
    last_limit < get_total_count[0].total &&
    last_limit != get_total_count[0].total
  ) {
    is_more_data = 1;
  } else {
    is_more_data = 0;
  }
  console.log(call_details);
  const pattern = date.compile("DD-MM-YYYY");
  const pattern2 = date.compile("DD-MM-YYYY hh:mm A");
  const now = new Date();
  var current_date = date.format(now, pattern);
  var set_mobile = 0;
  var set_mobile_number = "";
  for (const call_detail of call_details) {
    if (set_mobile == 0) {
      set_mobile_number = "8097228680";
      set_mobile = 1;
    } else {
      set_mobile_number = "8097228680";
      set_mobile = 0;
    }
    if (call_detail.total_attempt <= 3) {
      call_status_array.push({
        id: call_detail.id,
        airway_bill_no:
          call_detail.airway_bill_no == null
            ? "NA"
            : call_detail.airway_bill_no,
        remark_id: call_detail.remark_id == null ? "NA" : call_detail.remark_id,
        recording_file:
          call_detail.recording_file == null
            ? "NA"
            : call_detail.recording_file,
        first_name:
          call_detail.first_name == null ? "NA" : call_detail.first_name,
        last_name: call_detail.last_name == null ? "NA" : call_detail.last_name,
        company_name:
		call_detail.store_name != null
		? call_detail.store_name : call_detail.vendor_website != ""
            ? call_detail.vendor_website
            : call_detail.company_name == null
            ? "NA"
            : call_detail.company_name,

        user_id: call_detail.user_id == null ? "NA" : call_detail.user_id,
        customer_name:
          call_detail.customer_name == null
            ? "NA"
            : call_detail.customer_name + "-(" + call_detail.id + ")",
        customer_mobile:
          call_detail.customer_mobile == null
            ? "NA"
            : validate_mobile_numbers(call_detail.customer_mobile), //call_detail.customer_mobile,8097228680
        product_description:
          call_detail.product_description == null
            ? "NA"
            : call_detail.product_description,
        final_order_total:
          call_detail.final_order_total == null
            ? "0"
            : call_detail.final_order_total,
        order_type:
          call_detail.order_type == null
            ? "NA"
            : call_detail.order_type.toUpperCase() +
              "  $  " +
              call_detail.customer_address +
              ", " +
              call_detail.pincode +
              ", " +
              call_detail.customer_city +
              "-" +
              call_detail.customer_state +
              "," +
              call_detail.customer_country,
        ndr_visit_count:
          call_detail.ndr_visit_count == null
            ? "NA"
            : call_detail.ndr_visit_count,
        last_inscan_datetime:
          call_detail.last_inscan_datetime == null
            ? "NA"
            : date.format(call_detail.last_inscan_datetime, pattern),
        ndr_remark:
          call_detail.ndr_remark == null ? "NA" : call_detail.ndr_remark,
        ndr_remark:
          call_detail.ndr_remark == null ? "NA" : call_detail.ndr_remark,
        total_attempt:
          call_detail.total_attempt == null ? "NA" : call_detail.total_attempt,
        other_remarks:
          call_detail.other_remarks == null ? "NA" : call_detail.other_remarks,
        is_calling:
          call_detail.remark_id != 2
            ? 1
            : call_detail.reschedule_date == "0000-00-00 00:00:00"
            ? 1
            : date.format(call_detail.reschedule_date, pattern) == current_date
            ? 1
            : 0,
        reschedule_date:
          call_detail.reschedule_date == "0000-00-00 00:00:00"
            ? ""
            : date.format(call_detail.reschedule_date, pattern),
        reattempt_date:
          call_detail.reattempt_date == "0000-00-00 00:00:00"
            ? ""
            : date.format(call_detail.reattempt_date, pattern),
        last_call_date:
          call_detail.modified_date == "0000-00-00 00:00:00"
            ? "NA"
            : date.format(call_detail.modified_date, pattern2),
        rto_remark:
          call_detail.rto_remarks == "" ? "" : call_detail.rto_remarks,
        is_record_playing: 0,
      });
    }
  }

  if (call_details.length > 0) {
    res.status(200).json({
      status_code: 200,
      status: "success",
      remark_id: remark_id_from_data,
      call_details: call_status_array,
      is_more_data: is_more_data,
      total: get_total_count[0].total,
      last_limit: last_limit,
    });
    return;
  } else {
    res.status(200).json({
      status_code: 400,
      status: "error",
      message: "Invalid request..",
      call_details: [],
      is_more_data: is_more_data,
    });
    return;
  }
};

function validate_mobile_numbers(input_number) {
  input_number = input_number.replace(/\W|_/g, ""); //remove all special chaarc and alphabets
  //console.log(input_number);
  input_number = input_number.replace(" ", "");

  var filter3 = input_number;

  if (input_number.length == 12) {
    var filter2 = input_number.substr(0, 2); //identify 91 in prefix
    if (filter2 == "91") {
      filter3 = input_number.substr(2, 12); //extract first 10 digits
    }
  } else if (input_number.length == 11) {
    filter2 = input_number.substr(0, 1); //identify 0 in prefix
    if (filter2 == "0") {
      filter3 = input_number.substr(1, 11); //extract first 10 digits
    }
  }
  //console.log(filter3);
  return filter3;
}

exports.update_call_status = async function (form_data, req, res, next) {
    //console.log(form_data)
    var ndr_call_details_id = htmlspecialchars(form_data.ndr_call_details_id);
    var call_details_update_status;
    var user_id = form_data.id;
    const pattern = date.compile("YYYY-MM-DD HH:MM:SS");
    var now = new Date();
  var loggedin_user_id;
  var ndr_action_user_id;

  var is_from_backend;
var is_more_data = []; 
var order_management_query; 
var get_order_management_query; 
var result_order_management_query; 
var all_order_management_data_array = []; 
var om_row_id; 
var get_om_data_query; 
var om_result_get_query; 
var  all_om_row_data_array = []; 
var om_row_get_query; 
var created_date=""; 
var update_itl_custom_query=""; 
var om_status=""; 
var logistic_id=""; 
var om_user_id=""; 
var dispatch_count; 
var last_scan_date=""; 
var remarks=""; 
var comment_category_id=""; 
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
    var time_array = form_data.airway_bill_no + "_" + d;
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
    var call_recording = form_data.recording_file;
    var airway_bill_no = htmlspecialchars(form_data.airway_bill_no);
    var ndr_action = htmlspecialchars(form_data.ndr_action);
    var call_recording_id = htmlspecialchars(form_data.call_recording_id);
    var recording_file = form_data.recording_file;
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
  
    var call_details_save_record_file_name = await User.save_call_record_upload_file_name_new( 
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

      if (typeof action_by_user_id !== "undefined") {
        loggedin_user_id = action_by_user_id;
      } else {
        loggedin_user_id = 1;
      }
      ndr_action_user_id = loggedin_user_id;
     
      if (typeof is_from_backend !== "undefined") {
        is_from_backend = is_from_backend; 
      } else {
        is_from_backend = 0;
      }
      
      if (ndr_action == "9") {
        if (scheduled_call_date_time != "") {
          scheduled_call_date_time = date.format(
            new Date(scheduled_call_date_time),
            "Y-m-d H:i:s"
          );
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
          reattempt_date_time = date.format(
            new Date(reattempt_date_time),
            "Y-m-d H:i:s"
          );
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
      if (airway_bill_no != "") {
        order_management_query = 
          "SELECT id from order_management where airway_bill_no=" +
          airway_bill_no +
          " and is_reverse = 0 and is_deleted = 0";
        result_order_management_query = await User.common_query(
          order_management_query
        );
       
        // while (
        //   (get_order_management_query = mysqli_fetch_assoc(
        //     result_order_management_query
        //   ))
        // ) {
        //   all_order_management_data_array = get_order_management_query;
        // }
		all_order_management_data_array = result_order_management_query;
        if (true) {
          if (all_order_management_data_array.length > 0) {
            om_row_id = all_order_management_data_array["id"];
            get_om_data_query = 
              "SELECT om.customer_mobile,om.customer_phone_number,om.customer_address as om_customer_address,om.customer_address1 as om_customer_address1,om.customer_address2 as om_customer_address2,om.customer_address3 as om_customer_address3,om.customer_country as om_customer_country,om.customer_state as om_customer_state,om.customer_city as om_customer_city,om.pincode as om_customer_pincode,uo.*,l.logistics_name,om.airway_bill_no,om.product_description,u.first_name,u.last_name,u.company_name,om.logistic_id as om_logistic_id,om.logistics_service_type as om_logistics_service_type,om.new_live_status,om.customer_name,u.email,om.order_sub_order_no,om.is_reverse from undelivered_orders uo LEFT JOIN order_management om ON om.id = uo.o_m_row_id LEFT JOIN logistics l ON uo.logistic_id = l.id LEFT JOIN user u ON uo.user_id = u.id where uo.o_m_row_id = " +
              om_row_id +
              " and uo.is_deleted = '0'";
              om_result_get_query = await User.common_query(get_om_data_query); 
			  all_om_row_data_array = om_result_get_query; 
            // while ((om_row_get_query = mysqli_fetch_assoc(om_result_get_query))) {
            //   k__1 = Settlement.default_key(all_om_row_data_array);
            //   all_om_row_data_array[k__1] = om_row_get_query;
            // }
            if (all_om_row_data_array.length > 0) {
              created_date = date.format(new Date(), "Y-m-d H:i:s");
              update_itl_custom_query = "";
              om_status = all_om_row_data_array[0]["status"];
              logistic_id = all_om_row_data_array[0]["logistic_id"];
              om_user_id = all_om_row_data_array[0]["user_id"];
              om_row_id = all_om_row_data_array[0]["o_m_row_id"];
              dispatch_count = all_om_row_data_array[0]["dispatch_count"];
              last_scan_date = all_om_row_data_array[0]["last_scan_date"];
              remarks = all_om_row_data_array[0]["remarks"];
              comment_category_id = all_om_row_data_array[0]["comment_category_id"];
              issue_id = all_om_row_data_array[0]["issue_id"];
              logistics_name = all_om_row_data_array[0]["logistics_name"];
              airway_bill_no = all_om_row_data_array[0]["airway_bill_no"];
              product_description = all_om_row_data_array[0]["product_description"];
              vendor_company_name = all_om_row_data_array[0]["company_name"];
              ivr_response = all_om_row_data_array[0]["ivr_response"];
              ndr_call_response = all_om_row_data_array[0]["ndr_call_response"];
              itl_dispatch_count_vs_action =
              all_om_row_data_array[0]["itl_dispatch_count_vs_action"];
              vendor_dispatch_count_vs_action =
              all_om_row_data_array[0]["vendor_dispatch_count_vs_action"];
              buyer_dispatch_count_vs_action =
              all_om_row_data_array[0]["buyer_dispatch_count_vs_action"];
              customer_address = all_om_row_data_array[0]["om_customer_address"];
              customer_pincode = all_om_row_data_array[0]["om_customer_pincode"]; 
              is_reverse = all_om_row_data_array[0]["is_reverse"];
              dispatch_count_vs_manual_ndr_call_count =
              all_om_row_data_array[0]["dispatch_count_vs_manual_ndr_call_count"]; 



              if (all_om_row_data_array[0]["customer_mobile"] != "") {
                customer_mobile = all_om_row_data_array[0]["customer_mobile"];
              } else {
                customer_mobile = all_om_row_data_array[0]["customer_phone_number"];
              }
              // $customer_mobile        = "+918898238172";
              if (customer_mobile.length == 13) {
                customer_mobile = customer_mobile.replace("/^\\+91/", "", customer_mobile);
              }
              if (customer_mobile.length == 12) {
                customer_mobile = customer_mobile.replace("/^91/", "", customer_mobile);
              }
              if (customer_mobile.length == 11) {
                customer_mobile = customer_mobile.replace("/^0/", "", customer_mobile);
              }
              if (om_status == 0) {
                logistic_key_id = all_om_row_data_array[0]["om_logistic_id"]; 
                logistics_service_type =
                all_om_row_data_array[0]["om_logistics_service_type"];
                new_live_status = all_om_row_data_array[0]["new_live_status"];
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
                  "itl_dispatch_count_vs_action = " +
                  itl_dispatch_count_vs_action +
                  ", ";
                if (
                  dispatch_count_vs_manual_ndr_call_count.length > 0 &&
                  dispatch_count_vs_manual_ndr_call_count != ""
                ) {
                  dispatch_count_vs_manual_ndr_call_count_array =
                    Settlement.explode(
                      ",",
                      dispatch_count_vs_manual_ndr_call_count
                    );
                  latest_dispatch_count_vs_manual_ndr_call_count_data = end(
                    dispatch_count_vs_manual_ndr_call_count_array
                  );
                  latest_dispatch_count_vs_manual_ndr_call_count_array =
                    Settlement.explode(
                      "-",
                      latest_dispatch_count_vs_manual_ndr_call_count_data
                    );
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
                    dispatch_count_vs_manual_ndr_call_count = substr(
                      dispatch_count_vs_manual_ndr_call_count,
                      0,
                      -1
                    );
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
                  "dispatch_count_vs_manual_ndr_call_count = " +
                  dispatch_count_vs_manual_ndr_call_count +
                  ", ";
                if (ndr_action == 8 || ndr_action == 12 || ndr_action == 13) {
                  //NDR Call Not Received
                  insert_ndr_timeline_history_query =
                    "INSERT INTO ndr_timeline_history (logistic_id,user_id,om_row_id,dispatch_count,last_scan_date,remarks,scheduled_call_date_time,ndr_action,ndr_action_by,ndr_action_user_id,comment_category_id,issue_id,created_date,is_deleted,entry_point,ndr_call_response,call_recording,other_remarks) VALUES (" +
                    logistic_id +
                    "," +
                    user_id +
                    "," +
                    om_row_id +
                    "," +
                    dispatch_count +
                    "," +
                    last_scan_date +
                    "," +
                    remarks +
                    ",''," +
                    ndr_action +
                    "," +
                    ndr_action_by +
                    "," +
                    loggedin_user_id +
                    "," +
                    comment_category_id +
                    "," +
                    issue_id +
                    "," +
                    created_date +
                    ",'0','11','3'," +
                    call_recording +
                    "," +
                    other_remarks +
                    ");";
                  result_insert_ndr_timeline_history_query =
                    await User.common_query(insert_ndr_timeline_history_query);
                } else {
                  if (ndr_action == 9) {
                    //NDR Call Reschedule
                    insert_ndr_timeline_history_query =
                      "INSERT INTO ndr_timeline_history (logistic_id,user_id,om_row_id,dispatch_count,last_scan_date,remarks,scheduled_call_date_time,ndr_action,ndr_action_by,ndr_action_user_id,comment_category_id,issue_id,created_date,is_deleted,entry_point,ndr_call_response,call_recording) VALUES (" +
                      logistic_id +
                      "," +
                      user_id +
                      "," +
                      om_row_id +
                      "," +
                      dispatch_count +
                      "," +
                      last_scan_date +
                      "," +
                      remarks +
                      ",''," +
                      ndr_action +
                      "," +
                      ndr_action_by +
                      "," +
                      loggedin_user_id +
                      "," +
                      comment_category_id +
                      "," +
                      issue_id +
                      "," +
                      created_date +
                      ",'0','11','3'," +
                      call_recording +
                      ");";
                    result_insert_ndr_timeline_history_query =
                      await User.common_query(insert_ndr_timeline_history_query);
                  } else {
                    if (ndr_action == 10) {
                      //NDR Call Reattempt
                      insert_ndr_timeline_history_query =
                        "INSERT INTO ndr_timeline_history (logistic_id,user_id,om_row_id,dispatch_count,last_scan_date,remarks,scheduled_call_date_time,ndr_action,ndr_action_by,ndr_action_user_id,comment_category_id,issue_id,created_date,is_deleted,entry_point,ndr_call_response,call_recording) VALUES (" +
                        logistic_id +
                        "," +
                        user_id +
                        "," +
                        om_row_id +
                        "," +
                        dispatch_count +
                        "," +
                        last_scan_date +
                        "," +
                        remarks +
                        ",''," +
                        ndr_action +
                        "," +
                        ndr_action_by +
                        "," +
                        loggedin_user_id +
                        "," +
                        comment_category_id +
                        "," +
                        issue_id +
                        "," +
                        created_date +
                        ",'0','11','3'," +
                        call_recording +
                        ");";
                      result_insert_ndr_timeline_history_query =
                        await User.common_query(
                          insert_ndr_timeline_history_query
                        );
                    } else {
                      if (ndr_action == 11) {
                        // NDR Call RTO
                        insert_ndr_timeline_history_query =
                          "INSERT INTO ndr_timeline_history (logistic_id,user_id,om_row_id,dispatch_count,last_scan_date,remarks,scheduled_call_date_time,ndr_action,ndr_action_by,ndr_action_user_id,comment_category_id,issue_id,created_date,is_deleted,entry_point,ndr_call_response,call_recording,rto_remark) VALUES (" +
                          logistic_id +
                          "," +
                          user_id +
                          "," +
                          om_row_id +
                          "," +
                          dispatch_count +
                          "," +
                          last_scan_date +
                          "," +
                          remarks +
                          ",''," +
                          ndr_action +
                          "," +
                          ndr_action_by +
                          "," +
                          loggedin_user_id +
                          "," +
                          comment_category_id +
                          "," +
                          issue_id +
                          "," +
                          created_date +
                          ",'0','11','3'," +
                          call_recording +
                          "," +
                          rto_remark +
                          ");";
                        result_insert_ndr_timeline_history_query =
                          await User.common_query(
                            insert_ndr_timeline_history_query
                          );
                      } else {
                      }
                    }
                  }
                }
                if (result_insert_ndr_timeline_history_query.insertId != 0) {
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
                    //$ndr_action_user_id                                   = '0';
                    if (
                      strlen(buyer_dispatch_count_vs_action) > 0 &&
                      buyer_dispatch_count_vs_action != ""
                    ) {
                      buyer_dispatch_count_vs_action +=
                        "," + dispatch_count + "-" + ndr_action;
                    } else {
                      buyer_dispatch_count_vs_action =
                        dispatch_count + "-" + ndr_action;
                    }
                    update_buyer_custom_query +=
                      "buyer_dispatch_count_vs_action = " +
                      buyer_dispatch_count_vs_action +
                      ", ";
                    insert_buyer_response_ndr_timeline_history_query =
                      "INSERT INTO ndr_timeline_history (logistic_id,user_id,om_row_id,dispatch_count,last_scan_date,remarks,scheduled_call_date_time,ndr_action,ndr_action_by,ndr_action_user_id,comment_category_id,issue_id,created_date,is_deleted,entry_point,ndr_call_response) VALUES (" +
                      logistic_id +
                      "," +
                      user_id +
                      "," +
                      om_row_id +
                      "," +
                      dispatch_count +
                      "," +
                      last_scan_date +
                      "," +
                      remarks +
                      "," +
                      scheduled_call_date_time +
                      "," +
                      ndr_action +
                      ",'4','0'," +
                      comment_category_id +
                      "," +
                      issue_id +
                      "," +
                      created_date +
                      ",'0','11'," +
                      ndr_call_response +
                      ");";
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
                        "buyer_dispatch_count_vs_action = " +
                        buyer_dispatch_count_vs_action +
                        ", ";
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
                        "itl_dispatch_count_vs_action = " +
                        itl_dispatch_count_vs_action +
                        ", ";
                    }
                    insert_buyer_response_ndr_timeline_history_query =
                      "INSERT INTO ndr_timeline_history (logistic_id,user_id,om_row_id,dispatch_count,last_scan_date,remarks,scheduled_call_date_time,ndr_action,ndr_action_by,ndr_action_user_id,comment_category_id,issue_id,created_date,is_deleted,entry_point,ndr_call_response) VALUES (" +
                      logistic_id +
                      "," +
                      user_id +
                      "," +
                      om_row_id +
                      "," +
                      dispatch_count +
                      "," +
                      last_scan_date +
                      "," +
                      remarks +
                      "," +
                      reattempt_date_time +
                      "," +
                      ndr_action +
                      ",'4','0'," +
                      comment_category_id +
                      "," +
                      issue_id +
                      "," +
                      created_date +
                      ",'0','11'," +
                      ndr_call_response +
                      ");";
                    result_insert_buyer_response_ndr_timeline_history_query =
                      await User.common_query(
                        insert_buyer_response_ndr_timeline_history_query
                      );
                    if (
                      result_insert_buyer_response_ndr_timeline_history_query ==
                        1 &&
                      is_reverse == "0"
                    ) {
                      ndr_action = "1";
                      ndr_action_by = "3";
                      //$ndr_action_user_id                                   = '1';
                      insert_reattempt_ndr_timeline_history_query =
                        "INSERT INTO ndr_timeline_history (logistic_id,user_id,om_row_id,dispatch_count,last_scan_date,remarks,scheduled_call_date_time,ndr_action,ndr_action_by,ndr_action_user_id,comment_category_id,issue_id,created_date,is_deleted,entry_point,ndr_call_response,reattempt_date_time) VALUES (" +
                        logistic_id +
                        "," +
                        user_id +
                        "," +
                        om_row_id +
                        "," +
                        dispatch_count +
                        "," +
                        last_scan_date +
                        "," +
                        remarks +
                        "," +
                        reattempt_date_time +
                        ",'1','3','1'," +
                        comment_category_id +
                        "," +
                        issue_id +
                        "," +
                        created_date +
                        ",'0','11'," +
                        ndr_call_response +
                        "," +
                        reattempt_date_time +
                        ");";
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
                      strlen(buyer_dispatch_count_vs_action) > 0 &&
                      buyer_dispatch_count_vs_action != ""
                    ) {
                      buyer_dispatch_count_vs_action +=
                        "," + dispatch_count + "-" + temp_ndr_action;
                    } else {
                      buyer_dispatch_count_vs_action =
                        dispatch_count + "-" + temp_ndr_action;
                    }
                    update_buyer_custom_query +=
                      "buyer_dispatch_count_vs_action = " +
                      buyer_dispatch_count_vs_action +
                      ", ";
                    insert_buyer_response_ndr_timeline_history_query =
                      "INSERT INTO ndr_timeline_history (logistic_id,user_id,om_row_id,dispatch_count,last_scan_date,remarks,scheduled_call_date_time,ndr_action,ndr_action_by,ndr_action_user_id,comment_category_id,issue_id,created_date,is_deleted,entry_point,ndr_call_response) VALUES (" +
                      logistic_id +
                      "," +
                      user_id +
                      "," +
                      om_row_id +
                      "," +
                      dispatch_count +
                      "," +
                      last_scan_date +
                      "," +
                      remarks +
                      "," +
                      scheduled_call_date_time +
                      "," +
                      ndr_action +
                      ",'4','0'," +
                      comment_category_id +
                      "," +
                      issue_id +
                      "," +
                      created_date +
                      ",'0','11'," +
                      ndr_call_response +
                      ");";
                    result_insert_buyer_response_ndr_timeline_history_query =
                      await User.common_query(
                        insert_buyer_response_ndr_timeline_history_query
                      );
                    if (
                      result_insert_buyer_response_ndr_timeline_history_query == 1
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
                  // return["status"] = "success";
                  // return["file_name"] = call_recording;
                  // return["status_code"] = 200;
                  // return["message"] = 'Data Inserted Sucessfully';
                  // console.log(json_encode(return));
                  // exit;
                  // res.status(200).json({
                  //  status_code : 400,
                  //  status: 'error',
                  //  message : "Please Enter Reattempt Date",
                  //  is_more_data: is_more_data
                  // });
                  // return;
                } else {
                  // return["message"] = 'Some Error Occured While adding NDR Escalation Data';
                  // return["status_code"] = 200;
                  // return["status"] = "error";
                  // console.log(json_encode(return));
                  // exit;
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
                  // return["status"] = "error";
                  // return["status_code"] = 200;
                  // return["message"] = 'Parcel is Delivered';
                  // console.log(json_encode(return));
                  res.status(200).json({
                    status_code: 400,
                    status: "error",
                    message: "Parcel is Delivered", 
                  });
                  return;
                  // exit;
                } else {
                  if (om_status == 2) {
                    //     return["status"] = "error";
                    //     return["status_code"] = 200;
                    //     return["message"] = 'Parcel is RTO Delivered';
                    //     console.log(json_encode(return));
                    //     exit;
                    res.status(200).json({
                      status_code: 400,
                      status: "error",
                      message: "Parcel is RTO Delivered",
                    });
                    return;
                  } else {
                    // return["status"] = "error";
                    // return["status_code"] = 200;
                    // return["message"] = 'Some Error Occured.Please Try Again';
                    // console.log(json_encode(return));
                    // exit;
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
              // return["status"] = "error";
              // return["status_code"] = 200;
              // return["message"] = 'Not Found Undelivered order Data';
              // console.log(json_encode(return));
              // exit;
              res.status(200).json({
                status_code: 400,
                status: "error",
                message: "Not Found Undelivered order Data",
              });
              return;
            }
          } else {
            // return["status"] = "error";
            // return["status_code"] = 200;
            // return["message"] = 'Some Error Occured.Please Try Again';
            // console.log(json_encode(return));
            // exit;
            res.status(200).json({
              status_code: 400,
              status: "error",
              message: "Some Error Occured.Please Try Again",
            });
            return;
          }
        } else {
          // return["status"] = "error";
          // return["status_code"] = 200;
          // return["message"] = 'Not Found Data';
          // console.log(json_encode(return));
          // exit;
          res.status(200).json({
            status_code: 400,
            status: "error",
            message: "Not Found Data",
          });
          return;
        }
      } else {
        // return["status"] = "error";
        // return["status_code"] = 200;
        // return["message"] = "Access Token Not Match";
        // console.log(json_encode(return));
        // exit;
        res.status(200).json({
          status_code: 400,
          status: "error",
          message: "Access Token Not Match",
        });
        return;
      }
  
      //console.log(call_details);
      if (call_details_update_status == 1) { 
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
  // else
  // {
  //     res.status(200).json({
  //         status_code : 400,
  //         status: 'error',
  //         message: body.message
  //     });
  //     return;
  // }
  //}
  //console.dir(JSON.parse(body));
  //});
  
  //};
  
  // Manage core logic by this variable
  var Settlement = [];
  Settlement.count = function (mixed_var, mode) {
    var key,
      cnt = 0;
    if (mixed_var === null || typeof mixed_var === "undefined") {
      return 0;
    } else if (
      mixed_var.constructor !== Array &&
      mixed_var.constructor !== Object
    ) {
      return 1;
    }
    if (mode === 1) {
      mode = 1;
    }
    if (mode != 1) {
      mode = 0;
    }
    for (key in mixed_var) {
      if (mixed_var.hasOwnProperty(key)) {
        cnt++;
        if (
          mode == 1 &&
          mixed_var[key] &&
          (mixed_var[key].constructor === Array ||
            mixed_var[key].constructor === Object)
        ) {
          cnt += this.count(mixed_var[key], 1);
        }
      }
    }
    return cnt;
  };
  Settlement.strtotime = function (text, now) {
    var parsed,
      match,
      today,
      year,
      date,
      days,
      ranges,
      len,
      times,
      regex,
      i,
      fail = false;
    if (!text) {
      return fail;
    }
    // Unecessary spaces
    text = text
      .replace(/^\s+|\s+$/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/[\t\r\n]/g, "")
      .toLowerCase();
    // js Date.parse function interprets:
    // dates given as yyyy-mm-dd as in timezone: UTC,
    // dates with "." or "-" as MDY instead of DMY
    // dates with two-digit years differently
    // etc...etc...
    // ...therefore we manually parse lots of common date formats
    match = text.match(
      /^(\d{1,4})([\-\.\/\:])(\d{1,2})([\-\.\/\:])(\d{1,4})(?:\s(\d{1,2}):(\d{2})?:?(\d{2})?)?(?:\s([A-Z]+)?)?$/
    );
    if (match && match[2] === match[4]) {
      if (match[1] > 1901) {
        switch (match[2]) {
          case "-": {
            // YYYY-M-D
            if (match[3] > 12 || match[5] > 31) {
              return fail;
            }
            return (
              new Date(
                match[1],
                parseInt(match[3], 10) - 1,
                match[5],
                match[6] || 0,
                match[7] || 0,
                match[8] || 0,
                match[9] || 0
              ) / 1000
            );
          }
          case ".": {
            // YYYY.M.D is not parsed by strtotime()
            return fail;
          }
          case "/": {
            // YYYY/M/D
            if (match[3] > 12 || match[5] > 31) {
              return fail;
            }
            return (
              new Date(
                match[1],
                parseInt(match[3], 10) - 1,
                match[5],
                match[6] || 0,
                match[7] || 0,
                match[8] || 0,
                match[9] || 0
              ) / 1000
            );
          }
        }
      } else if (match[5] > 1901) {
        switch (match[2]) {
          case "-": {
            // D-M-YYYY
            if (match[3] > 12 || match[1] > 31) {
              return fail;
            }
            return (
              new Date(
                match[5],
                parseInt(match[3], 10) - 1,
                match[1],
                match[6] || 0,
                match[7] || 0,
                match[8] || 0,
                match[9] || 0
              ) / 1000
            );
          }
          case ".": {
            // D.M.YYYY
            if (match[3] > 12 || match[1] > 31) {
              return fail;
            }
            return (
              new Date(
                match[5],
                parseInt(match[3], 10) - 1,
                match[1],
                match[6] || 0,
                match[7] || 0,
                match[8] || 0,
                match[9] || 0
              ) / 1000
            );
          }
          case "/": {
            // M/D/YYYY
            if (match[1] > 12 || match[3] > 31) {
              return fail;
            }
            return (
              new Date(
                match[5],
                parseInt(match[1], 10) - 1,
                match[3],
                match[6] || 0,
                match[7] || 0,
                match[8] || 0,
                match[9] || 0
              ) / 1000
            );
          }
        }
      } else {
        switch (match[2]) {
          case "-": {
            // YY-M-D
            if (
              match[3] > 12 ||
              match[5] > 31 ||
              (match[1] < 70 && match[1] > 38)
            ) {
              return fail;
            }
            year = match[1] >= 0 && match[1] <= 38 ? +match[1] + 2000 : match[1];
            return (
              new Date(
                year,
                parseInt(match[3], 10) - 1,
                match[5],
                match[6] || 0,
                match[7] || 0,
                match[8] || 0,
                match[9] || 0
              ) / 1000
            );
          }
          case ".": {
            // D.M.YY or H.MM.SS
            if (match[5] >= 70) {
              // D.M.YY
              if (match[3] > 12 || match[1] > 31) {
                return fail;
              }
              return (
                new Date(
                  match[5],
                  parseInt(match[3], 10) - 1,
                  match[1],
                  match[6] || 0,
                  match[7] || 0,
                  match[8] || 0,
                  match[9] || 0
                ) / 1000
              );
            }
            if (match[5] < 60 && !match[6]) {
              // H.MM.SS
              if (match[1] > 23 || match[3] > 59) {
                return fail;
              }
              today = new Date();
              return (
                new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  today.getDate(),
                  match[1] || 0,
                  match[3] || 0,
                  match[5] || 0,
                  match[9] || 0
                ) / 1000
              );
            }
            // invalid format, cannot be parsed
            return fail;
          }
          case "/": {
            // M/D/YY
            if (
              match[1] > 12 ||
              match[3] > 31 ||
              (match[5] < 70 && match[5] > 38)
            ) {
              return fail;
            }
            year = match[5] >= 0 && match[5] <= 38 ? +match[5] + 2000 : match[5];
            return (
              new Date(
                year,
                parseInt(match[1], 10) - 1,
                match[3],
                match[6] || 0,
                match[7] || 0,
                match[8] || 0,
                match[9] || 0
              ) / 1000
            );
          }
          case ":": {
            // HH:MM:SS
            if (match[1] > 23 || match[3] > 59 || match[5] > 59) {
              return fail;
            }
            today = new Date();
            return (
              new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                match[1] || 0,
                match[3] || 0,
                match[5] || 0
              ) / 1000
            );
          }
        }
      }
    }
    // other formats and "now" should be parsed by Date.parse()
    if (text === "now") {
      return now === null || isNaN(now)
        ? (new Date().getTime() / 1000) | 0
        : now | 0;
    }
    if (!isNaN((parsed = Date.parse(text)))) {
      return (parsed / 1000) | 0;
    }
    // Browsers != Chrome have problems parsing ISO 8601 date strings, as they do
    // not accept lower case characters, space, or shortened time zones.
    // Therefore, fix these problems and try again.
    // Examples:
    //   2015-04-15 20:33:59+02
    //   2015-04-15 20:33:59z
    //   2015-04-15t20:33:59+02:00
    if (
      (match = text.match(
        /^([0-9]{4}-[0-9]{2}-[0-9]{2})[ t]([0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?)([\+-][0-9]{2}(:[0-9]{2})?|z)/
      ))
    ) {
      // fix time zone information
      if (match[4] == "z") {
        match[4] = "Z";
      } else if (match[4].match(/^([\+-][0-9]{2})$/)) {
        match[4] = match[4] + ":00";
      }
      if (!isNaN((parsed = Date.parse(match[1] + "T" + match[2] + match[4])))) {
        return (parsed / 1000) | 0;
      }
    }
    date = now ? new Date(now * 1000) : new Date();
    days = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };
    ranges = {
      yea: "FullYear",
      mon: "Month",
      day: "Date",
      hou: "Hours",
      min: "Minutes",
      sec: "Seconds",
    };
  
    function lastNext(type, range, modifier) {
      var diff,
        day = days[range];
      if (typeof day !== "undefined") {
        diff = day - date.getDay();
        if (diff === 0) {
          diff = 7 * modifier;
        } else if (diff > 0 && type === "last") {
          diff -= 7;
        } else if (diff < 0 && type === "next") {
          diff += 7;
        }
        date.setDate(date.getDate() + diff);
      }
    }
  
    function process(val) {
      var splt = val.split(" "), // Todo: Reconcile this with regex using \s, taking into account browser issues with split and regexes
        type = splt[0],
        range = splt[1].substring(0, 3),
        typeIsNumber = /\d+/.test(type),
        ago = splt[2] === "ago",
        num = (type === "last" ? -1 : 1) * (ago ? -1 : 1);
      if (typeIsNumber) {
        num *= parseInt(type, 10);
      }
      if (ranges.hasOwnProperty(range) && !splt[1].match(/^mon(day|\.)?$/i)) {
        return date["set" + ranges[range]](date["get" + ranges[range]]() + num);
      }
      if (range === "wee") {
        return date.setDate(date.getDate() + num * 7);
      }
      if (type === "next" || type === "last") {
        lastNext(type, range, num);
      } else if (!typeIsNumber) {
        return false;
      }
      return true;
    }
    times =
      "(years?|months?|weeks?|days?|hours?|minutes?|min|seconds?|sec" +
      "|sunday|sun\\.?|monday|mon\\.?|tuesday|tue\\.?|wednesday|wed\\.?" +
      "|thursday|thu\\.?|friday|fri\\.?|saturday|sat\\.?)";
    regex =
      "([+-]?\\d+\\s" + times + "|" + "(last|next)\\s" + times + ")(\\sago)?";
    match = text.match(new RegExp(regex, "gi"));
    if (!match) {
      return fail;
    }
    for (i = 0, len = match.length; i < len; i++) {
      if (!process(match[i])) {
        return fail;
      }
    }
    // ECMAScript 5 only
    // if (!match.every(process))
    //    return false;
    return parseInt(date.getTime() / 1000);
  };
  Settlement.explode = function (separator, string, limit) {
    // Check if given parameter value is valid or not
    if (
      arguments.length < 2 ||
      typeof separator === "undefined" ||
      typeof string === "undefined"
    ) {
      // When not valid
      return null;
    }
    if (separator === "" || separator === false || separator === null)
      return false;
    if (
      typeof separator === "function" ||
      typeof separator === "object" ||
      typeof string === "function" ||
      typeof string === "object"
    ) {
      return {
        0: "",
      };
    }
    if (separator === true) {
      separator = "1";
    }
    separator += "";
    string += "";
    var s = string.split(separator);
    // When limt are not given
    if (typeof limit === "undefined") return s;
  
    if (limit === 0) limit = 1;
  
    if (limit > 0) {
      if (limit >= s.length) return s;
      return s.slice(0, limit - 1).concat([s.slice(limit - 1).join(separator)]);
    }
    // Negative limit handle
    if (-limit >= s.length) return [];
    s.splice(s.length + limit);
    return s;
  };
  Settlement.base64_decode = function (text) {
    // Tested in chrome browser
    return decodeURIComponent(escape(window.atob(text)));
  };
  // ------------------------
  // Function : default_key
  // This is an alternate function which
  // is find default key of map.
  // We assume that passing parameter is a
  // Object of javascript.
  Settlement.default_key = function (obj) {
    var result = 0;
    Object.entries(obj).map((item) => {
      // It's not 100 % accurate when
      // given key = 1 or key = "1"
      // both same in javascript.
      // Or key is an string in javascript object.
      const num = Number(item[0]);
      // Check key is integer and key
      // is not less than result
      if (Number.isInteger(num) && num >= result) {
        // Get new key
        result = num + 1;
      }
    });
    // Important set empty
    // when access [][]
    // array of array.
    obj[result] = {};
    return result;
  };