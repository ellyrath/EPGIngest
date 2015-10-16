#!/usr/bin/env node

var io_socket = require('socket.io');
var fs = require('fs'),
    xml2js = require('xml2js');
var path = require('path');
var filePurger = require('../utils/filePurger') ;
var dirString = path.dirname(fs.realpathSync(__filename));
var sourcesSaxStream = require("sax").createStream(true);
var sourcesFilesToBeDeleted = ["sources.txt", "sources-images.txt"];
var inputDirectoryPrefix = "../xmls";

var outputDirectoryPrefix = "../output";
var sourceParser = require('../parsers/sources')(sourcesSaxStream, outputDirectoryPrefix);
//Remove any existing files
filePurger(outputDirectoryPrefix, sourcesFilesToBeDeleted);
console.time('sources parsing');
var filePath = path.join(dirString, inputDirectoryPrefix, "sources.xml");
console.log('directory to start walking...', dirString);
console.info('filePath' + filePath);
if (fs.existsSync(filePath)) {
    fs.createReadStream(filePath).pipe(sourceParser);
}
