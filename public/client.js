$(document).ready(function () {
    let socket = io();

    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });

    socket.on('connection established', function(){
        if(document.cookie){
            socket.emit('existing user', document.cookie);
        }else{
            socket.emit('new user');
        }
    });

    socket.on('name update', function(name){
        $('#banner').text("You are " + name);
    });

    socket.on('cookie update', function(value){
        document.cookie = value;
    });

    socket.on('users update',function(users){
        $('#users').empty();
        console.log(users);
        for(let i = 0; i < users.length; i++){
            $('#users').append($('<li>').text(users[i].name));
        }
    });

    socket.on('chat log', function(messages){
        for (let i = 0; i < messages.length; i++){
            appendMessage(messages[i], false, true);
        }
    });

    socket.on('chat message', function(time, name, message, color){
        msg = {time: time, name: name, message: message, color: color};
        appendMessage(msg, false, false);
    });

    socket.on('chat message self', function(time, name, message, color){
        msg = {time: time, name: name, message: message, color: color};
        appendMessage(msg, true, false);
    });

    socket.on('name taken', function(name){
        appendInfo(name + ' is taken, please choose another name.')
    });

    socket.on('name change success', function (name){
        appendInfo('You are now ' + name);
    });

    socket.on('nick info', function (){
        appendInfo("Usage: /nick <new nickname>");
    });

    socket.on('color set success', function (color){
        appendInfo('Your nickname color has changed to #' + color);
    });

    socket.on('color set fail', function (color){
        appendInfo('#' + color + ' is not a valid RRGGBB color!');
    });

    socket.on('nickcolor info', function () {
        appendInfo("Usage: /nickcolor RRGGBB");
    });
});

function appendInfo(message){
    $('#messages').append($('<li>').text(message));
    scrollScreen(false);
}

function appendMessage(message, self, fast){
    if(self === true){
        $('#messages').append($('<li>').html('<p>' + message.time + ' <b><span style="color:#' + message.color + '">'
            + message.name + ': </span>' + message.message + '</b></p>'));
    }else{
        $('#messages').append($('<li>').html('<p>' + message.time + ' <span style="color:#' + message.color + '">'
            + message.name + ': </span>' + message.message + '</p>'));
    }

    scrollScreen(fast);
}

function scrollScreen(fast){
    if(fast === true){
        $('#message-list').scrollTop($("#message-list").prop("scrollHeight"));
    }else{
        $('#message-list').animate({scrollTop: $('#message-list').prop("scrollHeight")}, 450);
    }
}