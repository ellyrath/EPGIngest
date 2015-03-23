var os = require('os');
var fileAppender = require('../utils/fileAppender');

var programsParser = function (saxStream, outputDirectoryPrefix) {
    saxStream.on("error", function (e) {
        // unhandled errors will throw, since this is a proper node
        // event emitter.
        console.error("error!", e)
        // clear the error
        this._parser.error = null
        this._parser.resume()
    });
    var validRecordTags = ["progType", "synNum", "origAirDate", "genre"];
    var validCastTags = ["characterName", "first", "last"];
    var validImageTags = ["URI"];
    var fieldSeparator = "|";
    var programRecord = [];
    var programCast = [];
    var imageRecord = [];
    var currentTag = "";
    var tmsId = "";
    var seriesId = "";
    var hasTitleBeenPushed = false;
    var hasDescBeenPushed = true;
    var hasRatingBeenPushed = false;
    var hasImageBeenPushed = true;
    var hasGenreBeenPushed = false;
    var useImage = false;
    var isEpisode = false;
    var isCast = false;
    var cleanUp = function (item) {
        return item && item.indexOf('\n') == -1 && item.indexOf('\r') == -1 && item.indexOf('\t') == -1
    }

    saxStream.on("opentag", function (node) {

        if (node.name === 'program') {
            programRecord.push(node.attributes['TMSId']);
            programCast.push(node.attributes['TMSId']);
            programRecord.push(node.attributes['connectorId']);
            programRecord.push(node.attributes['rootId']);
            programRecord.push(node.attributes['seasonId']);
            programRecord.push(node.attributes['seriesId']);
            tmsId = node.attributes['TMSId'];
            seriesId = node.attributes['seriesId'];
            hasTitleBeenPushed = false;
            hasDescBeenPushed = true;
            hasImageBeenPushed = false;
            hasGenreBeenPushed = false;
            hasRatingBeenPushed = false;
        }
        if (node.name === 'episodeInfo') {
            isEpisode = true;
        }
        if (node.name === 'desc' && node.attributes['size'] === '100') {
            hasDescBeenPushed = false;
        }
        if (node.name === 'rating' && !hasRatingBeenPushed) {
            programRecord.push(node.attributes['code']);
            programRecord.push(node.attributes['ratingsBody']);
            hasRatingBeenPushed = true;
        }
        if (node.name === 'cast') {
            isCast = true;
        }
        if (node.name === 'genre' && !hasGenreBeenPushed) {
            programRecord.push(node.attributes['genreId']);
        }
        if (isCast && node.name === 'member') {
            programCast.push(node.attributes['personId']);
            programCast.push(node.attributes['ord']);
        }
        if (node.name === 'asset' && !hasImageBeenPushed && node.attributes['type'].indexOf('image') != -1 && node.attributes['action'] !== 'delete') {
            //imageRecord.push(node.attributes['assetId']);
            imageRecord.push(tmsId);
            imageRecord.push(node.attributes['width']);
            imageRecord.push(node.attributes['height']);
            imageRecord.push(node.attributes['type'].replace(/image\//g, ''));
            useImage = true;
        }
        currentTag = node.name;
    });
    saxStream.on("attribute", function (node) {
    });
    saxStream.on("closetag", function (node) {
        if (node === 'program') {
            fileAppender(outputDirectoryPrefix, 'programs.txt', programRecord.join(fieldSeparator) + os.EOL);
            programRecord = [];
            programCast = [];
            imageRecord = [];
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
        if (node === 'genre') {
            hasGenreBeenPushed = true;
        }
        if (isCast && node === 'member' && programCast.length) {
            fileAppender(outputDirectoryPrefix, 'programs-cast.txt', programCast.join(fieldSeparator) + os.EOL);
            programCast = [tmsId];
        }
        if (node === 'asset' && useImage) {
            useImage = false;
        }
        if (node === 'URI' && imageRecord.length && !hasImageBeenPushed) {
            fileAppender(outputDirectoryPrefix, 'programs-image.txt', imageRecord.join(fieldSeparator) + os.EOL);
            //fileAppender(outputDirectoryPrefix, 'programs-imageids.txt', [tmsId, seriesId, imageRecord[0]].join(fieldSeparator) + os.EOL);
            hasImageBeenPushed = true;
            imageRecord = [tmsId];
        }
        currentTag = "";
    });
    saxStream.on("end", function (node) {
        console.timeEnd("programs parsing");
    });
    saxStream.on("text", function (text) {
        //Don't entertain garbage
        if (text.indexOf('\n') !== -1 || text.indexOf('\r') !== -1 || text.indexOf('\t') !== -1) {
            return;
        }
        if (this._parser.tagName === 'title' && !hasTitleBeenPushed) {
            programRecord.push(this._parser.textNode);
        } else if (this._parser.tagName === 'desc' && !hasDescBeenPushed) {
            programRecord.push(this._parser.textNode);
        } else if (this._parser.tagName === 'genre' && !hasGenreBeenPushed) {
            programRecord.push(this._parser.textNode);
        } else if (validRecordTags.indexOf(currentTag) != -1) {
            programRecord.push(text);
        }
        if (isCast && validCastTags.indexOf(currentTag) != -1) {
            programCast.push(text);
            if (currentTag === "last") {
                programCast.push(programCast[programCast.length - 2] + " " + text);
            }
        }
        if (validImageTags.indexOf(this._parser.tagName) != -1 && !hasImageBeenPushed && useImage) {
            imageRecord.push('http://demo.tmsimg.com/' + text);
        }
    });
    return saxStream;
};

module.exports = programsParser;