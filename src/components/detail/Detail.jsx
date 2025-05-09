import "./detail.css"
import { auth, db } from "../../lib/firebase";
import { useUserStore } from "../../lib/UserStore";
import { useChatStore } from "../../lib/chatStore";
import { useState, useEffect, useRef } from "react";
import { deleteUser } from "firebase/auth";
import {
    arrayRemove,
    arrayUnion,
    doc,
    updateDoc,
    getDoc,
    onSnapshot,
  } from "firebase/firestore";
  


const Detail = () => {
//Declared States
    const { currentUser } = useUserStore();
    const {
        chatId,
        user,
        isCurrentUserBlocked,
        isReceiverBlocked,
        changeBlock,
    } = useChatStore();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [privacyOpen, setPrivacyOpen] = useState(false);
    const [nickname, setNickname] = useState("");
    const [showNicknameInput, setShowNicknameInput] = useState(false);
    const [savedNickname, setSavedNickname] = useState("");
    const [sharedImages, setSharedImages] = useState([]);
    const [sharedImagesOpen, setSharedImagesOpen] = useState(false);

//Logics
    const handleBlock = async () => {
      if (!user || !currentUser) return;

      const currentUserDocRef = doc(db, "users", currentUser.id);

      try {
        const currentUserDocSnap = await getDoc(currentUserDocRef);
        const currentData = currentUserDocSnap.data();
        const currentlyBlocked = currentData?.blocked || [];

        const isAlreadyBlocked = currentlyBlocked.includes(user.id);

        await updateDoc(currentUserDocRef, {
          blocked: isAlreadyBlocked
            ? arrayRemove(user.id)  // unblock
            : arrayUnion(user.id), // block
        });

        changeBlock(); // update UI state
      } catch (err) {
        console.error("Error updating block status:", err);
      }
    };

    
    const handleSaveNickname = async () => {
      if (nickname.trim() === "" || !user?.id || !currentUser?.id) return;
    
      try {
        const currentUserDocRef = doc(db, "users", currentUser.id);
        await updateDoc(currentUserDocRef, {
          [`nicknames.${user.id}`]: nickname, 
        });
    
        setSavedNickname(nickname);
        setShowNicknameInput(false);
      } catch (err) {
        console.error("Failed to save nickname:", err);
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
    

    const extractImages = (messages, currentUserId, userId, limit = 10) => {
        return messages
          .filter(
            (msg) =>
              msg.type === "image" &&
              (msg.senderId === currentUserId || msg.senderId === userId)
          )
          .map((msg) => ({
            url: msg.imageUrl || msg.img,
            timestamp: msg.createdAt?.seconds
              ? msg.createdAt.seconds * 1000
              : new Date(msg.createdAt).getTime(),
          }))
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, limit)
          .map((img) => img.url);
      };
      

    const fetchSharedImages = async () => {
        if (!currentUser || !user || !chatId) return;
      
        try {
          const chatDoc = await getDoc(doc(db, "chats", chatId));
          if (!chatDoc.exists()) return;
      
          const messages = chatDoc.data().messages || [];
          const images = extractImages(messages, currentUser.id, user.id, 7);
      
          setSharedImages(images);
        } catch (err) {
          console.error("Error fetching shared photos:", err);
        }
      };
      
      
    useEffect(() => {
        if (!sharedImagesOpen || !chatId) return;
      
        const chatRef = doc(db, "chats", chatId);
      
        const unsubscribe = onSnapshot(chatRef, (snapshot) => {
          if (!snapshot.exists()) return;
      
          const messages = snapshot.data().messages || [];
          const images = extractImages(messages, currentUser.id, user.id, 10);
      
          setSharedImages(images);
        });
      
        return () => unsubscribe();
      }, [sharedImagesOpen, chatId, currentUser.id, user?.id]);
      
      
    const handleDeleteAccount = async () => {
        const confirmed = confirm("Are you sure you want to delete your account?");
        if (!confirmed) return;
      
        try {
          await deleteUser(auth.currentUser); 
          // deletes from Firebase Auth
          // Optionally: delete user data from Firestore
          // await deleteDoc(doc(db, "users", currentUser.id));
          console.log("Account deleted.");
        } catch (err) {
          console.error("Error deleting account:", err);
        }
      };

      const scrollRef = useRef();
            useEffect(() => {
            if (sharedImagesOpen && scrollRef.current) {
                scrollRef.current.scrollIntoView({ behavior: "smooth" });
            }
            }, [sharedImages]);
      
      return (
        <div className="detail">
          <div className="user">
            <img src={user?.avatar?.url || "./avatar.jpg"} alt="avatar" />
            <h2>
              {Array.isArray(user?.blocked) && user.blocked.includes(currentUser.id)
                ? "User"
                : user?.username || "Unknown"}
            </h2>
            {savedNickname && (
                    <p className="nicknameDisplay">Nickname: {savedNickname}</p>
                )}
            {user?.description && <p className="description">{user.description}</p>}
          </div>
    
          <div className="info">
            {/* Chat Settings */}
            <div className="option">
              <div
                className="title clickable"
                onClick={() => setSettingsOpen((prev) => !prev)}
              >
                <span>Chat Settings</span>
                <img src={settingsOpen ? "./arrowDown.jpg" : "./arrowUp.jpg"} alt="" />
              </div>
    
              {settingsOpen && (
                    <div className="dropdownMenu">
                        <button onClick={() => setShowMembers((prev) => !prev)}>
                        View Members
                        </button>

                        {showMembers && (
                        <div className="memberList">
                            <p>Chat Members:</p>
                            <ul>
                            <li>You</li>
                            <li>{user?.username || "Unknown"}</li>
                            </ul>
                        </div>
                        )}
                    {!isCurrentUserBlocked && (
                        <button onClick={() => setShowNicknameInput((prev) => !prev)}>
                        {showNicknameInput ? "Cancel Nickname" : "Add Nickname"}
                        </button>
                    )}
                        {showNicknameInput && (
                        <div className="nicknameForm">
                            <input
                            type="text"
                            placeholder="Enter nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            />
                            <button onClick={handleSaveNickname}>
                                Save
                            </button>
                        </div>
                        )}
                    </div>
                )}
            </div>
                <div className="option">
                    <div className="title clickable"
                            onClick={() => setPrivacyOpen((prev) => !prev)}>
                        <span>Privacy & help </span>
                        <img src={privacyOpen ? "./arrowDown.jpg" : "./arrowUp.jpg"} alt="" />
                </div>
                {privacyOpen && (
                        <div className="dropdownMenu">
                            {user && (
                              <button onClick={handleBlock}>
                                {isReceiverBlocked ? "Unblock User" : "Block User"}
                              </button>
                            )}
                            <button onClick={handleDeleteAccount}>Delete My Account</button>
                        </div>
                    )}
                </div>
                <div className="option">
                    <div
                        className="title clickable"
                        onClick={() => setSharedImagesOpen((prev) => !prev)}
                    >
                        <span>Shared Photos</span>
                        <img
                        src={sharedImagesOpen ? "./arrowDown.jpg" : "./arrowUp.jpg"}
                        alt=""
                        />
                    </div>

                    {sharedImagesOpen && (
                        <div className="sharedImagesSection">
                            <h3 className="sectionTitle">Photos</h3>
                            <div className="sharedImagesGrid">
                            {sharedImages.length > 0 ? (
                                sharedImages.map((url, index) => (
                                <div key={index} className="photoItem">
                                    <img
                                    src={url}
                                    alt={`Shared photo ${index + 1}`}
                                    className="photoPreview"
                                    loading="lazy"
                                    />
                                    <div className="photoMeta">
                                    <span className="photoDescription">Photo_{index + 1}.jpg</span>
                                    <a href={url} download>
                                        <img src="./download.jpg" className="icon" alt="Download" />
                                    </a>
                                    </div>
                                </div>
                                ))
                            ) : (
                                <p>No shared images yet.</p>
                            )}
                            <div ref={scrollRef} /> 
                          </div>
                        </div>
                        )}
                </div>
                <div className="footer">
                {user && (
                  <button onClick={handleBlock}>
                    {isReceiverBlocked ? "Unblock User" : "Block User"}
                  </button>
                )}
                <button className="logout" onClick={() => auth.signOut()}>
                    Logout
                </button>
            </div>
            </div> 
            
        </div>
    )
}

export default Detail