let LobbyBase = require('./LobbyBase');
let GameLobbySettings = require('./GameLobbySettings');
let Connection = require('../Connection')
let Bullet = require('../Bullet');

module.exports = class GameLobby extends LobbyBase {
    constructor(id, settings = GameLobbySettings) {
        super(id);
        this.settings = settings;
        this.bullets = [];

    }
    //onwriting the function in lobbyBase   
    onUpdate() {
        let lobby = this;
        lobby.updateBullets();
        lobby.updateDeadPlayers();
    }
    canEnterLobby(connection = Connection) {
        //return true or false

        let lobby = this;
        let maxPlayerCount = lobby.settings.maxPlayerCount;
        let currentPlayerCount = lobby.connections.length;

        if(currentPlayerCount + 1 > maxPlayerCount) {
            return false;
        }
        return true;
    }
    onEnterLobby(connection = Connection) {
        let lobby = this;

        super.onEnterLobby(connection);

        lobby.addPlayer(connection);
        //Handle spawing any server spawned objects here
        //Example: Loot, perhaps flying bullets etc;
    }

    onLeaveLobby(connection = Connection) {
        let lobby = this;

        super.onLeaveLobby(connection);

        lobby.removePlayer(connection);
        //Handle spawing any server spawned objects here
        //Example: Loot, perhaps flying bullets etc;

    }

    updateBullets() {
        let lobby = this;
        let bullets = lobby.bullets;
        let connections = lobby.connections;

        bullets.forEach(bullet => {
            let isDestroyed = bullet.onUpdate();
            if(isDestroyed) {
                lobby.despawnBullet(bullet);
            } else{
                var returnData = {
                    id: bullet.id,
                    position:{
                        x: bullet.position.x,
                        y: bullet.position.y
                    }
                }

                connections.forEach(connection => {
                    connection.socket.emit('updatePosition', returnData);
                })
            }
        });

    }

    updateDeadPlayers() {
        let lobby = this;
        let connections = lobby.connections;

        connections.forEach(connection => {
            let player = connection.player;
            if(player.isDead) {
                let isRespawn = player.respawnCounter()
                if(isRespawn) {
                    let socket = connection.socket;
                    let returnData = {
                        id: player.id,
                        position: {
                            x: player.position.x,
                            y: player.position.y
                        }
                    }

                    socket.emit('playerRespawn', returnData);
                    //to veryone in the lobby
                    socket.broadcast.to(lobby.id).emit('playerRespawn', returnData)
                }
            }
        })
    }
    onFireBullet(connection = Connection, data) {
        let lobby = this;

        let bullet = new Bullet();
        bullet.name = 'Bullet';
        bullet.activator = data.activator;
        bullet.position.x = data.position.x;
        bullet.position.y = data.position.y;
        bullet.direction.x = data.direction.x;
        bullet.direction.y = data.direction.y;

        lobby.bullets.push(bullet);

        var returnData = {
            name: bullet.name,
            id:bullet.id,
            activator: bullet.activator,
            position: {
                x: bullet.position.x,
                y: bullet.position.y,
            }, 
            direction: {
                x: bullet.position.x,
                y: bullet.position.y
            }
        }

        connection.socket.emit('serverSpawn', returnData);
        //to the same lobby
        connection.socket.broadcast.to(lobby.id).emit('serverSpawn', returnData)
    }
    onCollisionDestroy(connection = Connection, data) {
        let lobby = this;

        let returnBullets = lobby.bullets.filter(bullet => {
            return bullet.id == data.id;
        })

        returnBullets.forEach(bullet => {
            let playerHit = false;

            lobby.connections.forEach(c => {
                let player = c.player;

                if(bullet.activator != player.id) {
                    let distance = bullet.position.Distance(player.position);

                    if(distance < 0.65) {
                        let isDead = player.dealDamage(50);
                        if(isDead) {
                            console.log('Player with id:' + player.id + 'has died');
                            let returnData = {
                                id: player.id
                            }
                            c.socket.emit('playerDied', returnData);
                            c.socket.broadcast.to(lobby.id).emit('playerDied', returnDate);
                        } else{
                            console.log('Player with id: ' + player.id +  'has (' + player.health + ') health left');
                        }
                        lobby.despawnBullet(bullet);
                    }
                }
            });

            if(!playerHit) {
                bullet.isDestroyed = true;
            }
        })
    }
    despawnBullet(bullet = Bullet) {
        let lobby = this;
        let bullets = lobby.bullet;
        let connections = lobby.connections;
        console.log('Destroying bullets (' + bullet.id + ')');
        const index = bullets.indexOf(bullet);
        if(index > -1) {
            bullets.splice(index, 1);
    
            var returnData = {
                id : bullet.id
            }
            //players are dictionary
            connections.forEach(connection => {
                connection.socket.emit('serverUnspawn', returnData);
            })
    
        }
    }


    addPlayer(connection = Connection) {
        let lobby = this;
        let connections = lobby.connections;
        let socket = connection.socket;

        var returnData = {
            id: connection.player.id,

        }
        //
        socket.emit('spawn', returnData);
        socket.broadcast.to(lobby.id).emit('spawn', returnData);

        connections.forEach(c => {
            if(c.player.id != connections.player.id) {
                socket.emit('spawn',{
                    id: c.player.id
                });
            }
        })
        
    }
    removePlayer(connection = Connection) {
        let lobby = this;

        connection.socket.broadcast.to(lobby.id).emit('disconnected', {
            id: connection.player.id
        })


    }
}