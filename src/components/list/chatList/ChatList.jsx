import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/AddUser";
import { useUserStore } from "../../../lib/UserStore";
import { doc, getDoc, onSnapshot, } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
    const [addMode, setAddMode] = useState(false);
    const [input, setInput] = useState("");
    const [chats, setChats] = useState([]);
    const { currentUser} = useUserStore();
    const { changeChat } = useChatStore();

    useEffect(() => {
        if (!currentUser?.id) return;
        const unsub = onSnapshot(doc(db, "userchats", currentUser.id), async (res) => {
            const items = res.data()?.chats || [];

            const promises = items.map(async (item) => {
                const userDocRef = doc(db, "users", item.receiverId);
                const userDocSnap = await getDoc(userDocRef);
                const user = userDocSnap.data();

                return { ...item, user };
            });

            const chatData = await Promise.all(promises);
            setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        });

        return () => unsub();
    }, [currentUser.id]);

    const handleSelect = (chat) => {
        changeChat(chat.chatId, chat.user);
    };

    const filteredChats = chats.filter(
        (c) => c.user?.username?.toLowerCase().includes(input.toLowerCase())
    );
    

    return (
        <div className="chatList">
            {addMode && <AddUser onClose={() => setAddMode(false)} />}

            <div className="search">
                <div className="searchBar">
                    <img src="./search.jpg" alt="" />
                    <input
                        type="text"
                        placeholder="Search"
                        onChange={(e) => setInput(e.target.value)}
                    />
                </div>
                <img
                    src={addMode ? "./minus.jpg" : "./plus.jpg"}
                    alt=""
                    className="add"
                    onClick={() => setAddMode((prev) => !prev)}
                />
            </div>

            {filteredChats.length === 0 ? (
                <div className="noChatsMessage">No chats yet. Start a conversation!</div>
            ) : (
                filteredChats.map((chat) => (
                    <div className="item" key={chat.chatId} onClick={() => handleSelect(chat)}>
                        <img
                            src={
                                Array.isArray(chat.user?.blocked) && chat.user.blocked.includes(currentUser.id)
                                  ? "./avatar.jpg"
                                  : chat.user?.avatar?.url || "./avatar.jpg"
                              }                              
                            alt=""
                        />
                        <div className="texts">
                            <span>
                                {Array.isArray(chat.user?.blocked) && chat.user.blocked.includes(currentUser.id)
                                    ? "User"
                                    : chat.user?.username}
                            </span>
                            <p>{chat.lastMessage}</p>
                        </div>

                    </div>
                ))
            )}
        </div>
    );
};

export default ChatList;
