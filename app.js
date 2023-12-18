

const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const dotenv = require('dotenv');
const User = require('./models/userModel');
var date = require('date-and-time');
const schedule = require('node-schedule');
const fs = require('fs');
const archiver = require('archiver');
var nodemailer = require('nodemailer');
const path = require('path');
const { createLogger, transports } = require('winston');
const { combine, timestamp, printf } = require('winston').format;

const directoryPath = './logs';
const phpdirectoryPath = './php_error';
const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = 1; // 0 is Sunday, 1 is Monday, and so on
rule.hour = 0;
rule.minute = 0;
rule.second = 0;
// rule.second =  new schedule.Range(0, 59);
dotenv.config({
  path: './config.env'
});
const job = schedule.scheduleJob(rule, () => {
  var today_formated_date = date.format(new Date(), "YYYY-MM-DD");
  const zip_file_name = path.join(__dirname, "logs.zip");
var email_array = ['sanket@depasserinfotech.in'];
  console.log('Deleting files every 15 days at', new Date());

  // Read the files in the directory
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }

    // Iterate through the files and delete them
    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);
      var split_date_and_time = file.split("_")
      var combine_date = split_date_and_time[2]
      var transformed_date = date.parse(combine_date, "YYYY-MM-DD")
      var formated_date = date.format(transformed_date, "YYYY-MM-DD")

      var subtracted_value = date.subtract(new Date(today_formated_date), new Date(formated_date)).toDays()
      console.log(subtracted_value)
      if (subtracted_value == 15) {
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting file:', unlinkErr);
          } else {
            console.log(`Deleted file: ${filePath}`);
          }
        });
      }

    });
  });

  // delete php_files
  fs.readdir(phpdirectoryPath, (err, files) => {
      if (err) {
        console.error('Error reading directory:', err);
        return;
      }
  
      // Iterate through the files and delete them
      files.forEach((file) => {
        const filePath = path.join(phpdirectoryPath, file);
        var split_date_and_time = file.split("_")
        var combine_date = split_date_and_time[2]
        var transformed_date = date.parse(combine_date, "YYYY-MM-DD")
        var formated_date = date.format(transformed_date, "YYYY-MM-DD")
  
        var subtracted_value = date.subtract(new Date(today_formated_date), new Date(formated_date)).toDays()
        console.log(file)
              console.log(subtracted_value)
        if (subtracted_value == 15) {
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Error deleting file:', unlinkErr);
            } else {
              console.log(`Deleted file: ${filePath}`);
            }
          });
        }
  
      });
    });
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
//app.use('/ndr-calls/api', limiter);

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
  res.sendfile('./platform.json');
});

// Routes
var access_token = process.env.access_token;
var secret_key = process.env.secret_key;
//app.use('/ndr-calls/api', userRoutes);
app.use(async function (req, res, next) {
  const {
    form_data
  } = req.body;
  const main_url = req.originalUrl.split("/")[3];
  
  try {
    console.log("NDR-CALL");

    const apiTimeout = 30 * 1000;
    req.setTimeout(apiTimeout, () => {
      let err = new Error('Request Timeout');
      err.status = 408;
      next(err);
    });
    console.log(req.originalUrl)
    if (typeof form_data !== 'undefined') {
      if (typeof form_data.access_token !== 'undefined' && typeof form_data.secret_key !== 'undefined' && form_data.access_token == access_token && form_data.secret_key == secret_key) {
        if (req.originalUrl == '/ndr-calls/api/login') {
          console.log(req.originalUrl)
          next();
        }
        else {
          var mobile_access_token = await User.get_user_mobile_access_token(form_data.id);
          console.log(mobile_access_token[0].mobile_access_token);
          if (form_data.mobile_access_token == mobile_access_token[0].mobile_access_token) {
            next();
          }
          else {
            res.setHeader('Content-Type', 'text/plain');
            res.status(200).json({
              status: "error",
              status_code: 400,
              message: "Some Error Occured! Try again later",
            });
          return;
          }
        }
      }
      else {
        res.setHeader('Content-Type', 'text/plain');
        res.status(200).json({
          status: "error",
          status_code: 400,
          message: "Invalid Request1",
          form_data: form_data
        });
        return;
      }
    }
    else {
      res.setHeader('Content-Type', 'text/plain');
      res.status(200).json({
        status: "error",
        status_code: 400,
        message: "Invalid Request2",
        form_data: form_data
      });
      return;
    }
  } catch (error) {
    var user_id;
    if(form_data.id != undefined && form_data.id != "")
    {
      user_id = form_data.id
    }
    else
    {
      user_id = form_data.email
    }
    const logDirectory = path.join(__dirname, './logs');
  var now = new Date();
  const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`; // Format it as "yyyy-mm-dd_hh:mm:ss"
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
          `${main_url + '_' + user_id + "_" + formattedDate}.txt`
        )
      })
    ]

  });

    res.status(200).json({
      status: "error",
      status_code: 400,
      message: "Invalid Request3",
      form_data: form_data
    });
    logger.info('Payload :- ' + JSON.stringify(req.body));

    logger.info('error :-');
    logger.info(error);
    return;
  }

})
app.use('/ndr-calls/api', userRoutes);

module.exports = app;