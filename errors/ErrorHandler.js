const { userValidation } = require("./Errors")



const ErrorHandler = (error)=>{
    if(error) {
        const {errors, message} = error
        switch(message){
            
            case 'Users validation failed': 
                return userValidation(errors)

                
            default : return message
        }
    }
        
}


module.exports = ErrorHandler