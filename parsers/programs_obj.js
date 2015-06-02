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
    var programImages = [];
    var coverImageSelectionPreference = ["120x180", "240x360", "480x720", "960x1440", "135x180", "270x360", "540x720", "1080x1440"];
    var sceneImageSelectionPreference = {
        "16x9": ["240x135", "480x270", "960x540", "1280x720", "1920x1080"],
        "4x3": ["180x135", "360x270", "720x540", "1440x1080"],
        "all": ["240x135", "480x270", "960x540", "1280x720", "1920x1080", "180x135", "360x270", "720x540", "1440x1080"]
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
            'category': category,
            'orientation': orientation
        }
    };
    var imageSelectionLogic = function (image) {
        return image['width'] + 'x' + image['height'];
    };
    var getAcceptableEpisodeImages = function (imageList) {
        return _(imageList).filter(function (pi) {
            return pi['tier'].toLowerCase() == 'episode';
        });
    };
    var getAcceptableSeasonImages = function (imageList) {
        return _(imageList).filter(function (pi) {
            return pi['tier'].toLowerCase() == 'season';
        });
    };
    var getAcceptableSeriesImages = function (imageList) {
        return _(imageList).filter(function (pi) {
            return pi['tier'].toLowerCase() == 'series';
        });
    };
    var getCoverImage = function (programImages) {
        if (!programImages || !programImages.length) {
            return null;
        }
        var coverImagePreferenceFunction = function (img) {
            for (var i = 0; i < coverImageSelectionPreference.length; i++) {
                if (img['category'].toLowerCase().indexOf('banner') != -1 && imageSelectionLogic(img) == coverImageSelectionPreference[i]) {
                    return true;
                }
            }
            return false;
        };
        var acceptableResImages = _(programImages).filter(function (pi) {
            return coverImageSelectionPreference.indexOf(imageSelectionLogic(pi)) != -1;
        });
        var coverImage = _(getAcceptableEpisodeImages(acceptableResImages)).find(coverImagePreferenceFunction);
        if (!coverImage) {
            coverImage = _(getAcceptableSeasonImages(acceptableResImages)).find(coverImagePreferenceFunction);
        }
        if (!coverImage) {
            coverImage = _(getAcceptableSeriesImages(acceptableResImages)).find(coverImagePreferenceFunction);
        }
        return coverImage;
    };

    var getSceneImage = function (programImages) {
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
            for (var ai in imageList) {
                if (imageList[ai]['category'].toLowerCase().indexOf('banner') != -1) {
                    return imageList[ai];
                }
                if (imageList[ai]['category'].toLowerCase().indexOf('episodic') != -1) {
                    return imageList[ai];
                }
                if (imageList[ai]['category'].toLowerCase().indexOf('iconic') != -1) {
                    return imageList[ai];
                }
                if (imageList[ai]['category'].toLowerCase().indexOf('cast ensemble') != -1) {
                    return imageList[ai];
                }
            }
            return null;
        };
        var res4x3Selector = function (imageList) {
            if(!imageList || !imageList.length) {
                return null;
            }
            for (var ai in imageList) {
                if (imageList[ai]['category'].toLowerCase().indexOf('banner') != -1) {
                    return imageList[ai];
                }
                if (imageList[ai]['category'].toLowerCase().indexOf('logo') != -1) {
                    return imageList[ai];
                }
                if (imageList[ai]['category'].toLowerCase().indexOf('episodic') != -1) {
                    return imageList[ai];
                }
                if (imageList[ai]['category'].toLowerCase().indexOf('iconic') != -1) {
                    return imageList[ai];
                }
                if (imageList[ai]['category'].toLowerCase().indexOf('cast ensemble') != -1) {
                    return imageList[ai];
                }
            }
            return null;
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

    var getDetailsImage = function (programImages) {
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
            for (var ai in imageList) {
                if (imageList[ai]['category'].toLowerCase().indexOf('banner') != -1) {
                    return imageList[ai];
                }
                if (imageList[ai]['category'].toLowerCase().indexOf('iconic') != -1) {
                    return imageList[ai];
                }
            }
            return null;
        };
        var res3x4Selector = function (imageList) {
            if(!imageList || !imageList.length) {
                return null;
            }
            for (var ai in imageList) {
                if (imageList[ai]['category'].toLowerCase().indexOf('banner') != -1) {
                    return imageList[ai];
                }
                if (imageList[ai]['category'].toLowerCase().indexOf('iconic') != -1) {
                    return imageList[ai];
                }
                if (imageList[ai]['category'].toLowerCase().indexOf('cast in character') != -1) {
                    return imageList[ai];
                }
            }
            return null;
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
            imageRecord = new getProgramImage(tmsId, node.attributes['width'], node.attributes['height'], node.attributes['type'].replace(/image\//g, ''), null, node.attributes['tier'], node.attributes['category'], null);
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
            if (!_.isEmpty(programImages)) {
                var coverImage = getCoverImage(programImages);
                if (coverImage) {
                    fileAppender(outputDirectoryPrefix, 'programs-image.txt', _.values(coverImage).join(fieldSeparator) + os.EOL);
                }
                var sceneImage = getSceneImage(programImages);
                if (sceneImage) {
                    fileAppender(outputDirectoryPrefix, 'programs-image.txt', _.values(sceneImage).join(fieldSeparator) + os.EOL);
                }
                var detailsImage = getDetailsImage(programImages);
                if (detailsImage) {
                    fileAppender(outputDirectoryPrefix, 'programs-image.txt', _.values(detailsImage).join(fieldSeparator) + os.EOL);
                }
            }
            programImages = [];
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