const userValidation = (error)=>{
   return {
       error: Object.values(error)[0].name,
       message: Object.values(error)[0].message.replace(/[^a-zA-Z ]/g, '')
   }
    // return Object.keys(error)[0].message.replace(/[^a-zA-Z ]/g, '')
}

module.exports = {
    userValidation
}