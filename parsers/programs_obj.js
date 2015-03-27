var os = require('os');
var fileAppender = require('../utils/fileAppender');
var _ = require('underscore');
var io = require('../app');


var programsParser = function (saxStream, outputDirectoryPrefix, io) {
    saxStream.on("error", function (e) {
        // unhandled errors will throw, since this is a proper node
        // event emitter.
        console.error("error!", e)
        // clear the error
        this._parser.error = null
        this._parser.resume()
    });
    var validRecordTags = ["progType", "synNum", "origAirDate"];
    var validCastTags = ["characterName", "first", "last"];
    var validImageTags = ["URI"];
    var fieldSeparator = "|";
    var programRecordTemplate = {
        'TMSId': '',
        'connectorId': '',
        'rootId': '',
        'seasonId': '',
        'seriesId': '',
        'code': '',
        'ratingsBody': '',
        'genre': [],
        'title': '',
        'desc': '',
        'progType': '',
        'synNum': '',
        'origAirDate': ''
    };
    var programRecord = {};
    _.extend(programRecord, programRecordTemplate);
    var programCastTemplate = {
        'TMSId': '',
        'personId': '',
        'ord': '',
        'characterName': '',
        'first': '',
        'last': '',
        'name': ''
    };
    var programCast = {};
    _.extend(programCast, programCastTemplate);
    var imageRecord = null;
    var currentTag = "";
    var tmsId = "";
    var seriesId = "";
    var hasTitleBeenPushed = false;
    var hasDescBeenPushed = true;
    var hasRatingBeenPushed = false;
    var isEpisode = false;
    var isCast = false;
    var programCount = 0;
    var verticalImages = [];
    var horizontalImages = [];
    var cleanUp = function (item) {
        return item && item.indexOf('\n') == -1 && item.indexOf('\r') == -1 && item.indexOf('\t') == -1
    };
    var getProgramImage = function (TMSId, width, height, type, url, orientation) {
        return {
            'sourceId': TMSId,
            'width': width,
            'height': height,
            'type': type,
            'url': url,
            'orientation': orientation
        }
    };
    var largestImage = function (programImage) {
        return programImage['width'] * programImage['height'];
    };

    saxStream.on("opentag", function (node) {

        if (node.name === 'program') {
            programRecord['TMSId'] = node.attributes['TMSId'];
            programCast['TMSId'] = node.attributes['TMSId'];
            programRecord['connectorId'] = node.attributes['connectorId'];
            programRecord['rootId'] = node.attributes['rootId'];
            programRecord['seasonId'] = node.attributes['seasonId'];
            programRecord['seriesId'] = node.attributes['seriesId'];
            tmsId = node.attributes['TMSId'];
            seriesId = node.attributes['seriesId'];
            hasTitleBeenPushed = false;
            hasDescBeenPushed = true;
            hasRatingBeenPushed = false;
            programCount++;
            verticalImages = [];
            horizontalImages = [];
        }
        if (node.name === 'episodeInfo') {
            isEpisode = true;
        }
        if (node.name === 'desc' && node.attributes['size'] === '100') {
            hasDescBeenPushed = false;
        }
        if (node.name === 'rating' && !hasRatingBeenPushed) {
            programRecord['code'] = node.attributes['code'];
            programRecord['ratingsBody'] = node.attributes['ratingsBody'];
            hasRatingBeenPushed = true;
        }
        if (node.name === 'cast') {
            isCast = true;
        }
        if (isCast && node.name === 'member') {
            programCast['personId'] = node.attributes['personId'];
            programCast['ord'] = node.attributes['ord'];
        }
        if (node.name === 'asset' && node.attributes['type'].indexOf('image') != -1 && node.attributes['action'] !== 'delete') {
            //imageRecord.push(node.attributes['assetId']);
            imageRecord = new getProgramImage(tmsId, node.attributes['width'], node.attributes['height'], node.attributes['type'].replace(/image\//g, ''));
            imageRecord['orientation'] = imageRecord['height'] > imageRecord['width'] ? 'V' : 'H';
        }
        currentTag = node.name;
    });
    saxStream.on("attribute", function (node) {
    });
    saxStream.on("closetag", function (node) {
        if (node === 'program') {
            programRecord['genre'] = programRecord['genre'].join(',');
            //To maintain the order
            var finalProgramRecord = [];
            finalProgramRecord.push(programRecord['TMSId']);
            finalProgramRecord.push(programRecord['connectorId']);
            finalProgramRecord.push(programRecord['rootId']);
            finalProgramRecord.push(programRecord['seasonId']);
            finalProgramRecord.push(programRecord['seriesId']);
            finalProgramRecord.push(programRecord['code']);
            finalProgramRecord.push(programRecord['ratingsBody']);
            finalProgramRecord.push(programRecord['genre']);
            finalProgramRecord.push(programRecord['title']);
            finalProgramRecord.push(programRecord['desc']);
            finalProgramRecord.push(programRecord['progType']);
            finalProgramRecord.push(programRecord['synNum']);
            finalProgramRecord.push(programRecord['origAirDate']);
            fileAppender(outputDirectoryPrefix, 'programs.txt', finalProgramRecord.join(fieldSeparator) + os.EOL);
            _.extend(programRecord, programRecordTemplate);
            programRecord['genre'] = [];
            _.extend(programCast, programCastTemplate);
            tmsId = "";
            seriesId = "";
        }
        if (node === 'title') {
            hasTitleBeenPushed = true;
        }
        if (node === 'desc') {
            hasDescBeenPushed = true;
        }
        if (node === 'episodeInfo') {
            isEpisode = false;
        }
        if (node === 'cast') {
            isCast = false;
        }
        if (isCast && node === 'member') {
            fileAppender(outputDirectoryPrefix, 'programs-cast.txt', _.values(programCast).join(fieldSeparator) + os.EOL);
            programCast = {"TMSId": tmsId};
        }
        if (node === 'assets') {
            if (!_.isEmpty(horizontalImages)) {
                fileAppender(outputDirectoryPrefix, 'programs-image.txt', _.values(_.max(horizontalImages, largestImage)).join(fieldSeparator) + os.EOL);
            } else {
                var dummyHorizontalImage = new getProgramImage(tmsId);
                dummyHorizontalImage['orientation'] = 'H';
                fileAppender(outputDirectoryPrefix, 'programs-image.txt', _.values(dummyHorizontalImage).join(fieldSeparator) + os.EOL);
                dummyHorizontalImage = null;
            }
            if (!_.isEmpty(verticalImages)) {
                fileAppender(outputDirectoryPrefix, 'programs-image.txt', _.values(_.max(verticalImages, largestImage)).join(fieldSeparator) + os.EOL);
            } else {
                var dummyVerticalImage = new getProgramImage(tmsId);
                dummyVerticalImage['orientation'] = 'V';
                fileAppender(outputDirectoryPrefix, 'programs-image.txt', _.values(dummyVerticalImage).join(fieldSeparator) + os.EOL);
                dummyVerticalImage = null;
            }
            //fileAppender(outputDirectoryPrefix, 'programs-imageids.txt', [tmsId, seriesId, imageRecord[0]].join(fieldSeparator) + os.EOL);
            verticalImages = [];
            horizontalImages = [];
        }
        currentTag = "";
    });
    saxStream.on("end", function (node) {
        io.sockets.emit('parsing end');
        console.timeEnd("programs parsing");
        console.info(programCount + " programs processed.");
    });
    saxStream.on("text", function (text) {
        //Don't entertain garbage
        if (text.indexOf('\n') !== -1 || text.indexOf('\r') !== -1 || text.indexOf('\t') !== -1) {
            return;
        }
        if (this._parser.tagName === 'title' && !hasTitleBeenPushed) {
            programRecord['title'] = this._parser.textNode;
        } else if (this._parser.tagName === 'desc' && !hasDescBeenPushed) {
            programRecord['desc'] = this._parser.textNode;
        } else if (this._parser.tagName === 'genre') {
            programRecord['genre'].push(this._parser.textNode);
        } else if (validRecordTags.indexOf(currentTag) != -1) {
            programRecord[currentTag] = text;
        }
        if (isCast && validCastTags.indexOf(currentTag) != -1) {
            programCast[currentTag] = text;
            if (currentTag === "last") {
                programCast['name'] = programCast['first'] + " " + text;
            }
        }
        if (validImageTags.indexOf(this._parser.tagName) != -1) {
            if(!imageRecord) {
                return;
            }
            imageRecord['url'] = 'http://demo.tmsimg.com/' + text;
            if (imageRecord['orientation'] === 'V') {
                verticalImages.push(imageRecord);
            } else {
                horizontalImages.push(imageRecord);
            }
            imageRecord = null;
        }
    });
    return saxStream;
};

module.exports = programsParser;