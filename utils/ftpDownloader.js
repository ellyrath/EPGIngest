var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var Client = require('ftp');

var retryAttempts = 3,
    numberOfFailedAttempts = 1,
    fileMatchPattern = '',
    downloadDir = '';

var c = new Client();
c.on('error', function (error) {
    console.log(error);
    numberOfFailedAttempts++;
    if (numberOfFailedAttempts <= retryAttempts) {
        console.log('Retrying: attempt # ' + numberOfFailedAttempts);
        connectAndDownloadFiles();
    }
});

Promise.promisifyAll(c);

var connectionProperties = {};

var connect = function () {
    c.connect(connectionProperties);
    return c.onAsync('ready');
};

var getList = function () {
    return c.listAsync();
};

var zipFiles = function (element) {
    return element.type !== 'd' && element.name.match(new RegExp(fileMatchPattern));
};

var current = Promise.resolve();

var downloadFiles = function (file) {
    current = current.then(function () {
        return c.getAsync(file.name)
    }).then(function (stream) {
        stream.pipe(fs.createWriteStream(path.join(downloadDir, file.name)));
        console.log(file.name + ' downloaded..');
    });
    return current;
};

var listFiles = function (file) {
    console.log(file.name);
};

var closeConnection = function () {
    c.end();
};

function connectAndDownloadFiles() {
    return connect().then(getList).filter(zipFiles).map(downloadFiles).then(closeConnection);
    //connect().then(getList).filter(zipFiles).map(listFiles).done(closeConnection);
}

function ftpFiles(ftpConfig) {
    if (!ftpConfig) {
        return
    }
    connectionProperties = ftpConfig.connectionProperties;
    fileMatchPattern = ftpConfig.fileMatchPattern;
    downloadDir = ftpConfig.downloadDir;
    retryAttempts = ftpConfig.retryAttempts && !isNaN(ftpConfig.retryAttempts) ? ftpConfig.retryAttempts : retryAttempts;
    return connectAndDownloadFiles();
}

module.exports = ftpFiles;