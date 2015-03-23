(function($){
    var validation_btn_stop = $('button#validation_stop');
    var validation_btn_re = $('button#validation_re');
    var validation_bar = $('#validation_bar');

    function stop_progress(){
        //alert('stop clicked');
        validation_btn_re.toggleClass('disabled');
        validation_btn_stop.toggleClass('disabled');
        validation_bar.toggleClass('progress-bar-warning progress-bar-striped active progress-bar-danger');
    }

    function start_progress() {
        //alert('stop clicked');
        validation_btn_re.toggleClass('disabled');
        validation_btn_stop.toggleClass('disabled');
        validation_bar.toggleClass('progress-bar-warning progress-bar-striped active progress-bar-danger');
    }
    validation_btn_stop.click(stop_progress);
    validation_btn_re.click(start_progress);
})($);