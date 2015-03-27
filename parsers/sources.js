var os = require('os');
var fileAppender = require('../utils/fileAppender');
var _ = require('underscore');

var sourcesParser = function (saxStream, outputDirectoryPrefix) {
    saxStream.on("error", function (e) {
        // unhandled errors will throw, since this is a proper node
        // event emitter.
        console.error("error!", e)
        // clear the error
        this._parser.error = null
        this._parser.resume()
    });
    var validTags = ["name", "type", "timeZone", "callSign"];
    var fieldSeparator = "|";
    var sourceRecord = [];
    var sourceImages = [];
    var getSourceImage = function (sourceId, width, height, type, url) {
        return {
            'sourceId': sourceId,
            'width': width,
            'height': height,
            'type': type,
            'url': url
        }
    };
    var currentSourceImage = null;
    var largestImage = function (sourceImage) {
        return sourceImage['width'] * sourceImage['height'];
    };
    var currentTag = "";
    var prgSvcId = "";
    var sourceId = "";

    saxStream.on("opentag", function (node) {
        if (node.name === 'prgSvc') {
            sourceRecord.push(node.attributes['sourceId']);
            prgSvcId = node.attributes['prgSvcId'];
            sourceId = node.attributes['sourceId'];
        }
        if (node.name === 'image') {
            currentSourceImage = new getSourceImage(sourceId, node.attributes['width'], node.attributes['height'], node.attributes['type'].replace(/image\//g, ''));
        }
        currentTag = node.name;
    });
    saxStream.on("attribute", function (node) {
        // same object as above
    });
    saxStream.on("closetag", function (node) {
        if (node === 'prgSvc') {
            fileAppender(outputDirectoryPrefix, 'sources.txt', sourceRecord.join(fieldSeparator) + os.EOL);
            sourceRecord = [];
            sourceImages = [];
            prgSvcId = "";
            sourceId = "";
        }
        if (node === 'images' && !_.isEmpty(sourceImages)) {
            fileAppender(outputDirectoryPrefix, 'sources-images.txt', _.values(_.max(sourceImages, largestImage)).join(fieldSeparator) + os.EOL);
            sourceImages = [];
        }
        currentTag = "";
    });
    saxStream.on("end", function (node) {
        console.timeEnd("sources parsing");
    });
    saxStream.on("text", function (text) {
        if (validTags.indexOf(currentTag) != -1) {
            sourceRecord.push(text);
        }
        if (currentTag === "URI") {
            currentSourceImage['url'] = 'http://demo.tmsimg.com/' + text;
            sourceImages.push(currentSourceImage);
            currentSourceImage = null;
        }
    });
    return saxStream;
};

module.exports = sourcesParser;