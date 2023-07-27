

const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const dotenv = require('dotenv');
const User = require('./models/userModel');
dotenv.config({
  path: './config.env'
});

//const app = express();

const app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true })); 

const userRoutes = require('./routes/userRoutes');

// Allow Cross-Origin requests
app.use(cors());

// Set security HTTP headers
app.use(helmet());

// Limit request from the same API 
//const limiter = rateLimit({
//    max: 150,
//    windowMs: 60 * 60 * 1000,
//    message: 'Too Many Request from this IP, please try again in an hour'
//});
//app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({
    limit: '4000kb'
}));
app.use(bodyParser.json());  

// Data sanitization against XSS(clean user input from malicious HTML code)
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

app.get('/', function (req, res) {
  res.sendfile('./Homepage.html');
});

// Routes
var access_token = process.env.access_token;
var secret_key = process.env.secret_key;
//app.use('/api', userRoutes);
app.use(async function (req, res, next) {
    const {
        form_data
    } = req.body;
    console.log("NDR-CALL");
    
    const apiTimeout =30 * 1000;
    req.setTimeout(apiTimeout, () => {
        let err = new Error('Request Timeout');
        err.status = 408;
        next(err);
    });
    console.log(req.originalUrl)
    if(typeof form_data !== 'undefined')
    {
        if(typeof form_data.access_token !== 'undefined' && typeof form_data.secret_key !== 'undefined' && form_data.access_token == access_token && form_data.secret_key == secret_key)
        {
            if(req.originalUrl == '/api/login'){
                //console.log(req.originalUrl)
				
                next();
            }
            else{
                var mobile_access_token = await User.get_user_mobile_access_token(form_data.id);
                console.log(mobile_access_token[0].mobile_access_token);
                if(form_data.mobile_access_token == mobile_access_token[0].mobile_access_token)
                {
                    next();
                }
                else
                {
                    res.setHeader('Content-Type', 'text/plain');
                    res.status(200).json({
                        status : "error",
                        status_code : 400,
                        message : "Some Error Occured! Try again later",
                    });
                    return;
                }
            }
        }
        else
        {
            res.setHeader('Content-Type', 'text/plain');
            res.status(200).json({
                status : "error",
                status_code : 400,
                message : "Invalid Request1",
                form_data : form_data
            });
            return;
        }
    }
    else
    {
        res.setHeader('Content-Type', 'text/plain');
        res.status(200).json({
            status : "error",
            status_code : 400,
            message : "Invalid Request2",
            form_data : form_data
        });
        return;
    }
})
app.use('/api', userRoutes);

module.exports = app;