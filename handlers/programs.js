#!/usr/bin/env node

var io_socket = require('socket.io');
var fs = require('fs'),
    xml2js = require('xml2js');
var path = require('path');
var filePurger = require('../utils/filePurger') ;
var dirString = path.dirname(fs.realpathSync(__filename));
var programsSaxStream = require("sax").createStream(true);
var programFilesToBeDeleted = ["programs.txt", "programs-cast.txt", "programs-image.txt", "programs-imageids.txt"];
var inputDirectoryPrefix = "../xmls";

var outputDirectoryPrefix = "../output";
programParser = require('../parsers/programs_obj')(programsSaxStream, outputDirectoryPrefix);
//Remove any existing files
filePurger(outputDirectoryPrefix, programFilesToBeDeleted);
console.time('programs parsing');
var filePath = path.join(dirString,inputDirectoryPrefix, "programs.xml");
console.log('directory to start walking...', dirString);
console.info('filePath' + filePath);
if (fs.existsSync(filePath)) {
    fs.createReadStream(filePath).pipe(programParser);
}
