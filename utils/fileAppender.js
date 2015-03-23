var fs = require('fs');
var path = require('path');

var appendToFile = function (directory, filename, data) {
    fs.appendFile(path.join(directory, filename), data, 'utf8', function (err) {
        if (err) throw err;
        //console.log('The was appended to file!');
    });
}

module.exports = appendToFile;