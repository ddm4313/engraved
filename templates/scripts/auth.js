$(document).ready(() => {
    $('button[name="RegisterSubmit"]').click(() => {
        var username = $('input[name="usernameReg"]').val().toLowerCase();
        var password = $('input[name="passwordReg"]').val();
        $.post("/api/v1.0/register", {email: username, password: password}).done((data) => {
            if (data.registered)
            {
                toastr.options.onShown = function() {                 window.location.replace("/login");}
                toastr.success('Registration successful', 'Engraved')
            }
            else {
                toastr.error('Username already exists', 'Engraved')
            }
        }).fail(() => {
            toastr.error("Username already exists", "Engraved")
        });
    })

    $('button[name="LoginSubmit"]').click(() => {
        var username = $('input[name="username"]').val().toLowerCase();
        var password = $('input[name="password"]').val();
    
        $.post("/api/v1/login", {email: username, password: password}).done((data) => {
            if (data.loggedIn)
            {
                toastr.options.onShown = function() {                 window.location.replace("/dashboard");}
                toastr.success(data.message, 'Engraved')
            }
            else {
                toastr.error(data.message, 'Engraved')
            }
        }).fail(() => {
            toastr.error("Invalid username or password", "Engraved")
        });
    });
    $('#linkDiscord').click(() => {
    })

});