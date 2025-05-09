import { useEffect, useState, useRef  } from "react"
import "./chat.css"
import EmojiPicker from "emoji-picker-react"
import {
    arrayUnion, 
    doc, getDoc, 
    onSnapshot, 
    updateDoc} from "firebase/firestore"
import{db} from "../../lib/firebase"
import { useChatStore } from "../../lib/chatStore"
import { useUserStore } from "../../lib/UserStore"
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Chat = () => {
const [open, setOpen] = useState(false);
const [chat, setChat] = useState();
const [text, setText] = useState("");
const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
const {currentUser} = useUserStore();
const [canChat, setCanChat] = useState(true); 
const [showInfo, setShowInfo] = useState(false);
const [img, setImg] = useState({
    file: null,
    url: "",
});
const [savedNickname, setSavedNickname] = useState("");
const endRef = useRef(null);

useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) =>{
        setChat(res.data())
    })

    return () => {
        unSub();
    }
},[chatId] );

useEffect(() => {
    const checkCanChat = async () => {
      if (!currentUser?.id || !user?.id) {
        setCanChat(false);
        return;
      }
  
      try {
        const senderDoc = await getDoc(doc(db, "users", currentUser.id));
        const senderData = senderDoc.data();
        const isAllowed = !isCurrentUserBlocked && !isReceiverBlocked;
        setCanChat(isAllowed); 
      } catch (err) {
        console.error("Error checking chat permission:", err);
        setCanChat(false);
      }
    };
  
    checkCanChat();
  }, [currentUser.id, user?.id, isCurrentUserBlocked, isReceiverBlocked]);  

const handleEmoji = e =>{
   setText((prev) => prev + e.emoji);
   setOpen(false)
}

const handleImg = e =>{
    if(e.target.files[0])
    setImg({
        file:e.target.files[0],
        url: URL.createObjectURL(e.target.files[0])
    })
}

const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "CommsChat"); 
    formData.append("cloud_name", "drgithvlh"); 

    try {
        const res = await fetch("https://api.cloudinary.com/v1_1/drgithvlh/image/upload", {
            method: "POST",
            body: formData,
        });
        const data = await res.json();
        return data;  
    } catch (err) {
        console.error("Cloudinary upload error:", err);
        return null;
    }
};

const getLastSentMessage = () => {
    if (!Array.isArray(chat?.messages)) return "No messages yet.";

    const sentMessages = chat.messages.filter(
        m => m.senderId === currentUser?.id
    );

    return sentMessages.length > 0
        ? sentMessages[sentMessages.length - 1].text
        : "No sent messages yet.";
};


const handleFeatureComingSoon = () => {
    toast.info("🚧 Coming soon in the next update!", {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    });
};

const handleSend = async () => {
  if (isCurrentUserBlocked || isReceiverBlocked) {
    alert("You can't send messages to this user.");
    return;
  }
    document.getElementById("file").value = "";
  
    if (text.trim() === "" && !img.file) return;
  
    let imgUrl = null;
    let imgId = null;
  
    try {
      if (img.file) {
        const uploadResult = await uploadToCloudinary(img.file);
        if (uploadResult) {
          imgUrl = uploadResult.secure_url;
          imgId = uploadResult.public_id;
        }
      }
  
      const messageType = imgUrl ? "image" : "text";
  
      const messageData = {
        senderId: currentUser.id,
        type: messageType,
        text: text,
        createdAt: new Date(),
        ...(imgUrl && { img: imgUrl, imageId: imgId }),
      };
  
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion(messageData),
      });
  
      const userIDs = [currentUser.id, user.id];
  
      userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);
  
        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chats.findIndex(c => c.chatId === chatId);
  
          userChatsData.chats[chatIndex].lastMessage =
            messageType === "image" ? "📷 Image" : text;
          userChatsData.chats[chatIndex].isSeen = id === currentUser.id;
          userChatsData.chats[chatIndex].updatedAt = Date.now();
  
          await updateDoc(userChatsRef, {
            chats: userChatsData.chats,
          });
        }
      });
  
      setText("");
      setImg({ file: null });
    } catch (err) {
      console.error("Send failed:", err);
    }
  };  

  useEffect(() => {
    const fetchNickname = async () => {
      if (!currentUser?.id || !user?.id) return;
  
      try {
        const currentUserDocRef = doc(db, "users", currentUser.id);
        const docSnap = await getDoc(currentUserDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const storedNickname = data.nicknames?.[user.id];
          if (storedNickname) {
            setSavedNickname(storedNickname);
          }
        }
      } catch (err) {
        console.error("Error fetching nickname:", err);
      }
    };
  
    fetchNickname();
  }, [user?.id, currentUser?.id]);
  
    return (
        
        <div className="chat">
            <div className="top">
                <div className="user">
                <img src={user?.avatar?.url || "./avatar.jpg"}        alt="avatar" />
                    <div className="texts">
                    <span className="username-line">
                        {isCurrentUserBlocked ? "User" : (user?.username || "User")}
                        {savedNickname && (
                            <span 
                                style={{
                                    marginLeft: "10px", 
                                    fontStyle: "italic", 
                                    color: "#ffffff",
                                    backgroundColor: "#0d5c5f",
                                    borderRadius:"5px",
                                    padding:"5px"
                                }}
                            >{savedNickname}</span>
                        )}
                    </span>

                    {user?.description && (
                        <p className="description">{user.description}</p>
                    )}
                    </div>
                </div>
                <div className="icons">
                    <img src="./phone.jpg" alt="" onClick={handleFeatureComingSoon}/>
                    <img src="./video.jpg" alt="" onClick={handleFeatureComingSoon}/>
                    <img src="./info.jpg" alt="Info" onClick={() => setShowInfo(prev => !prev)} />
                </div>
            </div>
            <div className="center">
            {chat?.messages?.map((messages, index) => (
                     <div className={messages.senderId === currentUser?.id ? "message own" : "message"} key={index}>
                    <div className="texts">
                        {messages.img && <img src={messages.img} alt="uploaded image"/>}
                        <p>{messages.text}</p>
                        <span>
                            {messages.createdAt?.seconds
                                ? new Date(messages.createdAt.seconds * 1000).toLocaleTimeString()
                                : new Date(messages.createdAt).toLocaleTimeString()}
                        </span>
                        </div>
                    </div>
                ))}
                {img.url && (
                    <div className="message own">
                        <div className="texts">
                            <img src={img.url} alt="Uploaded image" style={{ maxWidth: "100%", borderRadius: "10px" }} />
                        </div>
                    </div>
                )}


                <div ref={endRef}></div>
            </div>
            <div className="bottom">
                <div className="icons">
                    <label htmlFor="file">
                        <img src="./image.jpg" alt="" />
                    </label>
                    <input type="file" id="file" style={{display: "none"}} onChange={handleImg}/>
                    <label htmlFor="camera">
                    <img src="./camera.jpg" alt="" />
                    </label>
                    <input
                        type="file"
                        id="camera"
                        accept="image/*"
                        capture="environment"
                        style={{ display: "none" }}
                        onChange={handleImg}
                        />
                    <img src="./mic.jpg" alt="" onClick={handleFeatureComingSoon}/>
                </div>
                <input type="text" placeholder={
                        !canChat
                        ? "You must add this user before chatting"
                        : isCurrentUserBlocked || isReceiverBlocked
                            ? "You cannot send a message"
                            : "Type a message..."
                 }  value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={!canChat} />
                <div className="emoji">
                    <img src="./emoji.jpg" alt="" onClick={()=>setOpen(prev => !prev)}/>

                    <div className={`picker ${open ? "open" : ""}`}>
                     <EmojiPicker onEmojiClick={handleEmoji}/>
                </div>
                </div>
                <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>
                Send
                </button>

            </div>
            {showInfo && (
                <div className="user-info-modal">
                    <h3>User Info</h3>
                    <p><strong>Username:</strong> {user?.username || "Unknown"}</p>

                    {savedNickname && (
                    <p><strong>Nickname:</strong> {savedNickname}</p>
                    )}

                    <p><strong>Description:</strong> {user?.description || "No description."}</p>
                    <p><strong>Last message sent:</strong> {getLastSentMessage()}</p>
                    <button onClick={() => setShowInfo(false)}>Close</button>
                </div>
            )}
        </div>
    )
}

export default Chat