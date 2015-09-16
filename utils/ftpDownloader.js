var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var Client = require('ftp');

var retryAttempts = 3,
    numberOfFailedAttempts = 1;

var c = new Client();
c.on('error', function (error) {
    console.log(error);
    numberOfFailedAttempts++;
    if(numberOfFailedAttempts <= retryAttempts) {
        console.log('Retrying: attempt # ' + numberOfFailedAttempts);
        connectAndDownloadFiles();
    }
});

Promise.promisifyAll(c);

var connectionProperties = {
    host: "on.tmstv.com",
    user: "onsample",
    password: "192dn884"
};

var connect = function () {
    c.connect(connectionProperties);
    return c.onAsync('ready');
};

var getList = function () {
    return c.listAsync();
};

var zipFiles = function (element) {
    //return element.type !== 'd' && path.extname(element.name) === '.gz';
    return element.type !== 'd' && element.name === 'on_swe_smpl_tv_sources_v22_20150911.xml.gz';
};

var current = Promise.resolve();

var downloadFiles = function (file) {
    current = current.then(function () {
        return c.getAsync(file.name)
    }).then(function (stream) {
        stream.pipe(fs.createWriteStream(file.name));
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
    //connect().then(getList).filter(zipFiles).map(downloadFiles).done(closeConnection);
    connect().then(getList).filter(zipFiles).map(listFiles).done(closeConnection);
}

function ftpFiles(ftpConfig) {
    if (!ftpConfig) {
        return
    }
    connectionProperties = ftpConfig.connectionProperties;
    retryAttempts = ftpConfig.retryAttempts && !isNaN(ftpConfig.retryAttempts) ? ftpConfig.retryAttempts : retryAttempts;
    connectAndDownloadFiles();
}

module.exports = ftpFiles;