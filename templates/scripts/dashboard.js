


$(document).ready(() => {
    $('.user').hide()
    $.post('/api/v1.0/me', (data) => {
        console.log(data);
        $('.user').hide()
        if (data.discordLinked)
        {
            var avatar = `https://cdn.discordapp.com/avatars/${data["id"]}/${data["avatar"]}.png?size=2048`
            $('#avatarImg').attr('src', avatar).fadeIn();
            $('.discordName').text(data["username"]);
            $('.discordTag').text("#" + data["discriminator"]);
            $("#linkDiscord").attr('href', 'javascript: void(0)');

        }
        $('.user').fadeIn()
    })
    $.get('/api/v1.0/messages', (data) => {
        if (Array.isArray(data))
        {
            const $gridRef = $('#messages');
            $gridRef.attr('data', JSON.stringify(data));
        }
        else {
            console.log("No messages found");
        }
    });

    $('#unlinkDiscord').click(() => {
        $.get('/unlink_discord', (data) => {
            if (data['message'])
            {
                toastr.info(data.message, 'Engraved')
                return
            }
            else {
                if (!data.error)
                {
                    toastr.options.onShown = function() {  window.location.reload();}
                    toastr.success("Successfully unlinked Discord!", 'Engraved')
                    return
                }
                else {
                    toastr.options.onShown = function() {  window.location.reload();}
                    toastr.warning("Failed to unlink Discord!", 'Engraved')
                    return
                }
            }
        });
    });
});