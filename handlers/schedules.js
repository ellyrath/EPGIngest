#!/usr/bin/env node

var io_socket = require('socket.io');
var fs = require('fs'),
    xml2js = require('xml2js');
var path = require('path');
var filePurger = require('../utils/filePurger');
var dirString = path.dirname(fs.realpathSync(__filename));
var schedulesSaxStream = require("sax").createStream(true);
var schedulesFilesToBeDeleted = ["schedules.txt", "generic-schedules.txt"];
var inputDirectoryPrefix = "../xmls";

var outputDirectoryPrefix = "../output";
var schedulesParser = require('../parsers/schedules')(schedulesSaxStream, outputDirectoryPrefix);

//Remove any existing files
filePurger(outputDirectoryPrefix, schedulesFilesToBeDeleted);
console.time('schedules parsing');
var filePath = path.join(dirString, inputDirectoryPrefix, "schedules.xml");
//var filePath = path.join(dirString, inputDirectoryPrefix, "schedules_sample.xml");
console.log('directory to start walking...', dirString);
console.info('filePath' + filePath);
if (fs.existsSync(filePath)) {
    fs.createReadStream(filePath).pipe(schedulesParser);
}
