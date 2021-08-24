const fs = require('fs');
const path = require('path');

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 8080;


var live_stream_chat_wopermission = [];
var live_stream_chat = [];

var common_chat = [];
var info_desk_chat = [];

var people = {};
var private_chat = {};

var notification_people = {};
var bbb_notifications = {};

function chat_file_backup(file,chat_data)
{
  fs.readFile(file,"utf8", function read(err, data) {
    var content = (data != "" && typeof data != "undefined")? JSON.parse(data) : [];


      if (err) {
        throw err;
      }
     for(i=0;i<chat_data.length;i++){
        content.push(chat_data[i]);
      };


      fs.writeFile(file, JSON.stringify(content), function (err,data) {
        if (err) {
          return console.log(err);
        }

      });

  });
}

function private_chat_file_backup(file,chat_data)
{
  fs.readFile(file,"utf8", function read(err, data) {
    var content = (data != "" && typeof data != "undefined")? JSON.parse(data) : {};
      if (err) {
        throw err;
      }
      const timestamp = new Date() / 1000;
      content[timestamp] = chat_data;
      fs.writeFile(file, JSON.stringify(content), function (err,data) {
        if (err) {
          return console.log(err);
        }

      });

  });
}


function chat_infos_search(array,index="",value)
{
  if(index !="" && array[index] == value)
  {
    return index;
  }
  else
  {
    return -1;
  }
}



app.get('/api', (req, res) => {
  switch (req.query["sayfa"]) {
    case "current_live_stream_all_messages":
      res.send(JSON.stringify(live_stream_chat));
      break;
    case "saved_live_stream_all_messages":
      res.sendFile(__dirname+"/live_stream/live_stream_all_messages_permitted.json");
    
      break;
    case "private_all_messages":
      res.sendFile(__dirname+"/private_chat/private_chat_all_messages.json");
    
      break;
    case "bbb_notifications":
      res.send(JSON.stringify(bbb_notifications));
    
      break;
    case "delete_all_private_messages":
      if(req.query["sifre"] == "Fat3591441")
      {
        private_chat = {};
        res.send(JSON.stringify(private_chat));
        
      }
    
      break;
    default:
      break;
  }
});



io.on('connection', (socket) => {


  io.emit('live stream chat wo/permission all messages', live_stream_chat_wopermission);
  socket.on('live stream chat wo/permission', msg => {
    io.emit('live stream chat wo/permission', msg);
    live_stream_chat_wopermission.push(msg);
  });

  io.emit('live stream all messages', live_stream_chat);
  socket.on('live stream chat', msg => {
    live_stream_chat.push(msg);
    for(i=0;i<live_stream_chat_wopermission.length;i++)
    {
      var id =chat_infos_search(live_stream_chat_wopermission[i],"id",msg.id);
      var name = chat_infos_search(live_stream_chat_wopermission[i],"name",msg.name);
      var message =chat_infos_search(live_stream_chat_wopermission[i],"message",msg.message);
      if(id != -1 && name != -1 && message != -1)
      {
        live_stream_chat_wopermission[i].permission = 1;
      }

    }
    io.emit('live stream chat', msg);
  });


  
  socket.on('common chat', msg => {
    io.emit('common chat', msg);
    common_chat.push(msg);
  });

  socket.on('info desk chat', msg => {
    io.emit('info desk chat', msg);
    info_desk_chat.push(msg);
  });


  socket.on("join-private", (msg) => {
    private_chat[msg.id] = (typeof private_chat[msg.id] != "undefined")? private_chat[msg.id] :{};
    people[msg.id] = socket.id;
    people[socket.id] = msg.id;

    text_message = (typeof people[msg.id] != "undefined")? io.to(people[msg.id]).emit('private chat all messages', private_chat[msg.id]) : "";

  });

  
  socket.on("join-notification", (msg) => {
    notification_people[String(msg.id)] = [socket.id,1];
    notification_people[String(socket.id)] = [msg.id,1];
    io.to(notification_people[msg.id][0]).emit("all bbb notifications",bbb_notifications[msg.id]);
    io.to(notification_people[msg.id][0]).emit("all online users",notification_people);

    console.log(notification_people);
  });



  socket.on("private message", (msg) => {

    private_chat[msg.from] = (typeof private_chat[msg.from] != "undefined")? private_chat[msg.from] : {};
    private_chat[msg.to] = (typeof private_chat[msg.to] != "undefined")? private_chat[msg.to] : {};

    if(typeof private_chat[msg.from][msg.to] != "undefined")
    {
      private_chat[msg.from][msg.to]["messages"].push(msg);
    }
    else
    {
      private_chat[msg.from][msg.to] ={"first_name":msg.to_name,"first_id":msg.to,"second_name":msg.from_name,"second_id":msg.from,"messages":[msg]};
    }


    if(typeof private_chat[msg.to][msg.from] != "undefined")
    {
      
      private_chat[msg.to][msg.from]["messages"].push(msg);
    }
    else
    {
      private_chat[msg.to][msg.from] ={"first_name":msg.to_name,"first_id":msg.to,"second_name":msg.from_name,"second_id":msg.from,"messages":[msg]};
    }

    
    
   text_notification_result = (typeof notification_people[msg.to] != "undefined")? io.to(notification_people[msg.to][0]).emit("text-notifications",msg) : "";
    text_message = (typeof people[msg.from] != "undefined")? io.to(people[msg.from]).emit("private",msg) : "";
    text_message = (typeof people[msg.from] != "undefined")? io.to(people[msg.to]).emit("private",msg) : "";

  });



  


  socket.on("bbb-notifications", (msg) =>{
    bbb_notifications[msg.from] = (typeof bbb_notifications[msg.from] != "undefined")? bbb_notifications[msg.from] : {};
    bbb_notifications[msg.to] = (typeof bbb_notifications[msg.to] != "undefined")? bbb_notifications[msg.to] : {};

    bbb_notifications[msg.from][msg.to] ={"first_id":msg.to,"second_id":msg.from,"second_name":msg.from_name,permission:msg.permission,url:""};
    bbb_notifications[msg.to][msg.from] ={"first_id":msg.to,"second_id":msg.from,"second_name":msg.from_name,permission:msg.permission,url:""};
    
    bbb_notification_result = (typeof notification_people[msg.to] != "undefined")? io.to(notification_people[msg.to][0]).emit("bbb-notifications",msg) : "";
  
  });

  socket.on("bbb-chat-permission", (msg) =>{
    bbb_notifications[msg.from] = (typeof bbb_notifications[msg.from] != "undefined")? bbb_notifications[msg.from] : {};
    bbb_notifications[msg.to] = (typeof bbb_notifications[msg.to] != "undefined")? bbb_notifications[msg.to] : {};

    bbb_notifications[msg.from][msg.to] ={"first_id":msg.to,"second_id":msg.from,"second_name":msg.from_name,permission:msg.permission,url:msg.url};
    bbb_notifications[msg.to][msg.from] ={"first_id":msg.to,"second_id":msg.from,"second_name":msg.from_name,permission:msg.permission,url:msg.url};
    bbb_chat_permission_result = (typeof notification_people[msg.from] != "undefined")? io.to(notification_people[msg.from][0]).emit("bbb-chat-permission-reciever",msg) : "";
  });


  socket.on("disconnecting", (reason) => {
    online_with_user_id = notification_people[socket.id];
    user_id = (typeof notification_people[socket.id] != "undefined")? notification_people[socket.id][0] : null;

    if(typeof notification_people[socket.id] != "undefined"){
     delete  notification_people[socket.id];
    }
    if(typeof notification_people[String(user_id)] != "undefined")
    {
     delete notification_people[String(user_id)];
    }
    
  });

});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});

setInterval(() => {


  chat_file_backup('./live_stream_messages/live_stream_chat_all_messages.json',live_stream_chat_wopermission);

  chat_file_backup('./info_desk_messages/common_chat_messages.json',common_chat);
  common_chat = [];
  chat_file_backup('./info_desk_messages/info_desk_all_messages.json',info_desk_chat);
  info_desk_chat = [];

}, 5*60*1000);

setInterval(() => {
  chat_file_backup('./live_stream_messages/live_stream_all_messages_permitted.json',live_stream_chat);
  private_chat_file_backup('./private_chat/private_chat_all_messages.json',private_chat);
}, 3*60*60*1000);

