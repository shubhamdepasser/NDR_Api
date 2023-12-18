var export_file_service = require('../services/export_file_service');


exports.export_file_controller = async function(req, res){
    try {
        // console.log("version_controller");
            const
            {
              form_data
            } = await req.body;
            // console.log(req.body);
            export_file_service.export_file_service(req, res,form_data)
      
            // console.log(req.body);
    } catch (error) {
        
    }
}