//Game lobby 

let Connection = require('./Connection')
let Player = require('./Player')


//Lobbies 
let LobbyBase = require('./Lobbies/LobbyBase')
let GameLobby = require('./Lobbies/GameLobby')
let GameLobbySettings = require('./Lobbies/GameLobbySettings')
module.exports = class Server {
    constructor() {
        this.connections = [];
        this.lobbys = [];

        this.lobbys[0] = new LobbyBase(0);
    }

    //Connections
    
    //Internal update every 100 milliseconds
    onUpdate() {
        //inheritance
        let server = this;

        //update each lobby;
        for(let id in server.lobbys) {
            server.lobbys[id].onUpdate();
        }

    }
    //Handle a new connection to the server
    onConnected(socket) {
        let server = this;
        let connection = new Connection();
        connection.socket = socket;
        connection.player = new Player();
        connection.Server = server;

        let player = connection.player;
        let lobbys = server.lobbys;

        console.log('Added a  new player to the server(' + player.id + ')')
        server.connections[player.id] = connection;

        socket.join(player.lobby);
        connection.lobby = lobbys[player.lobby];
        connection.lobby.onEnterLobby(connection);

        return connection;


    }
    onDisconnected(connection = Connection){
        let server = this;
        let id = connection.player.id;

        delete server.connections[id];
        console.log('Player' + connection.player.displayerPlayerInformation() + ' has disconnected');

        connection.socket.broadcast.to(connection.player.lobby).emit('disconnected', {
            id: id
        });

        //Preform lobby clean up
        server.lobbys[connection.player.lobby].onLeaveLobby(connection);
    }

    onAttemptToJoinGame(connection = Connection) {
        //Look through lobbies for a gamelobby
        //check if joinable
        //if not make a new game
        let server = this;
        let lobbyFound = false;

        let gameLobbies = server.lobbys.filter(item => {
            return item instanceof GameLobby;
        });
        console.log('Found (' + gameLobbies.length + ') lobbies on the server.');

        gameLobbies.forEach(lobby => {
            if(!lobbyFound) {
                let canJoin = lobby.canEnterLobby(connection)

                if(canJoin) {
                    lobbyFound = true;
                    server.onSwitchLobby(connection, lobby.id);
                }
            }
        })
        //ALl game lobbies full or we have never created one 
        if(!lobbyFound) {
            console.log("Making a new game lobby");
            let gamelobby = new GameLobby(gameLobbies.length + 1, new GameLobbySettings('FFA', 2));
            server.lobbys.push(gamelobby);
            server.onSwitchLobby(connection, gamelobby.id);
        }
    }
    onSwitchLobby(connection = Connection, lobbyID){
        let server = this;
        let lobbys = server.lobbys;

        connection.socket.join(lobbyID); //Join the new lobby's socket channel
        connection.lobby = lobbys[lobbyID];

        lobbys[connection.player.lobby].onLeaveLobby(connection);
        lobbys[lobbyID].onEnterLobby(connection);
    }

}