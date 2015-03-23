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

var inputDirectoryPrefix = "xmls";
var outputDirectoryPrefix = "output";
var sourceParser = require('../parsers/sources')(sourcesSaxStream, outputDirectoryPrefix);
//var programParser = require('../parsers/programs')(programsSaxStream, outputDirectoryPrefix);
var programParser = require('../parsers/programs_obj')(programsSaxStream, outputDirectoryPrefix);
var schedulesParser = require('../parsers/schedules')(schedulesSaxStream, outputDirectoryPrefix);
var filePurger = require('../utils/filePurger');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: "Welcome to the EPG Injest XML Parser"});
});
router.get('/sources', function (req, res, next) {
    //Remove any existing files
    filePurger(outputDirectoryPrefix, sourcesFilesToBeDeleted);
    console.time('sources parsing');

    var filePath = path.join(inputDirectoryPrefix, "sources.xml");
    if (path.existsSync(filePath)) {
        fs.createReadStream(filePath)
            .pipe(sourceParser);
    }
    res.render('sources', {title: "Parsing the Sources XML"});

});
router.get('/programs', function (req, res, next) {
    //Remove any existing files
    filePurger(outputDirectoryPrefix, programFilesToBeDeleted);
    console.time('programs parsing');
    //var filePath = path.join(inputDirectoryPrefix, "programs_trial.xml");
    var filePath = path.join(inputDirectoryPrefix, "programs.xml");
    if (path.existsSync(filePath)) {
        fs.createReadStream(filePath)
            .pipe(programParser);
    }
    res.render('programs', {title: "Parsing the Programs XML"});

});
router.get('/schedules', function (req, res, next) {
    //Remove any existing files
    filePurger(outputDirectoryPrefix, schedulesFilesToBeDeleted);
    console.time('schedules parsing');
    var filePath = path.join(inputDirectoryPrefix, "schedules.xml");
    //if (path.existsSync(filePath)) {
    fs.createReadStream(filePath)
        .pipe(schedulesParser);
    //}
    res.render('schedules', {title: "Parsing the Schedules XML"});

});
router.get('/files', function (req, res, next) {
    fs.createReadStream(path.join(outputDirectoryPrefix, "programs.txt")).pipe(res);
});

module.exports = router;