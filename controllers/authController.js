const {
    promisify
} = require('util');
const jwt = require('jsonwebtoken');
const User = require('../services/userservice');
var express = require('express');
const nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');
//var AES_formator = require('../method/AES_formator');
const dotenv = require('dotenv');
dotenv.config({
  path: './../config.env'
});
var access_token = process.env.access_token;
var secret_key = process.env.secret_key;
var fs = require('fs');


exports.login = async (req, res, next) => 
{
    try 
    {
        const {
            form_data
        } = req.body;
        console.log(req.body)
        //base64image.base64ToImage(req, res, next);
        
        if(form_data.access_token == access_token && form_data.secret_key == secret_key)
        {
            User.login_user(form_data, req, res, next);
        }
        else
        {
            res.status(200).json({
                status : "error",
                status_code : 400,
                message : "Invalid Request",
            });
        }
       
        
    } catch (err) 
    {
        res.status(200).json({
            status : "error",
            status_code : 400,
            message : "Something went wrong!!! please try again.",
            error_message: err,
        });
        //next(err);
    }
};


exports.view_call_summary_count = async (req, res, next) => 
{
    try 
    {
        const {
            form_data
        } = req.body;
        console.log(req.body)
        //base64image.base64ToImage(req, res, next);
        
        if(form_data.access_token == access_token && form_data.secret_key == secret_key)
        {
            User.view_call_summary_count(form_data, req, res, next);
        }
        else
        {
            res.status(200).json({
                status : "error",
                status_code : 400,
                message : "Invalid Request",
            });
        }
       
        
    } catch (err) 
    {
        res.status(200).json({
            status : "error",
            status_code : 400,
            message : "Something went wrong!!! please try again.",
            error_message: err,
        });
        //next(err);
    }
};

exports.view_call_status_count = async (req, res, next) => 
{
    try 
    {
        const {
            form_data
        } = req.body;
        console.log(req.body)
        //base64image.base64ToImage(req, res, next);
        
        if(form_data.access_token == access_token && form_data.secret_key == secret_key)
        {
            User.view_call_status_count(form_data, req, res, next);
        }
        else
        {
            res.status(200).json({
                status : "error",
                status_code : 400,
                message : "Invalid Request",
            });
        }
       
        
    } catch (err) 
    {
        res.status(200).json({
            status : "error",
            status_code : 400,
            message : "Something went wrong!!! please try again.",
            error_message: err,
        });
        //next(err);
    }
};
    
exports.view_call_details = async (req, res, next) => 
{
    try 
    {
        const {
            form_data
        } = req.body;
        console.log(req.body)
        //base64image.base64ToImage(req, res, next);
        
        if(form_data.access_token == access_token && form_data.secret_key == secret_key)
        {
            User.view_call_details(form_data, req, res, next);
        }
        else
        {
            res.status(200).json({
                status : "error",
                status_code : 400,
                message : "Invalid Request",
            });
        }
       
        
    } catch (err) 
    {
        res.status(200).json({
            status : "error",
            status_code : 400,
            message : "Something went wrong!!! please try again.",
            error_message: err,
        });
        //next(err);
    }
};

exports.view_call_details_pagination = async (req, res, next) => 
{
    try 
    {
        const {
            form_data
        } = req.body;
        console.log(req.body)
        //base64image.base64ToImage(req, res, next);
        
        if(form_data.access_token == access_token && form_data.secret_key == secret_key)
        {
            User.view_call_details_pagination(form_data, req, res, next);
        }
        else
        {
            res.status(200).json({
                status : "error",
                status_code : 400,
                message : "Invalid Request",
            });
        }
       
        
    } catch (err) 
    {
        res.status(200).json({
            status : "error",
            status_code : 400,
            message : "Something went wrong!!! please try again.",
            error_message: err,
        });
        //next(err);
    }
};


exports.update_call_status_new = async (req, res, next) => 
{
    try 
    {
        const {
            form_data
        } = req.body;
        console.log(req.body)
        //base64image.base64ToImage(req, res, next);
        
        if(form_data.access_token == access_token && form_data.secret_key == secret_key)
        {
            User.update_call_status_new(form_data, req, res, next);
        }
        else
        {
            res.status(200).json({
                status : "error",
                status_code : 400,
                message : "Invalid Request",
            });
        }
       
        
    } catch (err) 
    {
        res.status(200).json({
            status : "error",
            status_code : 400,
            message : "Something went wrong!!! please try again.",
            error_message: err,
        });
        //next(err);
    }
};

exports.update_call_status = async (req, res, next) => 
{
    try 
    {
        const {
            form_data
        } = req.body;
        console.log(req.body)
        //base64image.base64ToImage(req, res, next);
        
        if(form_data.access_token == access_token && form_data.secret_key == secret_key)
        {
            User.update_call_status(form_data, req, res, next);
        }
        else
        {
            res.status(200).json({
                status : "error",
                status_code : 400,
                message : "Invalid Request",
            });
        }
       
        
    } catch (err) 
    {
        res.status(200).json({
            status : "error",
            status_code : 400,
            message : "Something went wrong!!! please try again.",
            error_message: err,
        });
        //next(err);
    }
};
   
exports.mobile_update_call_status = async (req, res, next) => 
{
    try 
    {
        const {
            form_data
        } = req.body;
        console.log(req.body)
        //base64image.base64ToImage(req, res, next);
        
        if(form_data.access_token == access_token && form_data.secret_key == secret_key)
        {
            User.mobile_update_call_status(form_data, req, res, next);
        }
        else
        {
            res.status(200).json({
                status : "error",
                status_code : 400,
                message : "Invalid Request",
            });
        }
       
        
    } catch (err) 
    {
        res.status(200).json({
            status : "error",
            status_code : 400,
            message : "Something went wrong!!! please try again.",
            error_message: err,
        });
        //next(err);
    }
};

exports.save_call_record_upload_file_name = async (req, res, next) => 
{
    try 
    {
        const {
            form_data
        } = req.body;
        console.log(req.body)
        //base64image.base64ToImage(req, res, next);
        
        if(form_data.access_token == access_token && form_data.secret_key == secret_key)
        {
            User.save_call_record_upload_file_name(form_data, req, res, next);
        }
        else
        {
            res.status(200).json({
                status : "error",
                status_code : 400,
                message : "Invalid Request",
            });
        }
       
        
    } catch (err) 
    {
        res.status(200).json({
            status : "error",
            status_code : 400,
            message : "Something went wrong!!! please try again.",
            error_message: err,
        });
        //next(err);
    }
};
    