var path = require('path');
var fs = require('fs');
var PropertiesReader = require('properties-reader');
var propertyDirectoryPrefix = "../app_properties/epg-ingest.properties";

var dirString = path.dirname(fs.realpathSync(__filename));
var filePath = path.join(dirString, propertyDirectoryPrefix);



var readProperties = function (propertyName) {
    var properties = PropertiesReader(filePath);
    return properties.get(propertyName);
};


var myObj = {
    rp: readProperties
};
module.exports = myObj;