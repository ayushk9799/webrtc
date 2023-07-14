import { useEffect, useRef } from "react";
import './App.css';
import {io} from 'socket.io-client'
function App() {
  const localmedia=useRef();
  const remoteMedia=useRef();
  let offerer=false;
const socket=io('http://localhost:8080')
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
const peerconnection=new RTCPeerConnection(configuration)
console.log(peerconnection)
peerconnection.ontrack=(event)=>{
  remoteMedia.current.srcObject=event.streams[0]
}

const videoCall=async()=>
{
 
   navigator.mediaDevices.getUserMedia({audio:true,video:true}).then((stream)=>
   {
    localmedia.current.srcObject=stream
    console.log(stream);
    stream.getTracks().forEach(track => {
      console.log(track)
      console.log('stream addtrack')
      peerconnection.addTrack(track, stream);
    });
    socket.emit('gotTheVideo')
    // peerconnection.addStream(stream);
   })
 
  //console.log(stream);
 
}
//fun functinality but works
// peerconnection.onconnectionstatechange=(event)=>
// {
//   if(peerconnection.connectionState === 'connected')
//   {
//     videoCall();
//   }
// }



let counter=8;

peerconnection.onicecandidate = (event) => {
  console.log('hello');
  if (event.candidate) {
    console.log(counter++);
    console.log(event.candidate)
    socket.emit('candidate',event.candidate)
    // candidatesArray.push(event.push)
    // const iceCandidate = new RTCIceCandidate(event.candidate);
    // peerconnection.addIceCandidate(iceCandidate);
  // Send the ICE candidate to the other user
  }
  else{
    console.log('over');
    
  }
};

peerconnection.onnegotiationneeded=(event)=>
{
  if(offerer)
  {
  creatingOffer(otherUserid)
  }
}
socket.on('candidates',async (candidate)=>
{
  
   await peerconnection.addIceCandidate(candidate)

  })
const creatingOffer=async (id)=>
{
  offerer=true;
const offer=await peerconnection.createOffer({offerToReceiveAudio:true,offerToReceiveVideo:true});
console.log(offer);
await peerconnection.setLocalDescription(offer)
socket.emit('offer',{offer:peerconnection.localDescription,id:id})
console.log(peerconnection.localDescription.sdp)
}

socket.on('partner found',(id)=>
{
  otherUserid=id;
 console.log('connected to ',id);
 console.log('offerer',socket.id)
 creatingOffer(id);

 
  // socket.emit('offer',peerconnection.localDescription)
})

socket.on('answer',async(data,socketData)=>
{
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
   await peerconnection.setRemoteDescription(data.answer);
})


useEffect(()=>
{
videoCall()

},[]);
// peerconnection.onicecandidate=(event)=>
// {
//   if(event.candidate)
//   {
//     console.log('true')
//     console.log(event.candidate)
//   }
//   else
//   {
//     console.log('false');
//   }
// }


  return (
    <>
    <div>
      <button id='start' >Start</button>
      <video ref={localmedia} style={{width:300,height:300,padding:0,border:'1px solid red'}} autoPlay muted></video>
      <video ref={remoteMedia} style={{width:300,height:300,padding:0,border:'1px solid red'}} autoPlay ></video>
    </div>
    </>
  );
}

export default App;
