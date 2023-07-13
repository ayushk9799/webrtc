import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
const app= express();

const server = http.createServer(app);
  
let users=[];
const io = new Server(server,{cors:{origin:'*'}});// so that html wala connct ho ske
app.use(cors());
io.on('connection', (socket) => {
    console.log('A user connected',socket.id);
  //  socket.on('offer',(offer)=>
  //  {
  //   console.log(offer)
  //  })

    let user={
      myId:socket.id,
      partnerId:null
    }
    users.push(user)
    
     
const pairUsers =(user,socket)=>
{
  let availableUsers=users.filter((user)=>user.myId!=socket.id&&user.partnerId===null);
  const getRandomNumber=(n)=>
  {
    return Math.floor(Math.random()*n);
  }
  if(availableUsers.length>0)
  {
    let random=getRandomNumber(availableUsers.length)
  let partner=availableUsers[random]
  user.partnerId=partner.myId;
  partner.partnerId=user.myId;
  console.log('partner found')
  console.log(users);
  socket.emit('partner found',partner.myId)
  // io.to(partner.myId).emit('partner found',socket.id);
  }
  else{
    console.log("waiting for connection");
  }
}     
pairUsers(user,socket)
     
const findThePartner=(myid)=>
{
 
  for(let i=0;i<users.length;i++)
  {
    if(users[i].myId===myid)
    {
      return users[i].partnerId;
  }
}


}
  
    socket.on('chat message', (msg) => {
      console.log('Message:', msg);
      io.emit('chat message', msg);
    });
const socketData=socket.id;
    socket.on('offer',(data)=>
    {
      console.log(data);
       io.to(data.id).emit('answer',data,socketData)
    })
    socket.on('candidate',(candidate)=>
    {
           let partnerId= findThePartner(socket.id);
           console.log('sended by',socket.id,' will be received by ',partnerId)
           io.to(partnerId).emit('candidates',candidate)
    })
    socket.on('sending answer',(data,socketData)=>
    {
      io.to(socketData).emit('receive answer',data)
    })
  
    socket.on('disconnect', () => {
      users=users.filter(user=>user.myid!=socket.id)
      console.log('A user disconnected');
    });
    // socket.on('offer',(data))
  });

app.use(express.json());
app.get('/',(req,res)=>
{
    res.send('hello');
}
)
const port=8080;
server.listen(port,() => {
    console.log(`listening to ${port}`);
})