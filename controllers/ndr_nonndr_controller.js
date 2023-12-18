var ndr_nonndr_service = require('../services/ndr_nonndr_service');
// ndr_time_submit
exports.ndr_time_submit = async function(req, res){
    try {
       // console.log("ndr_time_submit");
            const
            {
              form_data
            } = await req.body;
            console.log(req.body)
            ndr_nonndr_service.ndr_time_submit(req, res,form_data)
      
            // console.log(req.body);
    } catch (error) {
        
    }
}