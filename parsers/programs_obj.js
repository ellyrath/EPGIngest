var os = require('os');
var fileAppender = require('../utils/fileAppender');
var _ = require('underscore');
var io = require('../app');
var properties = require('../utils/propertyReader');
var printer = require('../utils/recordPrinter');


var programsParser = function (saxStream, outputDirectoryPrefix, io) {
    saxStream.on("error", function (e) {
        // unhandled errors will throw, since this is a proper node
        // event emitter.
        console.error("error!", e)
        // clear the error
        this._parser.error = null
        this._parser.resume()
    });
    var printHeader = function(o){
        var str='';
        for(var p in o){
            str+= p + fieldSeparator;
        }
        return str;
    }
    var validRecordTags = ["progType", "synNum", "origAirDate"];
    var validCastTags = ["characterName", "role", "first", "last"];
    var validImageTags = ["URI"];
    var fieldSeparator = "|";
    var programRecordTemplate = {
        'TMSId': '',
        'connectorId': '',
        'rootId': '',
        'seasonId': '',
        'seriesId': '',
        'tv_rating': 'NR',
        'movie_rating': 'NR',
        'genre': [],
        'title': '',
        'desc': '',
        'progType': '',
        'synNum': '',
        'origAirDate': '',
        'seasonNum':'',
        'episodeNum':'',
        'episodeTitle':''
    };
    var programRecord = {};
    _.extend(programRecord, programRecordTemplate);
    var programCastTemplate = {
        'TMSId': '',
        'ord': '',
        'characterName': '',
        'role':'',
        'first': '',
        'last': '',
        'name': '',
        'personId': '',
        'nameId':''
    };
    var programCast = {};
    _.extend(programCast, programCastTemplate);
    var imageRecord = null;
    var currentTag = "";
    var tmsId = "";
    var seriesId = "";
    var hasTitleBeenPushed = false;
    var hasDescBeenPushed = true;
    var hasTVRatingBeenPushed = false;
    var hasMovieRatingBeenPushed = false;
    var isEpisode = false;
    var isMovie = false;
    var isCast = false;
    var programCount = 0;
    var programImages = [];
    var coverImageSelectionPreference = ["120x180", "240x360", "480x720", "960x1440", "135x180", "270x360", "540x720", "1080x1440"];
    var coverImageShowImageSelectionPreference = {
        "2x3": ["120x180", "240x360", "480x720", "960x1440"],
        "3x4": ["135x180", "270x360", "540x720", "1080x1440"]
    };
    var verticalMovieImageSelectionPreference = {
        "2x3": ["120x180", "240x360", "480x720", "960x1440"]
    };
    var horizontalMovieImageSelectionPreference = {
        "16x9": ["240x135", "480x270", "960x540", "1280x720", "1920x1080"],
        "3x2":["108x72","432x288"]
    };

    var sceneImageSelectionPreference = {
        "16x9": ["240x135", "480x270", "960x540", "1280x720", "1920x1080"],
        "4x3": ["180x135", "360x270", "720x540", "1440x1080"],
        "3x2": ["108x72", "432x288"],
        "all": ["240x135", "480x270", "960x540", "1280x720", "1920x1080", "180x135", "360x270", "720x540", "1440x1080","108x72", "432x288"]
    };
    var detailImageSelectionPreference = {
        "2x3": ["120x180", "240x360", "480x720", "960x1440"],
        "3x4": ["135x180", "270x360", "540x720", "1080x1440"]
    };
    var cleanUp = function (item) {
        return item && item.indexOf('\n') == -1 && item.indexOf('\r') == -1 && item.indexOf('\t') == -1
    };
    var getProgramImage = function (TMSId, width, height, type, url, tier, category, orientation) {
        return {
            'sourceId': TMSId,
            'width': width,
            'height': height,
            'type': type,
            'url': url,
            'tier': tier,
            'category': category
            //   'orientation': orientation
        }
    };
    var imageSelectionLogic = function (image) {
        return image['width'] + 'x' + image['height'];
    };
    var getAcceptableEpisodeImages = function (imageList) {
        return _(imageList).filter(function (pi) {
            return pi['tier'] && pi['tier'].toLowerCase() == 'episode';
        });
    };
    var getAcceptableSeasonImages = function (imageList) {
        return _(imageList).filter(function (pi) {
            return pi['tier'] && pi['tier'].toLowerCase() == 'season';
        });
    };
    var getAcceptableSeriesImages = function (imageList) {
        return _(imageList).filter(function (pi) {
            return pi['tier'] && pi['tier'].toLowerCase() == 'series';
        });
    };

    var getAcceptableProgramCategory = function (imageList, name) {
        var programCategoryList =   _(imageList).filter(function (pi) {
            return pi['category'].toLowerCase().indexOf(name) != -1;
        });

        var largestImage = function (sourceImage) {
            return sourceImage['width'] * sourceImage['height'];
        };
        var sourceImageMax = null;
        if (programCategoryList.length) {
            sourceImageMax = (_.max(programCategoryList, largestImage));
        }

        return sourceImageMax;
    };


    var getCoverImageOrig = function (programImages) {
        if (!programImages || !programImages.length) {
            return null;
        }
        var coverImagePreferenceFunction = function (img) {
            for (var i = 0; i < coverImageSelectionPreference.length; i++) {
                if(img['category'].toLowerCase().indexOf('banner') != -1 && imageSelectionLogic(img) == coverImageSelectionPreference[i])
                    return true;
            }

            return false;
        };
        var acceptableResImages = _(programImages).filter(function (pi) {
            return coverImageSelectionPreference.indexOf(imageSelectionLogic(pi)) != -1;
        });

        var coverImage = null

        coverImage = _(getAcceptableEpisodeImages(acceptableResImages)).find(coverImagePreferenceFunction);
        if (!coverImage) {
            coverImage = _(getAcceptableSeasonImages(acceptableResImages)).find(coverImagePreferenceFunction);
        }
        if (!coverImage) {
            coverImage = _(getAcceptableSeriesImages(acceptableResImages)).find(coverImagePreferenceFunction);
        }

        return coverImage;
    };


    var getShowCoverImage = function (programImages) {
        if (!programImages || !programImages.length) {
            return null;
        }
        var acceptableResImages = _(programImages).filter(function (pi) {
            return coverImageShowImageSelectionPreference['2x3'].indexOf(imageSelectionLogic(pi)) != -1;
        });


        var res2x3Selector = function (imageList) {
            if(!imageList || !imageList.length) {
                return null;
            }
            var  programImageList = getAcceptableProgramCategory(imageList,"banner");
            return programImageList;
        };
        var res3x4Selector = function (imageList) {
            if(!imageList || !imageList.length) {
                return null;
            }
            var  programImageList = getAcceptableProgramCategory(imageList,"banner");
            return programImageList;
        };
        //Look for banner in 2X3 episode,season,series images
        var coverImage = res2x3Selector(getAcceptableEpisodeImages(acceptableResImages));
        if (!coverImage) {
            coverImage = res2x3Selector(getAcceptableSeasonImages(acceptableResImages));
        }
        if (!coverImage) {
            coverImage = res2x3Selector(getAcceptableSeriesImages(acceptableResImages));
        }
        // Repeat the above for 3x4 images
        if (!coverImage) {
            acceptableResImages = _(programImages).filter(function (pi) {
                return coverImageShowImageSelectionPreference['3x4'].indexOf(imageSelectionLogic(pi)) != -1;
            });
            coverImage = res3x4Selector(getAcceptableEpisodeImages(acceptableResImages));
        }
        if (!coverImage) {
            coverImage = res3x4Selector(getAcceptableSeasonImages(acceptableResImages));
        }
        if (!coverImage) {
            coverImage = res3x4Selector(getAcceptableSeriesImages(acceptableResImages));
        }
        return coverImage;
    };

    var getMovieCoverImage = function (programImages) {
        if (!programImages || !programImages.length) {
            return null;
        }
        var acceptableResImages = _(programImages).filter(function (pi) {
            return verticalMovieImageSelectionPreference['2x3'].indexOf(imageSelectionLogic(pi)) != -1;
        });


        var res2x3Selector = function (imageList) {
            if(!imageList || !imageList.length) {
                return null;
            }
            var  programImageList = getAcceptableProgramCategory(imageList,"poster art");
            if (!programImageList) {
                programImageList = getAcceptableProgramCategory(imageList,"box art");
            }
            return programImageList;
        };

        var coverImage = res2x3Selector(acceptableResImages);

        return coverImage;
    };


    var getShowSceneImage = function (programImages) {
        if (!programImages || !programImages.length) {
            return null;
        }
        var acceptableResImages = _(programImages).filter(function (pi) {
            return sceneImageSelectionPreference['16x9'].indexOf(imageSelectionLogic(pi)) != -1;
        });
        var res16x9Selector = function (imageList) {
            if(!imageList || !imageList.length) {
                return null;
            }
            var  programImageList = getAcceptableProgramCategory(imageList,"banner");

            if (!programImageList) {
                programImageList = getAcceptableProgramCategory(imageList,"episodic");
            }
            if (!programImageList) {
                programImageList = getAcceptableProgramCategory(imageList,"iconic");
            }
            if (!programImageList) {
                programImageList = getAcceptableProgramCategory(imageList,"cast ensemble");
            }

            return programImageList;
        };
        var res4x3Selector = function (imageList) {
            if(!imageList || !imageList.length) {
                return null;
            }
            var  programImageList = getAcceptableProgramCategory(imageList,"banner");

            if (!programImageList) {
                programImageList = getAcceptableProgramCategory(imageList,"logo");
            }
            if (!programImageList) {
                programImageList = getAcceptableProgramCategory(imageList,"episodic");
            }
            if (!programImageList) {
                programImageList = getAcceptableProgramCategory(imageList,"iconic");
            }
            if (!programImageList) {
                programImageList = getAcceptableProgramCategory(imageList,"cast ensemble");
            }

            return programImageList;
        };

        //Look for banner, followed by episodic, followed by iconic, followed by ensemble images in 16X9 episode images
        var sceneImage = res16x9Selector(getAcceptableEpisodeImages(acceptableResImages));
        if (!sceneImage) {
            sceneImage = res16x9Selector(getAcceptableSeasonImages(acceptableResImages));
        }
        if (!sceneImage) {
            sceneImage = res16x9Selector(getAcceptableSeriesImages(acceptableResImages));
        }
        // Repeat the above for 4x3 images
        if (!sceneImage) {
            acceptableResImages = _(programImages).filter(function (pi) {
                return sceneImageSelectionPreference['4x3'].indexOf(imageSelectionLogic(pi)) != -1;
            });
            sceneImage = res4x3Selector(getAcceptableEpisodeImages(acceptableResImages));
        }
        if (!sceneImage) {
            sceneImage = res4x3Selector(getAcceptableSeasonImages(acceptableResImages));
        }
        if (!sceneImage) {
            sceneImage = res4x3Selector(getAcceptableSeriesImages(acceptableResImages));
        }
        return sceneImage;
    };


    var getMovieSceneImage = function (programImages) {
        if (!programImages || !programImages.length) {
            return null;
        }
        var acceptableResImages = _(programImages).filter(function (pi) {
            return horizontalMovieImageSelectionPreference['16x9'].indexOf(imageSelectionLogic(pi)) != -1;
        });
        var res16x9Selector = function (imageList) {
            if(!imageList || !imageList.length) {
                return null;
            }
            var  programImageList = getAcceptableProgramCategory(imageList,"iconic");
            return programImageList;
        };

        var res3x2Selector = function (imageList) {
            if(!imageList || !imageList.length) {
                return null;
            }
            var  programImageList = getAcceptableProgramCategory(imageList,"scene still");
            return programImageList;
        };
        var sceneImage = res16x9Selector(acceptableResImages);
        if (!sceneImage) {
            acceptableResImages = _(programImages).filter(function (pi) {
                return horizontalMovieImageSelectionPreference['3x2'].indexOf(imageSelectionLogic(pi)) != -1;
            });
            sceneImage = res3x2Selector(acceptableResImages);
        }
        return sceneImage;
    };





    var getShowDetailsImage = function (programImages) {
        if (!programImages || !programImages.length) {
            return null;
        }
        var acceptableResImages = _(programImages).filter(function (pi) {
            return detailImageSelectionPreference['2x3'].indexOf(imageSelectionLogic(pi)) != -1;
        });


        var res2x3Selector = function (imageList) {
            if(!imageList || !imageList.length) {
                return null;
            }
            var  programImageList = getAcceptableProgramCategory(imageList,"banner");

            if (!programImageList) {
                programImageList = getAcceptableProgramCategory(imageList,"iconic");
            }
            return programImageList;
        };
        var res3x4Selector = function (imageList) {
            if(!imageList || !imageList.length) {
                return null;
            }

            var  programImageList = getAcceptableProgramCategory(imageList,"banner");
            if (!programImageList) {
                programImageList = getAcceptableProgramCategory(imageList,"iconic");
            }
            if (!programImageList) {
                programImageList = getAcceptableProgramCategory(imageList,"cast in character");
            }

            return programImageList;
        };
        //Look for banner, followed by iconic images in 2X3 episode images
        var detailsImage = res2x3Selector(getAcceptableEpisodeImages(acceptableResImages));
        if (!detailsImage) {
            detailsImage = res2x3Selector(getAcceptableSeasonImages(acceptableResImages));
        }
        if (!detailsImage) {
            detailsImage = res2x3Selector(getAcceptableSeriesImages(acceptableResImages));
        }
        // Repeat the above for 3x4 images
        if (!detailsImage) {
            acceptableResImages = _(programImages).filter(function (pi) {
                return detailImageSelectionPreference['3x4'].indexOf(imageSelectionLogic(pi)) != -1;
            });
            detailsImage = res3x4Selector(getAcceptableEpisodeImages(acceptableResImages));
        }
        if (!detailsImage) {
            detailsImage = res3x4Selector(getAcceptableSeasonImages(acceptableResImages));
        }
        if (!detailsImage) {
            detailsImage = res3x4Selector(getAcceptableSeriesImages(acceptableResImages));
        }
        return detailsImage;
    };




    saxStream.on("opentag", function (node) {

        if (node.name === 'on'){
            // Write header
           // fileAppender(outputDirectoryPrefix, 'programs.txt', printHeader(programRecordTemplate) + os.EOL);
            fileAppender(outputDirectoryPrefix, 'programs.txt', printer.printHeader(programRecordTemplate) + os.EOL);
            fileAppender(outputDirectoryPrefix, 'programs-cast.txt',printHeader(programCastTemplate) + os.EOL);
        }

        if (node.name === 'program') {
            var title = node.attributes['TMSId'];
            programRecord['TMSId'] = title;
            programCast['TMSId'] =title;
            console.log("title" + title);
            if (title.indexOf("MV") === 0)
            {
                isMovie = true;
            }
            programRecord['connectorId'] = node.attributes['connectorId'];
            programRecord['rootId'] = node.attributes['rootId'];
            programRecord['seasonId'] = node.attributes['seasonId'];
            programRecord['seriesId'] = node.attributes['seriesId'];
            tmsId = node.attributes['TMSId'];
            seriesId = node.attributes['seriesId'];
            hasTitleBeenPushed = false;
            hasDescBeenPushed = true;
            programCount++;
            verticalImages = [];
            horizontalImages = [];
        }
        if (node.name === 'episodeInfo') {
            programRecord['seasonNum'] = node.attributes['season'];
            programRecord['episodeNum'] = node.attributes['number'];
            isEpisode = true;
       }
      if (node.name === 'desc' && node.attributes['size'] === '100') {
            hasDescBeenPushed = false;
        }
        if (node.name === 'rating' && ( !hasMovieRatingBeenPushed || !hasTVRatingBeenPushed) ) {

                if (node.attributes['ratingsBody'] === properties.rp("TV_RatingsBody"))
             {
                 programRecord['tv_rating'] = node.attributes['code'];
                 hasTVRatingBeenPushed = true;
             }
             if (node.attributes['ratingsBody'] === properties.rp("Movie_RatingsBody"))
             {
                 programRecord['movie_rating'] = node.attributes['code'];
                 hasMovieRatingBeenPushed = true;
             }
     }
        if (node.name === 'cast') {
            isCast = true;
        }
        if (isCast && node.name === 'member') {
            programCast['personId'] = node.attributes['personId'];
            programCast['ord'] = node.attributes['ord'];
        }
        if (isCast && node.name === 'name') {
            programCast['nameId'] = node.attributes['nameId'];
        }




        if (node.name === 'asset' && node.attributes['type'].indexOf('image') != -1 && node.attributes['action'] !== 'delete' && node.attributes['primary'] ==='true' ) {
            imageRecord = new getProgramImage(tmsId, node.attributes['width'], node.attributes['height'], node.attributes['type'].replace(/image\//g, ''), null, node.attributes['tier'], node.attributes['category']);
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
            finalProgramRecord.push(programRecord['tv_rating']);
            finalProgramRecord.push(programRecord['movie_rating']);
            finalProgramRecord.push(programRecord['genre']);
            finalProgramRecord.push(programRecord['title']);
            finalProgramRecord.push(programRecord['desc']);
            finalProgramRecord.push(programRecord['progType']);
            finalProgramRecord.push(programRecord['synNum']);
            finalProgramRecord.push(programRecord['origAirDate']);
            finalProgramRecord.push(programRecord['seasonNum']);
            finalProgramRecord.push(programRecord['episodeNum']);
            finalProgramRecord.push(programRecord['episodeTitle']);



            fileAppender(outputDirectoryPrefix, 'programs.txt', finalProgramRecord.join(fieldSeparator) + fieldSeparator+ os.EOL);
         //   fileAppender(outputDirectoryPrefix, 'programs.txt', printer.print(finalProgramRecord) + os.EOL);

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

        if (node === 'ratings') {
            hasMovieRatingBeenPushed = false;
            hasTVRatingBeenPushed = false;
        }
        if (isCast && node === 'member') {
            fileAppender(outputDirectoryPrefix, 'programs-cast.txt', _.values(programCast).join(fieldSeparator) + os.EOL);

           // programCast = {"TMSId": tmsId};
            _.extend(programCast, programCastTemplate);
            programCast['TMSId']=tmsId;
        }
        if (node === 'assets') {
            if (!_.isEmpty(programImages)) {
                var coverImage = null;
                if (isMovie)
                    coverImage =  getMovieCoverImage(programImages);
                else
                    coverImage = getShowCoverImage(programImages);
                if (coverImage) {
                    var cImage = "|V|BROWSE|"
                    fileAppender(outputDirectoryPrefix, 'programs-image.txt', _.values(coverImage).join(fieldSeparator) + cImage +os.EOL);
                }
                var sceneImage = null;
                if(isMovie)
                    sceneImage = getMovieSceneImage(programImages);
                else
                    sceneImage = getShowSceneImage(programImages);
                if (sceneImage) {
                    var sImage = "|H|S_DESC|"
                    fileAppender(outputDirectoryPrefix, 'programs-image.txt', _.values(sceneImage).join(fieldSeparator)+ sImage+ os.EOL);
                }
                var detailsImage = null;
                if (isMovie)
                // for movies, cover and details are identical
                    detailsImage = coverImage;
                else
                    detailsImage = getShowDetailsImage(programImages);
                if (detailsImage) {
                    var dImage = "|V|DETAILS|"
                    fileAppender(outputDirectoryPrefix, 'programs-image.txt', _.values(detailsImage).join(fieldSeparator) + dImage + os.EOL);
                }
            }
            programImages = [];
            isMovie = false;
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
        } else if (this._parser.tagName === 'title' && isEpisode) {
            programRecord['episodeTitle'] = this._parser.textNode;
        }


        else if (validRecordTags.indexOf(currentTag) != -1) {
            programRecord[currentTag] = text;
        }
        if (isCast && validCastTags.indexOf(currentTag) != -1) {
            programCast[currentTag] = text;
            if (currentTag === "last") {
                programCast['name'] = programCast['first'] + " " + text;
            }
        }
        if (validImageTags.indexOf(this._parser.tagName) != -1) {
            if (!imageRecord) {
                return;
            }
            imageRecord['url'] = 'http://demo.tmsimg.com/' + text;
            programImages.push(imageRecord);
            imageRecord = null;
        }
    });
    return saxStream;
};

module.exports = programsParser;