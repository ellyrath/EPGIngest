var fs = require('fs');
var path = require('path');

var filePurger = function (directory, filenames) {
    filenames.forEach(function (fileName) {
        var filePath = path.join(directory, fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath, function (err) {
                if (err) throw err;
                //console.log('successfully deleted');
            })
        }
    });
};

module.exports = filePurger;