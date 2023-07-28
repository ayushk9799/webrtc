import { useEffect, useRef } from "react";
import './App.css';
import {io} from 'socket.io-client'
function App() {
  const localmedia=useRef();
  const remoteMedia=useRef();
  let offerer=false;
  let stream;
  let peerconnection;
const socket=io('http://localhost:8080')
socket.on('connect_error', (error) => {
  console.error('Connection Error:', error.message);
  
});

socket.on('connect_timeout', (timeout) => {
  console.error('Connection Timeout:', timeout);
});

socket.on('error', (error) => {
 
  console.error(error.message);
});
let otherUserid;
// socket.on('connection',()=>
// {
//   console.log('connected with client');
// })
const configuration = {
  iceServers:[ 
    { urls: 'stun:stun.l.google.com:19302' },
    // Add more STUN or TURN servers if necessary
  ],
};
const videoCall=async()=>
{
 try{
 stream= await  navigator.mediaDevices.getUserMedia({audio:true,video:true})
    localmedia.current.srcObject=stream
    console.log(stream);
    connection();
 }
 catch(error)
 {
  alert('Error Switch ON your camera ')
  console.log('error gettting media devices',error);
  setTimeout(() => {
    videoCall();
  }, 1000);
 }
    // peerconnection.addStream(stream);
   }
const connection=()=>
{
  try{
peerconnection=new RTCPeerConnection(configuration)
console.log(peerconnection)
peerconnection.ontrack=(event)=>{
  const streamscheck=event.streams;
  if(!(streamscheck.length===0))
  {
  remoteMedia.current.srcObject=event.streams[0]
  }
  else{
    console.log("stream stopped")
  }
}
peerconnection.onicecandidate = (event) => {
  console.log('hello');
  if (event.candidate) {
    console.log(counter++);
    console.log(event.candidate)
    socket.emit('candidate',{candidate:event.candidate,partnerId:otherUserid})
    // candidatesArray.push(event.push)
    // const iceCandidate = new RTCIceCandidate(event.candidate);
    // peerconnection.addIceCandidate(iceCandidate);
  // Send the ICE candidate to the other user
  }
  else{
    console.log('over');
    
  }
};



stream.getTracks().forEach(track => {
  console.log(track)
  console.log('stream addtrack')
  peerconnection.addTrack(track, stream);
});
socket.emit('gotTheVideo')
}
catch(error)
{
  console.log('RTC connection error ',error)
}
}




let counter=8;


socket.on('candidates',async (candidate)=>
{
  
   await peerconnection.addIceCandidate(candidate)

  })
const creatingOffer=async (id)=>
{
  try{
  offerer=true;
const offer=await peerconnection.createOffer({offerToReceiveAudio:true,offerToReceiveVideo:true});
console.log(offer);
await peerconnection.setLocalDescription(offer)
socket.emit('offer',{offer:peerconnection.localDescription,id:id})
console.log(peerconnection.localDescription.sdp)
}
catch(error)
{
  console.log(error)
}
}
socket.on('save partner',(data)=>
{
  otherUserid=data;
})
socket.on('partner found',(id)=>
{
  otherUserid=id;
 console.log('connected to ',id);
 console.log('offerer',socket.id)
 creatingOffer(id);

 
  // socket.emit('offer',peerconnection.localDescription)
})

socket.on('answer',async(data,socketData)=>
{ console.log(peerconnection.connectionState)
   await peerconnection.setRemoteDescription(data.offer);
  console.log('answer',socket.id);
  const answer=await peerconnection.createAnswer({offerToReceiveAudio:true,offerToReceiveVideo:true});
  console.log(answer)
  await peerconnection.setLocalDescription(answer);
  console.log(peerconnection.localDescription.sdp)
  socket.emit('sending answer',{answer:answer,id:data.id},socketData)

})
socket.on('receive answer',async(data)=>
{
  try{
    console.log(peerconnection.connectionState)
   await peerconnection.setRemoteDescription(data.answer);
  }
  catch(e){
    console.log(e)
  }
})
socket.on('skipped',()=>
{
  console.log('skipped')
    peerconnection.close()
  peerconnection=null;
  
  connection();
  console.log(peerconnection)

})

const handleSkip=()=>
{
    peerconnection.close()
  peerconnection=null;
    
   socket.emit('skipped');
   connection();
}

useEffect(()=>
{
videoCall()

},[]);

  return (
    <>
    <div>
      <button onClick={handleSkip}>skip</button>
      <video ref={localmedia} style={{width:300,height:300,padding:0,border:'1px solid red'}} autoPlay muted></video>
      <video ref={remoteMedia} style={{width:300,height:300,padding:0,border:'1px solid red'}} autoPlay ></video>
    </div>
    </>
  );
}

export default App;
