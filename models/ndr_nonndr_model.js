var mysqlpool = require('../dbconfig');

// check_ndr_time
exports.check_ndr_time_status = async function(form_data,module_type){
    var query = "";
        
    query = 'select id,user_id,module_type,event_type,start_date,hold_date,resume_date,remark_update_time,call_idle_time from user_mobile_app_details where user_id = '+form_data.id+' and DATE(start_date) = date(NOW()) and is_deleted = 0 and module_type = '+form_data.module_type+' order by id DESC';
    try {
        // console.log("inside model check_ndr_time_status")
        // console.log(query);
        return new Promise(async function(resolve, reject){
            mysqlpool.getConnection(async function (err,connection){
               await connection.query(query,function(err,result){
                    if(err){
                        // console.log(err);
                        connection.release();
                        reject(err);
                    }else{
                        // console.log(result);
                        connection.release();
                        resolve(result);
                    }
                })
            })
        })

        
    } catch (error) {
        // console.log(error)
    }
}

// check_ndr_nonndr_event_status
exports.check_ndr_nonndr_event_status = async function(form_data,module_type){
    var query = "";
        
    query = 'select id,user_id,module_type,event_type,start_date,hold_date,resume_date from user_mobile_app_details where user_id = '+form_data.id+' and DATE(start_date) = date(NOW()) and is_deleted = 0 and module_type = '+module_type+' order by id DESC';
    try {
        // console.log("inside model check_ndr_time_status")
        // console.log(query);
        return new Promise(async function(resolve, reject){
            mysqlpool.getConnection(async function (err,connection){
               await connection.query(query,function(err,result){
                    if(err){
                        // console.log(err);
                        connection.release();
                        reject(err);
                    }else{
                        // console.log(result);
                        connection.release();
                        resolve(result);
                    }
                })
            })
        })

        
    } catch (error) {
        // console.log(error)
    }
}

// update_ndr_datetime
exports.update_ndr_datetime = async function(query){
    try {
        // console.log('update user_mobile_app_details set hold_time = "'+form_data.hold_datetime+'" , hold_reason = "'+form_data.hold_reason+'",resume_datetime = "'+form_data.resume_datetime+'", pause_time = "'+pause_time+'" where user_id = "user_id";')
        return new Promise(async function(resolve, reject){
            mysqlpool.getConnection(async function (err,connection){
               await connection.query(query,function(err,result){
                    if(err){
                        // console.log(err);
                        connection.release();
                        reject(err);
                    }else{
                        console.log(result);
                        connection.release();
                        resolve(result);
                    }
                })
            })
        })

        
    } catch (error) {
        // console.log(error)
    }
}