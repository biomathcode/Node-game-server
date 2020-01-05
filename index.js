const io = require('socket.io')(process.env.PORT || 52300)

//Custom Classes

const Player = require('./Classes/Player.js');
const Bullet = require('./Classes/Bullet.js')

let players = [];
let sockets = [];
let bullets = [];


console.log('Server has started');
console.log('Dekh le bhaiya')



//updates 
//this will call the onUpdate function
//in the bullet and update the position of the bullet 
//for 100milliseconds
setInterval(() => {
    bullets.forEach(bullet => {
        const isDestroyed = bullet.onUpdate()

        if(isDestroyed) {
            const index = bullets.indexOf(bullet);
            if(index > -1) {
                bullet.splice(index, 1);

                const returnData = {
                    id : bullet.id
                }

                for(let playerID in players) {
                    sockets[playerID].emit('serverUnspawn', returnData)
                }

            }
        } else {
            const returnDate = {
                id: bullet.id,
                position: {
                    x : bullet.position.x,
                    y : bullet.position.y
                }
            }
            for(let playerID in players) {
                sockets[playerID].emit('updatePosition', returnData)
            }


            
        }
    })

}, 100, 0)
 
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
    //first a bullet

    socket.on('fireBullet', function(data){
        const bullet = new Bullet();
        bullet.name = 'Bullet';
        bullet.position.x = data.position.x;
        bullet.position.y = data.position.y;
        bullet.direction.x = data.direction.x;
        bullet.direction.y = data.direction.y;


        bullets.push(bullet);
        
        const returnData = {
            name : bullet.name,
            id : bullet.id,
            position: {
                x: bullet.position.x,
                y: bullet.position.y
            },
            direction: {
                x: bullet.direction.x,
                y: bullet.direction.y
            }
        }

        socket.emit("serverSpawn", returnData )
        socket.broadcast.emit('serverSpawn', returnData)
    })

    socket.on('updateRotation', function(data) {
        player.tankRotation = data.tankRotation;
        player.barrelRotation = data.barrelRotation;

        socket.broadcast.emit('updateRotation', player);
    })

    //utility function 
    //find different instances of time
    

    socket.on('disconnect', function() {
        console.log("player has disconnected")
        delete players[thisPlayerID];
        delete sockets[thisPlayerID];
        socket.broadcast.emit('disconnected', player);
    })

}) 

function interval(func, wait, times){
    const interv = function(w,t) {
        return function() {
            if(typeof t === "undefined" || t-- > 0) {
                setTimeout(interv, w);
                try{
                    func.call(null);
                } catch(e) {
                    t = 0;
                    throw e.toString();
                }
            }  
        }
    }(wait, times);

    setTimeout(interv, wait);
}