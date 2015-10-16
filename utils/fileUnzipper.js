var fs = require('fs'),
    zlib = require('zlib'),
    unzip = zlib.createGunzip();

function unzipFile(inputFilePath, outputFilePath) {
    this.inputFilePath = inputFilePath;
    this.outputFilePath = outputFilePath;
    console.log(inputFilePath + ':' + outputFilePath);
    fs.createReadStream(this.inputFilePath).pipe(unzip).pipe(fs.createWriteStream(this.outputFilePath));
};

module.exports = unzipFile;
