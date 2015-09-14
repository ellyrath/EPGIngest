var os = require('os');
var _ = require('underscore');
var console = require('console');
var fileAppender = require('../utils/fileAppender');
var fieldSeparator = "|";
var mapper = require('../utils/propsMapper');

var genericSchedulesParser = function (saxStream, outputDirectoryPrefix) {
    saxStream.on("error", function (e) {
        // unhandled errors will throw, since this is a proper node
        // event emitter.
        console.error("error!", e)
        // clear the error
        this._parser.error = null
        this._parser.resume()
    });
    var validTags = ["time","duration","tvRating", "tvFlags","props"];
    var fieldSeparator = "|";
 //   var scheduleRecord = [];
    var currentTag = "";
    var prgSvcId = "";
    var sourceId = "";


    var scheduleTemplate = {
        'ChannelId': '',
        'InChannelId': '',
        'ProgramId': '',
        'date': '',
        'time':'',
        'duration': '',
        'tv_rating':'',
        'Sex_rating':'N',
        'Violence_rating':'N',
        'Language_rating':'N',
        'Dialog_Rating':'N',
        'Fantasy_rating':'N',
        'CC': '',
        'STEREO': '',
        'NEW': '',
        'HDTV': ''
    };
    var scheduleRecord = {};
    _.extend(scheduleRecord, scheduleTemplate);

    var print = function(o){
        var str='';
        for (var p in o) {
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


    saxStream.on("opentag", function (node) {
        if (node.name === 'generic'){


            // Write header
            fileAppender(outputDirectoryPrefix, 'generic-schedules.txt', printHeader(scheduleTemplate) + os.EOL);
                   }
        if (node.name === 'schedule') {
            scheduleRecord['ChannelId'] = node.attributes['channelId'];
            scheduleRecord['InChannelId'] = node.attributes['channelId'];
            prgSvcId = node.attributes['channelId'];
            sourceId = node.attributes['channelId'];

        }
        if (node.name === 'event') {
            scheduleRecord['ProgramId'] = (node.attributes['programId']);
            scheduleRecord['date'] = (node.attributes['date']);
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

            //To maintain the order
            var finalScheduleRecord = [];
            finalScheduleRecord.push(scheduleRecord['ChannelId']);
            finalScheduleRecord.push(scheduleRecord['InChannelId']);
            finalScheduleRecord.push(scheduleRecord['ProgramId']);
            finalScheduleRecord.push(scheduleRecord['time']);
            finalScheduleRecord.push(scheduleRecord['duration']);
            finalScheduleRecord.push(scheduleRecord['tv_rating']);
            finalScheduleRecord.push(scheduleRecord['Sex_rating']);
            finalScheduleRecord.push(scheduleRecord['Violence_rating']);
            finalScheduleRecord.push(scheduleRecord['Language_rating']);
            finalScheduleRecord.push(scheduleRecord['Dialog_Rating']);
            finalScheduleRecord.push(scheduleRecord['Fantasy_rating']);
            finalScheduleRecord.push(scheduleRecord['CC']);
            finalScheduleRecord.push(scheduleRecord['STEREO']);
            finalScheduleRecord.push(scheduleRecord['NEW']);
            finalScheduleRecord.push(scheduleRecord['HDTV']);




        //    fileAppender(outputDirectoryPrefix, 'schedules.txt', scheduleRecord.join(fieldSeparator) + os.EOL);
            fileAppender(outputDirectoryPrefix, 'generic-schedules.txt', print(finalScheduleRecord) + os.EOL);
         //   fileAppender(outputDirectoryPrefix, 'schedules.txt',    _.values(scheduleRecord).join(fieldSeparator)  + os.EOL);


             scheduleRecord = {};
            _.extend(scheduleRecord, scheduleTemplate);
            scheduleRecord['ChannelId'] = prgSvcId;
            scheduleRecord['InChannelId'] = sourceId;
         //   scheduleRecord = [prgSvcId, sourceId];
        }
        currentTag = "";
    });
    saxStream.on("end", function (node) {
        console.timeEnd("generic");
    });
    saxStream.on("text", function (text) {
        if (validTags.indexOf(currentTag) != -1) {

            if (currentTag == 'time')
                scheduleRecord['time'] = text;
            if (currentTag == 'duration')
                scheduleRecord['duration'] = text;
            if (currentTag == 'tvRating')
                scheduleRecord['tv_rating'] = text;

            if (currentTag == 'props') {
                    mapper.map(scheduleRecord, text);
            }
            if (currentTag == 'tvFlags') {
                mapper.map(scheduleRecord, text);
            }
              //console.log('quals', text);
         //   var quals = text;
          //  var splitted = text.toString().split('|');
           // scheduleRecord.push(text);

        }
    });
    return saxStream;
};

module.exports = genericSchedulesParser;