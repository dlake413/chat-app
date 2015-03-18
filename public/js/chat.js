$(document).ready(function(){
  //this line is what asks the server to connect and share a socket with the client
  var socket = io.connect();
  var currentRoom = 'lobby';
  socket.emit('toLobby', {});

  //I had played with only letting X messages on screen at once but I was 
  //pressed for time, so I wrapped up the jQuery bit in this one function
  //so I can update it later if I'ld like.  For now I blindly add the JSON 
  //as a string for transparency.
  var addMessage = function(data){
    $("#chat_logs").append($("<li>")
                        .append($("<span>").addClass('user_log').html(data.user))
                        .append($("<span>").addClass('chat_log').html(data.message))
                        .append($("<span>").addClass('time_log').html(data.time)));
  }
  
  var addServMessage = function(data){
    $("#chat_logs").append($("<li>")    
                        .append($("<span>").addClass('serv_msg').html(data.message)));
  }
  
  var addMyMessage = function(message){
    var now = new Date();
    $("#chat_logs").append($("<li>").addClass('my_message')
                        .append($("<span>").addClass('time_log').html(now.toTimeString().split(' ')[0]))
                        .append($("<span>").addClass('my_log').html(message)));
  }
  
  /* 
  The rest of the code just registers callback functions for each of the "events"
  that I thought to expect from the server.  Like any backend work, the API contracts 
  should be clear.  In this case a "welcome" event was fired when the client connects.
  A "ping server" event from the client will trigger a "pong server" event from the server.
  In all event triggering a JSON object can be sent along to include a payload of some type.
  Very powerful but simple.
  */
  var myMessage = [];
  var userName = '';
  
  $('#chat_message').prop({
    disabled:true,
    placeholder:"Please enter your username first"
  });
  $('#send_message').prop({
    disabled:true,
  })
  
  $('#user_name').focusout(function(){
    if(escape($(this).val()).length > 4){
      userName = escape($(this).val());
      $('#chat_message').prop({
        disabled:false,
        placeholder:"Enter your message"
      });
      $('#send_message').prop({
        disabled:false,
      });
      $(this).replaceWith($('<p>').prop('id','user_name').html(userName));
      socket.emit('enter_chat', {user:userName, room:currentRoom});
    } else {
      alert("Username has to be at least 4 characters");
      $(this).val('');
      return;
    }
  });
  
  socket.on('welcome', function (data) {
    $("#status").html(data.welcome);
    $('#curRoom').html(currentRoom);
  });
  
  socket.on('server_message', function(data){
    addServMessage(data);
    var scroll = document.getElementById("chat_screen");
    scroll.scrollTop = scroll.scrollHeight;
  })

  socket.on('user_message', function(data){
    addMessage(data);
    var scroll = document.getElementById("chat_screen");
    scroll.scrollTop = scroll.scrollHeight;
  });
  
  //These are standard events for a disconnection... I haven't seen them yet
  socket.on('disconnect', function(){
    $("#status").html("not connected");
  });
  
  socket.on('update', function(data){
    $('#numPeeps').html(Object.keys(data.room_info).length);
    $('#user_list').empty()
    for(i in data.room_info){
      $('#user_list').append($('<li>').html(data.room_info[i]));
    }
  });
  
  $('#send_message').click(function(){
      var message = $('#chat_message').val();
      if(message.length == 0){
        return;
      }
      var data = {
        username:userName,
        room:currentRoom,
        message:$('#chat_message').val(),
      };
      $('#chat_message').val('');

      addMyMessage(data.message)
      socket.emit('send_message', data);
      var scroll = document.getElementById("chat_screen");
      scroll.scrollTop = scroll.scrollHeight;
  });
  
  $("#chat_message").keyup(function(event){
    if(event.keyCode == 13){
        $("#send_message").click();
    }
  });
  
  function onleave(){
    socket.emit('leave', {room:currentRoom, user:userName});
  }

  window.onbeforeunload = onleave;
});