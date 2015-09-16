var ftpDownloader = require('../utils/ftpDownloader');
var properyReader = require('../utils/propertyReader');
var ftpConfig = {
    connectionProperties: {
        host: properyReader.rp("ftp_connection_host"),
        user: properyReader.rp("ftp_connection_user"),
        password: properyReader.rp("ftp_connection_pwd"),
        connTimeout: parseInt(properyReader.rp("ftp_connection_timeout"))
    },
    retryAttempts: parseInt(properyReader.rp("ftp_connection_retry"))
};
ftpDownloader(ftpConfig);