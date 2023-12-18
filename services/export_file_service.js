var model = require('../models/ndr_nonndr_model');
const { createLogger, transports } = require('winston');
const { combine, timestamp, printf } = require('winston').format;
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
var date = require('date-and-time');
var nodemailer = require('nodemailer');


// status errors
var status_success = "success";
var status_error = "error";
var status_error_code = 400;
var status_success_code = 200;
var html_code;
var html_message;
var html_status;

// server errors
var something_error = "Something went wrong";
var invalid_error = "Invalid request..";
var email_array = ['sanket@depasserinfotech.in'];

// export_file_service
exports.export_file_service = async function (req, res, form_data) {
    const logDirectory = path.join(__dirname, './../logs');
    const zip_file_name = path.join(__dirname, "logs.zip");
    // var now = new Date();
    // const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`; // Format it as "yyyy-mm-dd_hh:mm:ss"
    // var user_id = form_data.id;
    // const logFormat = printf(({ level, message, timestamp }) => {
    //     return `${message}`;
    // });
    // const logger = createLogger({
    //     level: 'info',
    //     format: combine(
    //         logFormat
    //     ),
    //     transports: [
    //         new transports.File({
    //             filename: path.join(logDirectory, `${'export-file_' + user_id + "_" + formattedDate}.txt`
    //             )
    //         })
    //     ]

    // });
    try {
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'sanket@depasserinfotech.in',
                pass: 'ovnb xwik dnuj bmzr'
            }
        });



        function getDateRange(form_data) {
            try {
                var startDate = form_data.date_range.split(" ")[0]
                var endDate = form_data.date_range.split(" ")[1]
                // Parse dd-mm-yyyy
                let qParse = s => {
                    let [d, m, y] = s.split(/\D/);
                    return new Date(y, m - 1, d);
                };
                // Format date as dd-mm-yyyy
                let qFormat = d => {
                    let z = n => (n < 10 ? '0' : '') + n;
                    return z(d.getDate()) + '-' + z(d.getMonth() + 1) + '-' + d.getFullYear(); 
                }
                // Setup for loop
                let start = qParse(startDate);
                let end = qParse(endDate);
                let result = [];
                // Loop from start to end, incrementing
                // the start date and writing to result array
                do {
                    result.push(qFormat(start));
                    start.setDate(start.getDate() + 1);
                } while (start <= end)

                return result;
            } catch (error) {
                res.status(200).json({
                    status_code: status_error_code,
                    status: status_error,
                    message: something_error,
                })
            }

        }

        // Read the files in the directory
        fs.readdir(logDirectory, async (err, files) => {
            if (err) {
                console.error('Error reading directory:', err);
                return;
            }
            var attachments_array = [];
            const folderPath = path.join(__dirname, "./../logs");
            const output = fs.createWriteStream(path.join(__dirname, 'logs.zip'));
            const archive = archiver('zip', {
                zlib: { level: 9 } // Set compression level (0 to 9)
            });
            archive.pipe(output);
            files.forEach(async (file) => {


                var split_id = file.split("_")[1]
                var split_date_and_time = file.split("_")
                var combine_date = split_date_and_time[2]
                var transformed_date = date.parse(combine_date, "YYYY-MM-DD")
                var formated_date = date.format(transformed_date, "DD-MM-YYYY")
                if (form_data.date_range != "" && form_data.date_range.toString() != "undefined".toString()) {
                    if (form_data.email != "" && form_data.email != undefined) {
                        if (getDateRange(form_data).includes(formated_date) && form_data.email == split_id) {
                            attachments_array.push(file)
                            archive.file(path.join(folderPath, file), { name: file });
                        }

                    }
                    else {
                        if (getDateRange(form_data).includes(formated_date) && form_data.id == split_id) {
                            attachments_array.push(file)
                            archive.file(path.join(folderPath, file), { name: file });
                        }
                    }

                }

                else {
                    if (form_data.email != "" && form_data.email != undefined) {
                        if (form_data.email == split_id) {
                            attachments_array.push(file)
                            archive.file(path.join(folderPath, file), { name: file });
                        }
                    }
                    else {
                        if (form_data.id == split_id) {
                            attachments_array.push(file)
                            archive.file(path.join(folderPath, file), { name: file });
                        }

                    }

                }
            });
            archive.finalize();

            if (attachments_array.length > 0) {

                var mailOptions = await {
                    from: 'sanket@depasserinfotech.in',
                    to: email_array,
                    subject: "Logs",
                    attachments: {
                        filename: "logs.zip",
                        path: zip_file_name
                    }
                };
                console.log(mailOptions)
                await transporter.sendMail(mailOptions, function (error, info) {
                    fs.unlink(zip_file_name, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error('Error deleting file:', unlinkErr);
                        } else {
                            console.log(`Deleted file: ${zip_file_name}`);
                        }
                    });
                    if (error) {
                        res.status(200).json({
                            status_code: status_error_code,
                            status: status_error,
                            message: error,
                        })
                    } else {
                        res.status(200).json({
                            status_code: status_success_code,
                            status: status_success,
                            message: "sent successfuly",
                        })
                    }
                });

            }
            else {
                res.status(200).json({
                    status_code: status_error_code,
                    status: status_error,
                    message: invalid_error,
                })
            }

        });

    } catch (error) {
        res.status(200).json({
            status_code: status_error_code,
            status: status_error,
            message: error,
        })
    }


}