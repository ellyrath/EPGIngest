/**
 * Created by erath on 9/3/2015.
 */
var fieldSeparator = "|";
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

var recPrinter = {
    print: print,
    printHeader :printHeader
};
module.exports = recPrinter;
