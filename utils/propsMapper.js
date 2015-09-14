


var mapper = function mapper(scheduleRecord, str) {
    if (!str) {
        return;
    }
    var items = str.split('|');
    //template = {
    //    'cc':'',
    //    'stereo':'',
    //    'new':'',
    //    'hdtv':''
    //},
    //result = [];
    items.map(function (item) {
        var lower = item.toLowerCase();
        switch (lower) {
            case 'cc':
                scheduleRecord['CC'] = 'CC';
                break;
            case 'stereo':
                scheduleRecord['STEREO'] = 'Stereo';
                break;
            case 'new':
                scheduleRecord["NEW"] = 'N';
                break;
            case 'hdtv':
                scheduleRecord['HDTV'] = lower;
                break;
            case 'sex':
                scheduleRecord['Sex_rating'] = 'Y';
                break;
            case 'violence':
                scheduleRecord['Violence_rating'] = 'Y';
                break;
            case 'language':
                scheduleRecord['Language_rating'] = 'Y';
                break;
            case 'dialog':
                scheduleRecord['Dialog_rating'] = 'Y';
                break;
            case 'fantasyviolence':
                scheduleRecord['Fantasy_rating'] = 'Y';
                break;


        }

    });

}

var propsMapper = {
    map : mapper
};
module.exports = propsMapper;
