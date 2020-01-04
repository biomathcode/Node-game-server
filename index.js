const io = require('socket.io')(process.env.PORT || 52300)

//Custom Classes

const Player = require('./Classes/Player.js');

const players = [];
const sockets = [];

console.log('Server has started');

 
io.on('connection',function(socket) {
    console.log("Connection Made!")

    const player = new Player()
    const thisPlayerID = player.id;

    players[thisPlayerID] = player;
    sockets[thisPlayerID] = socket;


    //Tell the client that this is our id for the server
    socket.emit('register', {
        id: thisPlayerID
    })
    socket.emit('spawn', player); //Tell myself that i have spawned
    socket.broadcast.emit('spawn', player) //Tell other I have spawned

    //Tell myself About everyone else in thee game
    for(let playerID in players){
        if(playerID != thisPlayerID) {
            socket.emit('spawn', players[playerID]);
        }
    }
    //data from the position 
    socket.on('updatePosition', function(data) {
        players.position.x = data.position.x;
        players.position.y = data.position.y;

        socket.broadcast.emit('updatePosition', player);

    })

    socket.on('disconnect', function() {
        console.log("player has disconnected")
        delete players[thisPlayerID];
        delete sockets[thisPlayerID];
        socket.broadcast.emit('disconnected', player);
    })

}) 

