var os = require('os');
var fileAppender = require('../utils/fileAppender');
var _ = require('underscore');

var programsParser = function (saxStream, outputDirectoryPrefix) {
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
    var imageRecordTemplate = {
        'TMSId': '',
        'width': '',
        'height': '',
        'type': '',
        'URI': ''
    };
    var imageRecord = {};
    _.extend(imageRecord, imageRecordTemplate);
    var currentTag = "";
    var tmsId = "";
    var seriesId = "";
    var hasTitleBeenPushed = false;
    var hasDescBeenPushed = true;
    var hasRatingBeenPushed = false;
    var hasImageBeenPushed = true;
    var useImage = false;
    var isEpisode = false;
    var isCast = false;
    var programCount = 0;
    var cleanUp = function (item) {
        return item && item.indexOf('\n') == -1 && item.indexOf('\r') == -1 && item.indexOf('\t') == -1
    }

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
            hasImageBeenPushed = false;
            hasRatingBeenPushed = false;
            programCount++;
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
        if (node.name === 'asset' && !hasImageBeenPushed && node.attributes['type'].indexOf('image') != -1 && node.attributes['action'] !== 'delete') {
            //imageRecord.push(node.attributes['assetId']);
            imageRecord['TMSId'] = tmsId;
            imageRecord['width'] = node.attributes['width'];
            imageRecord['height'] = node.attributes['height'];
            imageRecord['type'] = node.attributes['type'].replace(/image\//g, '');
            useImage = true;
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
            _.extend(imageRecord, imageRecordTemplate);
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
        if (node === 'asset' && useImage) {
            useImage = false;
        }
        if (node === 'URI' && !hasImageBeenPushed) {
            fileAppender(outputDirectoryPrefix, 'programs-image.txt', _.values(imageRecord).join(fieldSeparator) + os.EOL);
            //fileAppender(outputDirectoryPrefix, 'programs-imageids.txt', [tmsId, seriesId, imageRecord[0]].join(fieldSeparator) + os.EOL);
            hasImageBeenPushed = true;
            imageRecord = {'TMSId': tmsId};
        }
        currentTag = "";
    });
    saxStream.on("end", function (node) {
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
        if (validImageTags.indexOf(this._parser.tagName) != -1 && !hasImageBeenPushed && useImage) {
            imageRecord[this._parser.tagName] = 'http://demo.tmsimg.com/' + text;
        }
    });
    return saxStream;
};

module.exports = programsParser;