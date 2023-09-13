const otpGenerator = require('otp-generator');

const OTP_CONFIG = {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
}

const OTP_LENGTH = 6

const OTP_DELAY = 60; //delay in seconds

const getOTP = async () => {
    const otp = otpGenerator.generate(OTP_LENGTH, OTP_CONFIG);

    return otp

}

const sendOtp = async(phone, otp)=>{
    console.log(otp);

    return Promise.resolve();
}

module.exports = {
    getOTP,
    sendOtp,
    OTP_DELAY
};