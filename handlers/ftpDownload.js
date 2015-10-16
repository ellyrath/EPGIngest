var fs = require("fs");
var path = require('path');
var ftpDownloader = require('../utils/ftpDownloader');
var properyReader = require('../utils/propertyReader');
var fileUnzipper = require('../utils/fileUnzipper');

var ftpConfig = {
    connectionProperties: {
        host: properyReader.rp("ftp_connection_host"),
        user: properyReader.rp("ftp_connection_user"),
        password: properyReader.rp("ftp_connection_pwd"),
        connTimeout: parseInt(properyReader.rp("ftp_connection_timeout"))
    },
    retryAttempts: parseInt(properyReader.rp("ftp_connection_retry")),
    fileMatchPattern: properyReader.rp("file_name_pattern"),
    downloadDir: properyReader.rp("file_download_dir")
};
ftpDownloader(ftpConfig).then(function () {
    fs.readdir(ftpConfig.downloadDir, function (err, files) {
        if (files.length == 3) {
            //for (var i in files) {
            //    fileUnzipper(path.join(ftpConfig.downloadDir, files[i]), path.join(ftpConfig.downloadDir, files[i].replace(/\.gz/, '')));
            //}
        } else {

            throw new Error('All the required files were not downloaded');
        }
    });
}).done(function () {
    fs.readdir(ftpConfig.downloadDir, function (err, files) {
        for (var i in files) {
            console.log(files[i]);
        }
    });
});

//fs.readdir(ftpConfig.downloadDir, function (err, files) {
//    new fileUnzipper(path.join(ftpConfig.downloadDir, 'on_usa_samp_tv_programs_v22_20150918.xml.gz'), path.join(ftpConfig.downloadDir, 'on_usa_samp_tv_programs_v22_20150918.xml'));
//    new fileUnzipper(path.join(ftpConfig.downloadDir, 'on_usa_samp_tv_schedules_v22_20150918.xml.gz'), path.join(ftpConfig.downloadDir, 'on_usa_samp_tv_schedules_v22_20150918.xml'));
//    new fileUnzipper(path.join(ftpConfig.downloadDir, 'on_usa_samp_tv_sources_v22_20150918.xml.gz'), path.join(ftpConfig.downloadDir, 'on_usa_samp_tv_scources_v22_20150918.xml'));
//});
