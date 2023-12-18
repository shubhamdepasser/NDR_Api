var version_service = require('../services/version_service');
// version_controller
exports.version_controller = async function(req, res){
    try {
        // console.log("version_controller");
            const
            {
              form_data
            } = await req.body;
            // console.log(req.body);
            version_service.version_service(req, res,form_data)
      
            // console.log(req.body);
    } catch (error) {
        
    }
}