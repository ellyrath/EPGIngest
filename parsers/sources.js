var os = require('os');
var fileAppender = require('../utils/fileAppender');
var _ = require('underscore');
var util = require("util");



var sourcesParser = function (saxStream, outputDirectoryPrefix) {
    saxStream.on("error", function (e) {
        // unhandled errors will throw, since this is a proper node
        // event emitter.
        console.error("error!", e)
        // clear the error
        this._parser.error = null
        this._parser.resume()
    });

    var sourceTemplate = {
        'STATION_NUM': '',
        'STATION_NAME': '',
        'STATION_CALL_SIGN': '',
        'STATION_TIME_ZONE': '',
        'STATION_AFFIL': "",
        'STATION_CITY': "",
        'STATION_STATE': "",
        'STATION_COUNTRY': "",
        'FCC_CHANNEL_NUM': "",
        'sourceImageStore': {
            'width': '',
            'height': '',
            'type': '',
            'url': ''
        }
    };

    //var sourceImageTemplate = {
    //    'width': '',
    //    'height': '',
    //    'type': '',
    //    'url': ''
    //};

    var print = function(o){
        var str='';
        for (var p in o) {
                 if (p === 'sourceImageStore' )
                {
                    str += print(o[p])+ fieldSeparator;
                }
                else
                str += o[p] + fieldSeparator;
            }
        return str;
    }
    var printHeader = function(o){
        var str='';
        for(var p in o){
            str+= p + fieldSeparator;
        }
        return str;
    }
    var sourceRecord = {};
    _.extend(sourceRecord, sourceTemplate);

    var validTags = ["name", "type", "timeZone", "callSign","num"];
    var fieldSeparator = "|";
    //var sourceRecord = [];
    var sourceImages = [];
    var getSourceImage = function ( width, height, type, url) {
        return {
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
        if (node.name === 'on'){
            // Write header
            fileAppender(outputDirectoryPrefix, 'sources.txt', printHeader(sourceTemplate) + os.EOL);
        }
        if (node.name === 'prgSvc') {
            sourceRecord['STATION_NUM'] = node.attributes['prgSvcId'];
          //  sourceRecord.push(node.attributes['prgSvcId']);
          //  prgSvcId = node.attributes['prgSvcId'];
            //sourceId = node.attributes['sourceId'];
        }
        if (node.name === 'image') {
            currentSourceImage = new getSourceImage( node.attributes['width'], node.attributes['height'], node.attributes['type'].replace(/image\//g, ''));
        }
        currentTag = node.name;
    });
    saxStream.on("attribute", function (node) {
        // same object as above
    });
    saxStream.on("closetag", function (node) {
        if (node === 'prgSvc') {
         //   fileAppender(outputDirectoryPrefix, 'sources.txt', sourceRecord.join(fieldSeparator) + os.EOL);

            fileAppender(outputDirectoryPrefix, 'sources.txt', print(sourceRecord) + os.EOL);
            sourceRecord['sourceImageStore']=[];
                sourceRecord = [];
            sourceImages = [];
            prgSvcId = "";
            sourceId = "";
            _.extend(sourceRecord, sourceTemplate);

        }
        if (node === 'images' && !_.isEmpty(sourceImages)) {
            //fileAppender(outputDirectoryPrefix, 'sources-images.txt', _.values(_.max(sourceImages, largestImage)).join(fieldSeparator) + os.EOL);
            //sourceRecord.push(_.values(_.max(sourceImages, largestImage)).join(fieldSeparator));
            var sourceImageMax = (_.max(sourceImages, largestImage));
            //_.extend(sourceImageTemplate,sourceImageMax) ;
              sourceRecord['sourceImageStore']=  sourceImageMax ;
            console.log(sourceRecord['sourceImageStore']);
            sourceImages = [];
        }
        currentTag = "";
    });
    saxStream.on("end", function (node) {
        console.timeEnd("sources parsing");
    });
    saxStream.on("text", function (text) {
        if (validTags.indexOf(currentTag) != -1) {
            if (currentTag == 'name')
                sourceRecord['STATION_NAME']=text;
            if (currentTag == 'timeZone')
                sourceRecord['STATION_TIME_ZONE']=text;
            if (currentTag == 'callSign')
                sourceRecord['STATION_CALL_SIGN']=text;
            if (currentTag == 'num')
                sourceRecord['FCC_CHANNEL_NUM']=text;
            if (currentTag == 'city')
                sourceRecord['STATION_CITY']=text;
            if (currentTag == 'state')
                sourceRecord['STATION_STATE']=text;
            if (currentTag == 'country')
                sourceRecord['STATION_COUNTRY']=text;
    // sourceRecord..push(text);
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