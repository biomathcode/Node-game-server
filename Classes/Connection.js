module.exports = class Connection{
    constructor() {
        this.socket;
        this.player;
        this.server;
        this.lobby;
    }
    //Handle all our io events and where we should route them to be handled
    createEvents() {
        let connection = this;
        let socket = connection.socket;
        let server = connection.server;
        let player = connection.player;

        socket.on('disconnect', function() {
            server.onDisconnected(connection);

        })
        socket.on('joinGame', function() {
            server.onAttemptToJoinGame(connection);
            
        })
        socket.on('fireBullet', function() {
            connection.lobby.onFireBullet(connection, data);
            
        })
        socket.on('collisionDestroy', function() {
            connection.lobby.onCollisionDestroy(connection, data);
        })
        socket.on('updatePosition', function() {
            player.position.x = data.position.x;
            player.position.y = data.position.y;

            socket.broadcast.to(connection.lobby.id).emit('updatePosition', player);
            
        })
        socket.on('updateRotation', function() {
            player.tankRotation = data.tankRotation;
            player.barrelRotation = data.barrelRotation;

            socket.broadcast.to(connection.lobby.id).emit('updateRotation', player);
            
        })
    }
}