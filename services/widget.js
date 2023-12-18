var html_query = [];
var date = require('date-and-time');

// check_ndr_time_status_case
exports.check_ndr_time_status_case = function (form_data, check_ndr_time_status) {
    html_query = [];
    switch (form_data.event_type) {
        case 0:
            start_time(form_data, check_ndr_time_status)
            break;
        case 1:
            finish_time(form_data, check_ndr_time_status)
            break;
        case 2:
            hold_time(form_data, check_ndr_time_status)
            break;
        case 3:
            resume_time(form_data, check_ndr_time_status)
            break;

        default: html_query.push(
            {
                "query": '',
                "message": "Invalid event status",
            })
            break;
    }
    return html_query
}

function start_time(form_data, check_ndr_time_status) {
    var today_date = new Date();
    var modified_date = date.format(today_date, "YYYY-MM-DD HH:mm:ss");
    var remark_update_time = parseInt(form_data.remark_update_time);
    var call_idle_time = parseInt(form_data.call_idle_time);
    console.log(remark_update_time)
    if(form_data.remark_update_time == undefined || form_data.remark_update_time == "" || form_data.remark_update_time == null)
    {
        remark_update_time = 0.00;
    }
    if(form_data.call_idle_time == undefined || form_data.call_idle_time == "" || form_data.call_idle_time == null)
    {
        call_idle_time = 0.00;
    }
    var start_calling_datetime = "00-00-0000 00:00:00";
    var last_calling_datetime = "00-00-0000 00:00:00";
    if(form_data.latitude != "" && form_data.longitude != "")
    {
    if (check_ndr_time_status.length == 0) {
        return html_query.push(
            {
                "query": 'insert into user_mobile_app_details (user_id,module_type,event_type,start_date,finish_date,hold_reason,hold_date,resume_date,pause_time,call_idle_time,remark_update_time,latitude,longitude,start_calling_datetime,last_calling_datetime,created_date,modified_date,status,is_deleted)values (' + form_data.id + ',' + form_data.module_type + ',' + form_data.event_type + ',"' + modified_date + '","00-00-0000 00:00:00","","00-00-0000 00:00:00","00-00-0000 00:00:00","00","00","00","' + form_data.latitude + '","' + form_data.longitude + '","' +start_calling_datetime+ '","' + last_calling_datetime + '","' + modified_date + '","' + modified_date + '",1,0)',
                "message": "Started Successfully",
            }
        )
    }
    else {
        for (var check_ndr_time_status_array of check_ndr_time_status) {
            if (check_ndr_time_status_array.event_type == 1) {
                return html_query.push(
                    {
                        "query": '',
                        "message": "Already Finished",
                    }
                )
            }
            else if(check_ndr_time_status_array.event_type == 2){
                return html_query.push(
                    {
                        "query": '',
                        "message": "Please resume first",
                    }
                ) 
            }
            else {
                if( check_ndr_time_status_array.event_type == 0)
                {
                    remark_update_time += 
                    check_ndr_time_status_array.remark_update_time
                    call_idle_time += check_ndr_time_status_array.call_idle_time
                    return html_query.push(
                        {
                            "query": 'update user_mobile_app_details set  remark_update_time = '+remark_update_time+' , call_idle_time = '+call_idle_time+', modified_date = "' + modified_date + '" where event_type = 0 and user_id = ' + form_data.id + ' and module_type = "'+form_data.module_type+'" and DATE(created_date) = date(NOW()) and is_deleted = 0',
                            "message": "Updated Successfully",
                        }
                    )
                }
               
                // return html_query.push(
                //     {
                //         "query": '',
                //         "message": "Already Started",
                //     }
                // )
            }

        }

    }
}
else
{
    return html_query.push(
        {
            "query": '',
            "message": "Latitude and Longitude is required",
        }
    ) 
}
}


// hold_time
function hold_time(form_data, check_ndr_time_status) {
    var today_date = new Date();
    var modified_date = date.format(today_date, "YYYY-MM-DD HH:mm:ss");
    var start_calling_datetime = "00-00-0000 00:00:00";
    var last_calling_datetime = "00-00-0000 00:00:00";
    if(form_data.latitude != "" && form_data.longitude != "")
    {
    if (check_ndr_time_status.length != 0) {
        if (form_data.hold_reason != "") {
            var start_date = check_ndr_time_status[0].start_date;
            var start_formated_date = date.format(start_date, "YYYY-MM-DD HH:mm:ss")

            for (var check_ndr_time_status_array of check_ndr_time_status) {
                if (check_ndr_time_status_array.event_type != 1) {
                    if (check_ndr_time_status_array.event_type == 2) {
                        return html_query.push(
                            {
                                "query": '',
                                "message": "Already on hold",
                            }
                        )
                    }
                    else {
                        return html_query.push(
                            {
                                "query": 'insert into user_mobile_app_details (user_id,module_type,event_type,start_date,finish_date,hold_reason,hold_date,resume_date,pause_time,call_idle_time,remark_update_time,latitude,longitude,start_calling_datetime,last_calling_datetime,created_date,modified_date,status,is_deleted) values (' + form_data.id + ',' + form_data.module_type + ',' + form_data.event_type + ',"' + start_formated_date + '","00-00-0000 00:00:00","' + form_data.hold_reason + '","' + modified_date + '","00-00-0000 00:00:00","00","00","00","' + form_data.latitude + '","' + form_data.longitude + '","' +start_calling_datetime+ '","' + last_calling_datetime + '","' + modified_date + '","' + modified_date + '",1,0)',
                                "message": "Hold Successfully",
                            }
                        )
                    }
                }
                else {
                    return html_query.push(
                        {
                            "query": '',
                            "message": "Already Finished",
                        }
                    )
                }
            }
        }
        else {
            return html_query.push(
                {
                    "query": '',
                    "message": "reason is required",
                }
            )
        }
    }
    else {
        return html_query.push(
            {
                "query": '',
                "message": "Please Start First",
            }
        )
    }
}
else
{
    return html_query.push(
        {
            "query": '',
            "message": "Latitude and Longitude is required",
        }
    )  
}

}

// resume_time
async function resume_time(form_data, check_ndr_time_status) {
    var today_date = new Date();
    var modified_date = date.format(today_date, "YYYY-MM-DD HH:mm:ss");
    var total_hold_time = "";
    if(form_data.latitude != "" && form_data.longitude != "")
    {
    if (check_ndr_time_status.length != 0) {
        var hold_date = check_ndr_time_status[0].hold_date;
        for (var check_ndr_time_status_array of check_ndr_time_status) {
            if (check_ndr_time_status_array.event_type != 1) {
                if (check_ndr_time_status_array.event_type == 2) {
                    total_hold_time = date.subtract(today_date, hold_date).toSeconds();
                    return html_query.push(
                        {
                            "query": 'update user_mobile_app_details set event_type = ' + form_data.event_type + ' , resume_date = "' + modified_date + '" , pause_time = "' + total_hold_time + '" , modified_date = "' + modified_date + '" , latitude = '+form_data.latitude+', longitude = '+form_data.longitude+' where event_type = 2 and user_id = ' + form_data.id + ' and module_type = '+form_data.module_type+' and DATE(created_date) = date(NOW()) and is_deleted = 0',
                            "message": "Resumed Successfully",
                        }
                    )

                }
                else {
                    return html_query.push(
                        {
                            "query": '',
                            "message": "Please hold first",
                        }
                    )
                }
            }
            else {
                return html_query.push(
                    {
                        "query": '',
                        "message": "Already Finished",
                    }
                )
            }
        }
    }
    else {
        return html_query.push(
            {
                "query": '',
                "message": "Please Start First",
            }
        )
    }
}
else
{
    return html_query.push(
        {
            "query": '',
            "message": "Latitude and Longitude is required",
        }
    )  
}

}

// finish
function finish_time(form_data, check_ndr_time_status) {
    var today_date = new Date();
    var modified_date = date.format(today_date, "YYYY-MM-DD HH:mm:ss")
    var start_calling_datetime = form_data.start_calling_datetime;
    var last_calling_datetime = form_data.last_calling_datetime;
    if(start_calling_datetime == undefined || start_calling_datetime == null || start_calling_datetime == "")
    {
        start_calling_datetime = "00-00-0000 00:00:00";
    }
    if(last_calling_datetime == undefined || last_calling_datetime == null || last_calling_datetime == "")
    {
        last_calling_datetime = "00-00-0000 00:00:00";
    }
    if(form_data.latitude != "" && form_data.longitude != "")
    {
    if (check_ndr_time_status.length != 0) {
        var start_date = check_ndr_time_status[0].start_date;
        var start_formated_date = date.format(start_date, "YYYY-MM-DD HH:mm:ss")

        for (var check_ndr_time_status_array of check_ndr_time_status) {
            if (check_ndr_time_status_array.event_type == 2) {
                return html_query.push(
                    {
                        "query": '',
                        "message": "Please resume first",
                    }
                )
            }
            else if (check_ndr_time_status_array.event_type == 1) {
                return html_query.push(
                    {
                        "query": '',
                        "message": "Already Finished",
                    }
                )
            }
            else {
                return html_query.push(
                    {
                        "query": 'insert into user_mobile_app_details (user_id,module_type,event_type,start_date,finish_date,hold_reason,hold_date,resume_date,pause_time,call_idle_time,remark_update_time,latitude,longitude,start_calling_datetime,last_calling_datetime,created_date,modified_date,status,is_deleted) values (' + form_data.id + ',' + form_data.module_type + ',' + form_data.event_type + ',"' + start_formated_date + '","' + modified_date + '","","00-00-0000 00:00:00","00-00-0000 00:00:00","00","00","00","' + form_data.latitude + '","' + form_data.longitude + '","' +start_calling_datetime+ '","' + last_calling_datetime + '","' + modified_date + '","' + modified_date + '",1,0)',
                        "message": "Finished Successfully",
                    }
                )
            }
        }
    }
    else {
        return html_query.push(
            {
                "query": '',
                "message": "Please Start First",
            } 
        )
    }
}
else
{
    return html_query.push(
        {
            "query": '',
            "message": "Latitude and Longitude is required",
        }
    ) 
}

}
