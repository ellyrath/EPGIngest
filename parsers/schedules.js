var os = require('os');
var fileAppender = require('../utils/fileAppender');

var sourcesParser = function (saxStream, outputDirectoryPrefix) {
    saxStream.on("error", function (e) {
        // unhandled errors will throw, since this is a proper node
        // event emitter.
        console.error("error!", e)
        // clear the error
        this._parser.error = null
        this._parser.resume()
    });
    var validTags = ["time"];
    var fieldSeparator = "|";
    var scheduleRecord = [];
    var currentTag = "";
    var prgSvcId = "";
    var sourceId = "";

    saxStream.on("opentag", function (node) {
        if (node.name === 'schedule') {
            scheduleRecord.push(node.attributes['prgSvcId']);
            scheduleRecord.push(node.attributes['sourceId']);
            prgSvcId = node.attributes['prgSvcId'];
            sourceId = node.attributes['sourceId'];
        }
        if (node.name === 'event') {
            scheduleRecord.push(node.attributes['TMSId']);
            scheduleRecord.push(node.attributes['date']);
        }
        if (node.name === 'tv') {
            var duration = node.attributes['dur'].replace(/[^0-9]/g, ''); //PT00H30M => 0030
            scheduleRecord.push(duration);
        }
        currentTag = node.name;
    });
    saxStream.on("attribute", function (node) {
        // same object as above
    });
    saxStream.on("closetag", function (node) {
        if (node === 'schedule') {
            prgSvcId = "";
            sourceId = "";
            scheduleRecord = [];
        }
        if (node === 'event') {
            fileAppender(outputDirectoryPrefix, 'schedules.txt', scheduleRecord.join(fieldSeparator) + os.EOL);
            scheduleRecord = [prgSvcId, sourceId];
        }
        currentTag = "";
    });
    saxStream.on("end", function (node) {
        console.timeEnd("schedules parsing");
    });
    saxStream.on("text", function (text) {
        if (validTags.indexOf(currentTag) != -1) {
            scheduleRecord.push(text);
        }
    });
    return saxStream;
};

module.exports = sourcesParser;