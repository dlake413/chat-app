var express = require('express');
var http = require('http');
var path = require('path');
var async = require('async');
var socketio = require('socket.io');
var crypto = require('crypto');
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'public')));

var room = ['lobby'];
var user_list = {'lobby':{}}

io.on('connection', function (socket) {
  
  socket.on('toLobby',function(data){
    socket.join(room[0]);
  })
  
  socket.on('enter_chat', function (data){
    var randomID = crypto.createHash('sha1').update(data.user + socket.id).digest('hex');
    socket.emit('welcome', {welcome:'Welcome, '+data.user+'! You just entered lobby.', id:randomID});
    user_list[data.room][socket.id] = data.user;
    var now = new Date();
    socket.broadcast.to(data.room).emit('server_message', { 
      message:now.toTimeString().split(' ')[0] + ': ' +data.user + " entered " + data.room
    });
  });
  
  socket.on('send_message', function(data){
    var now = new Date();
    socket.broadcast.to(data.room).emit('user_message', {
      message:data.message,
      user:data.username,
      time:now.toTimeString().split(' ')[0]
    })
  });
  
  socket.on('leave', function(data){
    if(user_list[data.room][socket.id]){
      delete user_list[data.room][socket.id];
      var now = new Date();
      socket.broadcast.to(data.room).emit('server_message', { 
        message:now.toTimeString().split(' ')[0] + ': ' + data.user + " left " + data.room
      });
    };
  });
  
  function updateUserInRoom(){
    for(var i = 0; i < room.length; i++){
      io.sockets.in(room[i]).emit('update', {room_info:user_list[room[i]]});
    }
  }
  
  setInterval(updateUserInRoom, 5000);
  
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});