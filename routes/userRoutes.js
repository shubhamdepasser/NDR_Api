const express = require('express');
const router = express.Router();
const authController = require('./../controllers/authController');
const nonNDRController = require('./../controllers/nonNDRController');
const { request } = require('../app');



router.post('/login', authController.login);
router.post('/view_call_summary_count', authController.view_call_summary_count);
router.post('/view_call_status_count', authController.view_call_status_count);
router.post('/view_call_details', authController.view_call_details); 
router.post('/view_call_details2', authController.view_call_details_pagination); 
router.post('/update_call_status', authController.update_call_status);
router.post('/update_call_status_new', authController.update_call_status_new);
router.post('/save_call_record_upload_file_name', authController.save_call_record_upload_file_name);

router.post('/view_nonNDRcall_summary_count', nonNDRController.view_nonNDRcall_summary_count);
router.post('/view_nonNDRcall_status_count', nonNDRController.view_nonNDRcall_status_count);
router.post('/view_nonNDRcall_details', nonNDRController.view_nonNDRcall_details); 
router.post('/view_nonNDRcall_details2', nonNDRController.view_nonNDRcall_details_pagination); 
router.post('/update_nonNDRcall_status', nonNDRController.update_nonNDRcall_status);
router.post('/update_nonNDRcall_status_new', nonNDRController.update_nonNDRcall_status_new);
router.post('/save_nonNDRcall_record_upload_file_name', nonNDRController.save_nonNDRcall_record_upload_file_name);
//router.use(authController.protect);\

module.exports = router;