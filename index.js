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
//function will be called everymilliseconds
setInterval(() => {
    bullets.forEach(bullet => {
        //will call every 100 milliseconds to see if the bullet is there on not

        const isDestroyed = bullet.onUpdate()

        //Remove
        if(isDestroyed) {
            despawnBullet(bullet)
            
        } else {
            const returnData = {
                id: bullet.id,
                position: {
                    x : bullet.position.x,
                    y : bullet.position.y
                }
            }
            
            for(var playerID in players) {
                sockets[playerID].emit('updatePosition', returnData)
            }                 
        }        
    });

    //handle Dead players
    for(var playerID in players) {
        let player = players[playerID];

        if(player.isDead) {
            let isRespawn = player.respawnCounter();

            if(isRespawn) {
                let returnData = {
                    id: player.id,
                    position: {
                        x: player.position.x,
                        y: player.position.y

                    }
                }

                sockets[playerID].emit('playerRespawn', returnData);
                sockets[playerID].broadcast.emit('playerRespawn', returnData);
            }
        }
    }
}, 100, 0);

function despawnBullet(bullet = Bullet) {
    console.log('Destroying bullets (' + bullet.id + ')');
    const index = bullets.indexOf(bullet);
    if(index > -1) {
        bullets.splice(index, 1);

        const returnData = {
            id : bullet.id
        }
        //players are dictionary
        for(let playerID in players) {
            sockets[playerID].emit('serverUnspawn', returnData)
        }

    }
}
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
        player.position.x = data.position.x;
        player.position.y = data.position.y;

        socket.broadcast.emit('updatePosition', player);

    })
    //fires a bullet
    //
    socket.on('fireBullet', function(data){
        const bullet = new Bullet();
        bullet.name = 'Bullet';
        bullet.activator = data.activator;
        bullet.position.x = data.position.x;
        bullet.position.y = data.position.y;
        bullet.direction.x = data.direction.x;
        bullet.direction.y = data.direction.y;


        bullets.push(bullet);
        
        const returnData = {
            name : bullet.name,
            id : bullet.id,
            activator: bullet.activator,
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
        //broadcast goes to everybody exact to us
        //
        socket.broadcast.emit('serverSpawn', returnData)
    })

    socket.on('updateRotation', function(data) {
        player.tankRotation = data.tankRotation;
        player.barrelRotation = data.barrelRotation;

        socket.broadcast.emit('updateRotation', player);
    })

    //utility function 
    //find different instances of time
    socket.on('collisionDestroy', function(data) {
        console.log('Collision with bullet id: ' + data.id);
        let returnBullets = bullets.filter(bullet => {
            return bullet.id == data.id
        });

        //we will mostly only have one entry but just in case loop through all and set to destoryed
        returnBullets.forEach(bullet => {
            let playerHit = false;
            //check if we hit someone that is not us

            for(var playerID in players) {
                if(bullet.activator != playerID) {
                    let player = players[playerID]
                    let distance = bullet.position.Distance(player.position);

                    if(distance < 0.65) {
                        playerHit = true;
                        let isDead = player.dealDamage(50); //Take half of their health for testing
                        if(isDead) {
                            console.log('Player with id' + player.id + ' has died');
                            let returnData = {
                                id: player.id
                            }
                            sockets[playerID].emit('playerDied', returnData )
                            sockets[playerID].broadcast.emit('playerDied', returnData)
                        } else {
                            console.log('Player with id: ' + player.id + 'has (' + player.health + ') health left.')
                        }
                        despawnBullet(bullet);
                    }
                }
            }

            if(!playerHit) {
                bullet.isDestroyed = true;
            }
            
        })
    })
    

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