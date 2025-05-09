import "./addUser.css";
import { db } from "../../../../lib/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useState } from "react";
import { useUserStore } from "../../../../lib/UserStore";

const AddUser = ({ onClose }) => {
  const [user, setUser] = useState(null);
  const { currentUser } = useUserStore();
  const [alreadyAdded, setAlreadyAdded] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");
  
    if (username === currentUser.username) {
      setUser(null);
      setAlreadyAdded(false);
      alert("You can't add yourself.");
      return;
    }
  
    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapShot = await getDocs(q);
  
      if (!querySnapShot.empty) {
        const userDoc = querySnapShot.docs[0];
        const foundUser = { id: userDoc.id, ...userDoc.data() };
        setUser(foundUser);
  
        const userChatsSnap = await getDoc(doc(db, "userchats", currentUser.id));
        const userChatsData = userChatsSnap.data();
        const chats = userChatsData?.chats || [];
  
        const isAlreadyAdded = chats.some(
          (chat) => chat.receiverId === foundUser.id
        );
  
        setAlreadyAdded(isAlreadyAdded);
      } else {
        setUser(null);
        setAlreadyAdded(false);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };
  

  const handleAdd = async () => {
    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userchats");
  
    try {
      const newChatRef = doc(chatRef);
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });
  
      // Replace updateDoc with setDoc + { merge: true }
      await setDoc(doc(userChatsRef, user.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      }, { merge: true });
  
      await setDoc(doc(userChatsRef, currentUser.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      }, { merge: true });
  
      onClose();
  
    } catch (err) {
      console.error("Error creating chat:", err);
      alert("Failed to create chat. Please try again.");
    }
  };
  

  return (
    <div className="modal">
      <div className="modal-content">
        <form onSubmit={handleSearch}>
          <input type="text" placeholder="Username" name="username" />
          <button>Search</button>
        </form>
        {user && (
          <div className="user">
            <div className="detail">
              <img src={user?.avatar?.url || "./avatar.jpg"} alt="User Avatar" />
              <span>{user.username}</span>
            </div>
            {alreadyAdded ? (
              <span>Already added</span>) : (
                <button onClick={handleAdd} disabled={alreadyAdded}>Add</button>
            )}
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddUser;
