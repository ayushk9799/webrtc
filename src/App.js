import { useEffect, useRef, useState } from "react";
import "./App.css";
import { socket } from "./Socket";

function App() {
  const localMedia = useRef(null);
  const remoteMedia = useRef(null);
  const [offerer, setOfferer] = useState(null);
  const [otherUserId, setOtherUserId] = useState(null);
  // const [peerConnection.current,setPeerConnection] = useState(null);
  const peerConnection=useRef(null);
  const [close,setClose]=useState(null)
  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    if (offerer && otherUserId !== null && peerConnection.current!==null) {
      creatingOffer(otherUserId);
    }
  }, [otherUserId, offerer]);
 
  const connection = async () => {
    try {
      const stream = await videoCall();
     let pc = new RTCPeerConnection(configuration);
   console.log("hello")
      pc.ontrack = (event) => {
        const streamsCheck = event.streams;
        if (streamsCheck.length > 0) {
          remoteMedia.current.srcObject = event.streams[0];
          console.log("streming")
        } else {
          console.log("stream stopped");
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("candidates");
          console.log(otherUserId)
          socket.emit("candidate", {
            candidate: event.candidate,
           
          });
        }
      };
       
        pc.oniceconnectionstatechange = (event) => {
          console.log("ICE connection state:", pc.iceConnectionState);
        };
        
        pc.onsignalingstatechange = (event) => {
          console.log("Signaling state:", pc.signalingState);
        };
       console.log(pc)
        peerConnection.current=pc;
      setClose(false);
      stream.getTracks().forEach((track) => {
        console.log("add track")
        pc.addTrack(track, stream);
      });
     console.log(peerConnection.current)
      socket.emit("gotTheVideo");
      console.log("got the video")
    } catch (error) {
      console.log("RTC connection error ", error);
    }
  };

 
useEffect(()=>
{

  console.log(close)
  if(close===null || close )
    {
      connection();

    }
},[close])
  

  const videoCall = async () => {
    try {
      let stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localMedia.current.srcObject = stream;
      return stream;
    } catch (error) {
      alert("Error Switch ON your camera ");
      console.log("error getting media devices", error);
      setTimeout(() => {
        videoCall();
      }, 1000);
    }
  };

 
  useEffect(() => {
    socket.on("connect_error", (error) => {
      console.error("Connection Error:", error.message);
    });
    socket.on("connect_timeout", (timeout) => {
      console.error("Connection Timeout:", timeout);
    });
    socket.on("error", (error) => {
      console.error(error.message);
    });
    socket.on("reconnect_error", (error) => {
      console.log(error.message);
    });

    socket.on("save partner", (data) => {
      console.log("save partner")
      setOfferer(false);
      setOtherUserId(data);
    });

    socket.on("partner found", (id) => {
      console.log("partner found");
      console.log(id)
      setOtherUserId(id);
      setOfferer(true);
    });

    socket.on("candidates", async (candidate) => {
      if (peerConnection.current) {
        console.log("candiddates")
        await peerConnection.current.addIceCandidate(candidate);
      }
      else{
        console.log(peerConnection.current)
      }
    });

    socket.on("answer", async (data, socketData) => {
      console.log(peerConnection.current)
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(data.offer);
        const answer = await peerConnection.current.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await peerConnection.current.setLocalDescription(answer);
        console.log("creating anser")
        console.log(peerConnection.current)
        socket.emit("sending answer", { answer: answer, id: data.id }, socketData);
      }
      else{
        console.log("answer");
        console.log(peerConnection.current)
      }
    });

    socket.on("receive answer", async (data) => {
      if (peerConnection.current) {
        try {
          console.log("receive anser")
          await peerConnection.current.setRemoteDescription(data.answer);
        } catch (e) {
          console.log(e);
        }
      }
    });

    socket.on("skipped", () => {
      if (peerConnection.current) {
        peerConnection.current.close();
        
      }
      console.log("skiped");
      setClose(true);
      setOtherUserId(null);
      setOfferer(null);

      peerConnection.current=null;
    
    });

    

    return () => {
      socket.off("connect_error");
      socket.off("connect_timeout");
      socket.off("error");
      socket.off("reconnect_error");
      socket.off("save partner");
      socket.off("partner found");
      socket.off("candidates");
      socket.off("answer");
      socket.off("receive answer");
      socket.off("skipped");
    };
  }, [peerConnection.current]);
  const creatingOffer = async (id) => {
    try {
      const offer = await peerConnection.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peerConnection.current.setLocalDescription(offer);
      socket.emit("offer", { offer: peerConnection.current.localDescription, id: id });
      console.log("offer")
    } catch (error) {
      console.log(error);
    }
  };

  const handleSkip = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      console.log(peerConnection.current.connectionState);
      console.log(peerConnection.current)
    }
    setOtherUserId(null);
    setOfferer(null);
    peerConnection.current=null;
    setClose(true);
    socket.emit("skipped");
    console.log("handelk skip")

  };

  return (
    <>
      <div>
        <button onClick={handleSkip}>skip</button>
        <video
          ref={localMedia}
          style={{
            width: 300,
            height: 300,
            padding: 0,
            border: "1px solid red",
          }}
          autoPlay
          muted
        ></video>
        <video
          ref={remoteMedia}
          style={{
            width: 300,
            height: 300,
            padding: 0,
            border: "1px solid red",
          }}
          autoPlay
          muted
        ></video>
      </div>
    </>
  );
}

export default App;
