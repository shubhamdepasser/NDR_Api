const express = require('express');
const router = express.Router();
const authController = require('./../controllers/authController');
const nonNDRController = require('./../controllers/nonNDRController');
const ndr_time_submit_controller = require('./../controllers/ndr_nonndr_controller');
const version_controller = require('./../controllers/version_controller');
const export_file_controller = require('./../controllers/export_file_controller');

const { request } = require('../app');

console.log("inside router");

router.post('/login', authController.login);
router.post('/view_call_summary_count', authController.view_call_summary_count);
router.post('/view_call_status_count', authController.view_call_status_count);
router.post('/view_call_details', authController.view_call_details); 
router.post('/view_call_details2', authController.view_call_details_pagination); 
router.post('/update_call_status', authController.update_call_status);
router.post('/mobile_update_call_status', authController.mobile_update_call_status);
router.post('/update_call_status_new', authController.update_call_status_new);
router.post('/save_call_record_upload_file_name', authController.save_call_record_upload_file_name);

router.post('/view_nonNDRcall_summary_count', nonNDRController.view_nonNDRcall_summary_count);
router.post('/view_nonNDRcall_status_count', nonNDRController.view_nonNDRcall_status_count);
router.post('/view_nonNDRcall_details', nonNDRController.view_nonNDRcall_details); 
router.post('/view_nonNDRcall_details2', nonNDRController.view_nonNDRcall_details_pagination); 
router.post('/update_nonNDRcall_status', nonNDRController.update_nonNDRcall_status);
router.post('/update_nonNDRcall_status_new', nonNDRController.update_nonNDRcall_status_new);
router.post('/save_nonNDRcall_record_upload_file_name', nonNDRController.save_nonNDRcall_record_upload_file_name);
router.post('/ndr_time_submit', ndr_time_submit_controller.ndr_time_submit); 
// version checking
router.post('/check_version', version_controller.version_controller); 
// export file
router.post('/export_file', export_file_controller.export_file_controller); 

//router.use(authController.protect);\

module.exports = router;