const jwt = require("jsonwebtoken");
const moment = require('moment');
const { defaultDateFormat } = require("../constants");

const getAuthTokenFromHeader = (header, decode = false) => {
    const bearerHeader = header["authorization"];
    const token = bearerHeader && bearerHeader.split(" ")[1];

    if (decode) {
        return jwt.decode(token);
    }
    return token;
}


const resolveDateFormat = (data, format) => {
    if (data) {
        if (format)
            return moment(data, format)
        else if (!format)
            return moment(data, defaultDateFormat)
    }
    return moment().format(format ? format : defaultDateFormat)
}


const getFileExtension = (fileName) => {

    const array = fileName.split(".");
    if (array.length === 1 || (array[0] == "" && array.length === 2)) {
        return ""
    }
    return array.pop();

}


module.exports = { getAuthTokenFromHeader, resolveDateFormat, getFileExtension };