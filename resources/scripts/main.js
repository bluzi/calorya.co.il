var currentSession = false;

String.prototype.format = function () {
        var args = [].slice.call(arguments);
        return this.replace(/(\{\d+\})/g, function (a){
            return args[+(a.substr(1,a.length-2))||0];
        });
};

function showNotification(selector, type, text) {
    var alert = $("<div class='alert alert-" + type + "'><a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a>" + text + "</div></div>");
    $(selector).append(alert);

    setTimeout(function() {
        $(alert).fadeOut(500);
    }, 3000);
}

$(document).ready(function() {
    $('.datePicker').datepicker();
    $('.datePicker').datepicker("option", "dateFormat", "yy-mm-dd");

    $.get("server/user/current", function(result) {
        if (result) {
            $(".hide-after-login").hide();

            $('#logout-button').click(function() {
                $.post("server/user/logout", function() {
                    window.location.replace("index.html");
                })
                .fail(function(a,b,c) {
                    debugger;
                });
            });
        }
        else {
            $(".hide-before-login").hide();
        }

        currentSession = result;
        $(document).trigger('userLoad');
        $('body').show();
    });
});
