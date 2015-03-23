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
    var validTags = ["name", "type", "timeZone", "callSign"];
    var fieldSeparator = "|";
    var sourceRecord = [];
    var sourceImage = [];
    var currentTag = "";
    var prgSvcId = "";
    var sourceId = "";
    var hasImageBeenPushed = true;
    var useImage = false;

    saxStream.on("opentag", function (node) {
        if (node.name === 'prgSvc') {
            sourceRecord.push(node.attributes['sourceId']);
            prgSvcId = node.attributes['prgSvcId'];
            sourceId = node.attributes['sourceId'];
            hasImageBeenPushed = false;
            useImage = false;
        }
        if (node.name === 'image' && !hasImageBeenPushed && node.attributes['primary'] === 'true') {
            sourceImage.push(sourceId);
            sourceImage.push(node.attributes['width']);
            sourceImage.push(node.attributes['height']);
            sourceImage.push(node.attributes['type'].replace(/image\//g, ''));
            useImage = true;
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
            sourceImage = [];
            prgSvcId = "";
            sourceId = "";
        }
        if(node === 'image' && useImage) {
            useImage = false;
        }
        if (node === 'URI' && sourceImage.length) {
            fileAppender(outputDirectoryPrefix, 'sources-images.txt', sourceImage.join(fieldSeparator) + os.EOL);
            hasImageBeenPushed = true;
            sourceImage = [];
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
        if (currentTag === "URI" && !hasImageBeenPushed && useImage) {
            sourceImage.push('http://demo.tmsimg.com/' + text);
        }
    });
    return saxStream;
};

module.exports = sourcesParser;