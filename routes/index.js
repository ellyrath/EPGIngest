var io_socket = require('socket.io');
var express = require('express');
var router = express.Router();
var fs = require('fs'),
    xml2js = require('xml2js');
var async = require('async');
var sourcesSaxStream = require("sax").createStream(true);
var programsSaxStream = require("sax").createStream(true);
var schedulesSaxStream = require("sax").createStream(true);
var path = require('path');
var sourcesFilesToBeDeleted = ["sources.txt", "sources-images.txt"];
var programFilesToBeDeleted = ["programs.txt", "programs-cast.txt", "programs-image.txt", "programs-imageids.txt"];
var schedulesFilesToBeDeleted = ["schedules.txt"];
router.io = io_socket;
var inputDirectoryPrefix = "../xmls";
var outputDirectoryPrefix = "output";
var sourceParser = require('../parsers/sources')(sourcesSaxStream, outputDirectoryPrefix, router.io);
//var programParser = require('../parsers/programs')(programsSaxStream, outputDirectoryPrefix);
//var programParser = require('../parsers/programs_obj')(programsSaxStream, outputDirectoryPrefix, router.io);
var programParser = null;
var schedulesParser = require('../parsers/schedules')(schedulesSaxStream, outputDirectoryPrefix, router.io);
var filePurger = require('../utils/filePurger');
var dirString = path.dirname(fs.realpathSync(__filename));


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: "EPG Ingest Pipeline"});
});
router.get('/sources', function (req, res, next) {
    //Remove any existing files
    filePurger(outputDirectoryPrefix, sourcesFilesToBeDeleted);
    console.time('sources parsing');
    var filePath = path.join(dirString,inputDirectoryPrefix, "sources.xml");
   console.log('directory to start walking...', dirString);
    console.info('filePath'+ filePath);
if (fs.existsSync(filePath)) {
        fs.createReadStream(filePath)
            .pipe(sourceParser);

    }
    res.render('sources', {title: "Parsing the Sources XML"});

});
router.get('/programs', function (req, res, next) {
    //Remove any existing files
    filePurger(outputDirectoryPrefix, programFilesToBeDeleted);
    console.time('programs parsing');
    var filePath = path.join(dirString,inputDirectoryPrefix, "programs.xml");
    if (!programParser) {
        programParser = require('../parsers/programs_obj')(programsSaxStream, outputDirectoryPrefix, router.io);
    }
    if (fs.existsSync(filePath)) {
        fs.createReadStream(filePath)
            .pipe(programParser);
        router.io.sockets.emit('parsing start');
    }
    res.render('programs', {title: "Parsing the Programs XML"});

});
router.get('/schedules', function (req, res, next) {
    //Remove any existing files
    filePurger(outputDirectoryPrefix, schedulesFilesToBeDeleted);
    console.time('schedules parsing');
    var filePath = path.join(dirString,inputDirectoryPrefix, "schedules.xml");
    //if (fs.existsSync(filePath)) {
    fs.createReadStream(filePath)
        .pipe(schedulesParser);
    //}
    res.render('schedules', {title: "Parsing the Schedules XML"});

});
router.get('/files', function (req, res, next) {
    fs.createReadStream(path.join(outputDirectoryPrefix, "programs.txt")).pipe(res);
});

module.exports = router;
