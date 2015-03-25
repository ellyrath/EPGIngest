(function ($) {
    var validation_btn_stop = $('button#validation_stop');
    var validation_btn_re = $('button#validation_re');
    var download_bar = $('#download_bar');
    var unzip_bar = $('#unzip_bar');
    var validation_bar = $('#validation_bar');
    var parse_bar = $('#parse_bar');
    var panelDownload = $('#downloadPnl');
    var panelUnzip = $('#unzipPnl');
    var panelValidate = $('#validatePnl');
    var panelParse = $('#parsePnl');
    var simulateError = false;

    function switchChange(event, state) {
        simulateError = state;
    }

    var socket = io('http://localhost:3000');
    socket.on('parsing start', function (data) {
        //alert("Parsing started");
        validation_bar.toggleClass('progress-bar-warning progress-bar-striped active progress-bar-success');
        panelValidate.toggleClass('panel-default panel-success');
        // Start parsing
        parse_bar.css('width', '100%');
        parse_bar.toggleClass('progress-bar-warning progress-bar-striped active');
    });
    socket.on('parsing end', function (data) {
        parseXmlComplete();
    });

    $("[name='simError']").bootstrapSwitch({'onSwitchChange': switchChange, 'onColor': 'danger'});

    function stop_progress() {
        //alert('stop clicked');
        //validation_btn_re.toggleClass('disabled');
        //validation_btn_stop.toggleClass('disabled');
        //validation_bar.toggleClass('progress-bar-warning progress-bar-striped active progress-bar-danger');
        simulateError = true;
    }

    function start_progress() {
        //alert('stop clicked');
        validation_btn_re.toggleClass('disabled');
        validation_btn_stop.toggleClass('disabled');
        validation_bar.toggleClass('progress-bar-warning progress-bar-striped active progress-bar-danger');
    }

    function downloadFilesComplete() {
        download_bar.toggleClass('progress-bar-warning progress-bar-striped active progress-bar-success');
        panelDownload.toggleClass('panel-default panel-success');
        // Start unzipping
        unzip_bar.css('width', '100%');
        unzip_bar.toggleClass('progress-bar-warning progress-bar-striped active');
        setTimeout(unzipComplete, 3000);
    }

    function unzipComplete() {
        unzip_bar.toggleClass('progress-bar-warning progress-bar-striped active progress-bar-success');
        panelUnzip.toggleClass('panel-default panel-success');
        // Start validation
        validation_bar.css('width', '100%');
        validation_bar.toggleClass('progress-bar-warning progress-bar-striped active');
        setTimeout(validateXmlComplete, 5000);
    }

    function validateXmlComplete() {
        if (!simulateError) {
            //validation_bar.toggleClass('progress-bar-warning progress-bar-striped active progress-bar-success');
            //panelValidate.toggleClass('panel-default panel-success');
            //// Start parsing
            //parse_bar.css('width', '100%');
            //parse_bar.toggleClass('progress-bar-warning progress-bar-striped active');
            //setTimeout(parseXmlComplete, 10000);
            $.ajax({
                'url': '/programs'
            });
        } else {
            validation_bar.toggleClass('progress-bar-warning progress-bar-striped active progress-bar-danger');
            panelValidate.toggleClass('panel-default panel-danger');
        }
    }

    function parseXmlComplete() {
        parse_bar.toggleClass('progress-bar-warning progress-bar-striped active progress-bar-success');
        panelParse.toggleClass('panel-default panel-success');
    }

    validation_btn_stop.click(stop_progress);
    validation_btn_re.click(start_progress);
    setTimeout(downloadFilesComplete, 5000);
})($);