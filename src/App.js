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
 
 stream= await  navigator.mediaDevices.getUserMedia({audio:true,video:true})
    localmedia.current.srcObject=stream
    console.log(stream);
    connection();
    // peerconnection.addStream(stream);
   }
const connection=()=>
{
peerconnection=new RTCPeerConnection(configuration)
console.log(peerconnection)
peerconnection.ontrack=(event)=>{
  remoteMedia.current.srcObject=event.streams[0]
}
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
stream.getTracks().forEach(track => {
  console.log(track)
  console.log('stream addtrack')
  peerconnection.addTrack(track, stream);
});
socket.emit('gotTheVideo')
}




 
  //console.log(stream);
 




//fun functinality but works
// peerconnection.onconnectionstatechange=(event)=>
// {
//   if(peerconnection.connectionState === 'connected')
//   {
//     videoCall();
//   }
// }



let counter=8;


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

const handleSkip=()=>
{
  
  peerconnection.close();
  delete peerconnection.onicecandidate;
  delete peerconnection.ontrack;
   delete peerconnection.onnegotiationneeded;
  peerconnection=null;
  connection();
  console.log(peerconnection)
   socket.emit('skipped');
}
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
      <button onClick={handleSkip}>skip</button>
      <video ref={localmedia} style={{width:300,height:300,padding:0,border:'1px solid red'}} autoPlay muted></video>
      <video ref={remoteMedia} style={{width:300,height:300,padding:0,border:'1px solid red'}} autoPlay ></video>
    </div>
    </>
  );
}

export default App;
