import "./list.css"
import ChatList from "./chatList/ChatList"
import UserInfo from "./userInfo/Userinfo"


const List = () => {
    return (
        <div className="list">
            <UserInfo/>
            <ChatList/>
        </div>
    )
}

export default List