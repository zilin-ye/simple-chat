const express = require('express'), http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io').listen(server);
const { uniqueNamesGenerator, adjectives, animals} = require('unique-names-generator');
const defaultColor = '000000';

let users = [];
let messages = [];

app.use(express.static('public'));
app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(socket){
    socket.emit('connection established');
    console.log('A client connected');

    socket.on('new user', function(){
        socket.name = getRandomName();
        users.push({name: socket.name, color: defaultColor, connections: 1});
        socket.emit('name update', socket.name);
        socket.emit('cookie update', socket.name);
        io.emit('users update', users);
        socket.emit('chat log', messages);
        socket.emit('name change success', socket.name);
    });

    socket.on('existing user', function(name){
        socket.name = sanitize(name);
        let idx = findUserIndex(socket.name);
        if(doNameExist(socket.name) === true){
            users[idx].connections += 1;
        }else{
            users.push({name: socket.name, color: defaultColor, connections: 1});
        }
        socket.emit('name update', socket.name);
        io.emit('users update', users);
        socket.emit('chat log', messages);
        socket.emit('name change success', socket.name);
    });

    socket.on('disconnect', function(){
        console.log('Client ' + socket.name + ' disconnected.');
        let idx = findUserIndex(socket.name);
        if(users[idx].connections > 1){
            users[idx].connections -= 1;
        }else if(users[idx].connections === 1){
            users.splice(idx, 1);
        }
        io.emit('users update', users);
    });

    socket.on('chat message', function(msg){
        let time = getTime();
        console.log(time + " " + socket.name + ": " + msg);
        if(msg.length > 0){
            if(msg.startsWith('/nickcolor')){
                let hexColor = "";
                if(msg.charAt(10) === " "){
                    hexColor = sanitize(msg.slice(11))
                }
                if(hexColor.length > 0){
                    if(isHexValid(hexColor) === true){
                        let idx = findUserIndex(socket.name);
                        users[idx].color = hexColor;
                        io.emit('users update', users);
                        socket.emit('color set success', hexColor);
                    }else{
                        socket.emit('color set fail', hexColor);
                    }
                }else{
                    socket.emit('nickcolor info');
                }
            }else if(msg.startsWith('/nick')){
                let oldName = socket.name;
                let newName = "";
                if(msg.charAt(5) === " "){
                    newName = sanitize(msg.slice(6))
                }
                if (newName.length > 0){
                    if(doNameExist(newName) === true){
                        socket.emit('name taken', newName);
                    }else{
                        let idx = findUserIndex(oldName);
                        users[idx].name = newName;
                        socket.name = newName;
                        io.emit('users update', users);
                        socket.emit('name update', newName);
                        socket.emit('cookie update', newName);
                        socket.emit('name change success', newName);
                    }
                }else{
                    socket.emit('nick info');
                }
            }else{
                let idx = findUserIndex(socket.name);
                let sanitized_msg = sanitize(msg);
                messages.push({time: time, name: socket.name, message: sanitized_msg, color: users[idx].color});
                socket.broadcast.emit('chat message', time, socket.name, sanitized_msg, users[idx].color);
                socket.emit('chat message self', time, socket.name, sanitized_msg, users[idx].color);
            }
        }
    });
});

server.listen(3000, function(){
    console.log('listening on *:3000');
});

/** https://stackoverflow.com/questions/2794137/sanitizing-user-input-before-adding-it-to-the-dom-in-javascript **/
function sanitize(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, (match)=>(map[match]));
}

function isHexValid(hex){
    return typeof hex === 'string' && hex.length === 6 && !isNaN(Number('0x' + hex));
}

function doNameExist(name){
    if(findUserIndex(name) === -1){
        return false;
    }else{
        return true;
    }
}

function findUserIndex(name){
    for(let i = 0; i < users.length; i++){
        if(users[i].name === name){
            return i;
        }
    }
    return -1;
}

function getRandomName(){
    let randomName = uniqueNamesGenerator({ dictionaries: [adjectives, animals], length: 2 });

    while(doNameExist(randomName) === true){
        randomName = uniqueNamesGenerator({ dictionaries: [adjectives, animals], length: 2 });
    }

    console.log('A random name is given: ' + randomName);

    return randomName;
}

function getTime(){
    let date = new Date();
    let hour = date.getHours();
    let min = date.getMinutes();
    if(min < 10){
        min = '0' + min;
    }
    let formattedTime = hour + ":" + min;

    return formattedTime;
}