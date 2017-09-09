function loginAttempt() {
    $.post("server/user/login", { email: $('#email-input').val(), password: $('#password-input').val() }, function(result) {
        if (result === true) {
            window.location.replace("index.html");
        }
        else {
            alert("Wrong credentials");
        }
    });
}

$(document).on('userLoad', function() {
    if (currentSession) {
        window.location.replace("index.html");
    }
});

$(document).ready(function() {
    $('#login-button').click(loginAttempt);

    $("#password-input, #email-input").keypress(function(e) {
        if(e.which == 13) {
            loginAttempt();
        }
    });

    $('#registration-button').click(function() {
        $.post("server/user/create", { email: $('#email-registration-input').val(),
                                      password: $('#password-registration-input').val() ,
                                      birthdate: $('#birthdate-registration-input').val()   ,
                                      currentWeight: $('#current-weight-registration-input').val(),
                                      currentFatPercentage: $('#current-fat-percentage-registration-input').val()
                                    }, function(result) {
            if (result === true) {
                window.location.replace("index.html");
            }
            else {
                debugger;
                alert("Unable to register");
            }
        });
    });
});
