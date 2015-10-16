var os = require('os');
var console = require('console');
var _ = require('underscore');
var fileAppender = require('../utils/fileAppender');
var fieldSeparator = "|";
var properties = require('../utils/propertyReader');
var mapper = require('../utils/propsMapper');


var schedulesParser = function (saxStream, outputDirectoryPrefix) {
    saxStream.on("error", function (e) {
        // unhandled errors will throw, since this is a proper node
        // event emitter.
        console.error("error!", e)
        // clear the error
        this._parser.error = null
        this._parser.resume()
    });
    var validTags = ["time","tv", "tvRating", "tvSubRating","quals"];
    var fieldSeparator = "|";
    var currentTag = "";
    var prgSvcId = "";
    var sourceId = "";
    var isTVRating = false;
    var isMovieRating = false;


    var scheduleTemplate = {
        'sourceId': '',
        'prgSvcId': '',
        'TMSId': '',
        'date': '',
        'time':'',
        'duration': '',
        'tv_rating':'NR',
        'movie_rating':'NR',
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
        if (node.name === 'on'){
            // Write header
            fileAppender(outputDirectoryPrefix, 'schedules.txt', printHeader(scheduleTemplate) + os.EOL);
                   }
        if (node.name === 'schedule') {
            scheduleRecord['prgSvcId'] = node.attributes['prgSvcId'];
            scheduleRecord['sourceId'] = node.attributes['sourceId'];
            prgSvcId = node.attributes['prgSvcId'];
            sourceId = node.attributes['sourceId'];

        }
        if (node.name === 'event') {
            scheduleRecord['TMSId'] = (node.attributes['TMSId']);
            scheduleRecord['date'] = (node.attributes['date']);
        }
        if (node.name === 'tv') {
            var duration = node.attributes['dur'].replace(/[^0-9]/g, ''); //PT00H30M => 0030
            scheduleRecord['duration'] = duration;
            if (scheduleRecord['TMSId']==='MV000858660000') {
                console.log('node is TV isTVRating', isTVRating);
                console.log('node is TV  isMovieRating', isTVRating);
            }

        }
      if (node.name === 'tvRating' ) {

          if (node.attributes['body'] === properties.rp("TV_RatingsBody"))
          {
              isTVRating = true;
          }
          if (node.attributes['ratingsBody'] === properties.rp("Movie_RatingsBody"))
          {
            isMovieRating = true;
          }

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
            scheduleRecord = {};
            _.extend(scheduleRecord, scheduleTemplate);
        }
        if (node === 'event') {

            //To maintain the order
            var finalScheduleRecord = [];

            finalScheduleRecord.push(scheduleRecord['sourceId']);
            finalScheduleRecord.push(scheduleRecord['prgSvcId']);
            finalScheduleRecord.push(scheduleRecord['TMSId']);
            finalScheduleRecord.push(scheduleRecord['date']);
            finalScheduleRecord.push(scheduleRecord['time']);
            finalScheduleRecord.push(scheduleRecord['duration']);

            if (scheduleRecord['TMSId']=='MV000858660000') {
                console.log('finalScheduleRecord scheduleRecord[date]', scheduleRecord['date']);
                console.log('finalScheduleRecord scheduleRecord[tv_rating]', scheduleRecord['tv_rating']);
                console.log('finalScheduleRecord scheduleRecord[movie_rating]', scheduleRecord['movie_rating']);
            }


            finalScheduleRecord.push(scheduleRecord['tv_rating']);
            finalScheduleRecord.push(scheduleRecord['movie_rating']);
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
            fileAppender(outputDirectoryPrefix, 'schedules.txt', print(finalScheduleRecord) + os.EOL);
         //   fileAppender(outputDirectoryPrefix, 'schedules.txt',    _.values(scheduleRecord).join(fieldSeparator)  + os.EOL);


             scheduleRecord = {};
            _.extend(scheduleRecord, scheduleTemplate);
            scheduleRecord['prgSvcId'] = prgSvcId;
            scheduleRecord['sourceId'] = sourceId;
            isTVRating = false;
            isMovieRating = false;
         //   scheduleRecord = [prgSvcId, sourceId];
        }
        currentTag = "";
    });
    saxStream.on("end", function (node) {
        console.timeEnd("schedules parsing");
    });
    saxStream.on("text", function (text) {
        if (validTags.indexOf(currentTag) != -1) {

            if (currentTag == 'time')
                scheduleRecord['time'] = text;
            if (currentTag == 'duration')
                scheduleRecord['duration'] = text;
            if (currentTag == 'tvRating') {
                if (isMovieRating)
                    scheduleRecord['movie_rating'] = text;
                if (isTVRating)
                    scheduleRecord['tv_rating'] = text;
            }
            if (scheduleRecord['TMSId']=='MV000858660000') {
                console.log('text scheduleRecord[tv_rating]', scheduleRecord['tv_rating']);
                console.log('text scheduleRecord[movie_rating]', scheduleRecord['movie_rating']);

            }

            if (currentTag === 'tvSubRating') {
               mapper.map(scheduleRecord,text);
            }

            if (currentTag == 'quals') {
                  mapper.map(scheduleRecord,text);
            }


        }
    });
    return saxStream;
};

module.exports = schedulesParser;