import { useState, useEffect } from 'react';
import './App.css'
import List from './components/list/List'
import Detail from './components/detail/Detail'
import Chat from './components/chat/Chat'
import Login from './components/login/Login';
import Notification from './components/notification/Notification';
import { onAuthStateChanged } from 'firebase/auth';
import { useUserStore } from './lib/UserStore';
import { auth } from './lib/firebase';
import { useChatStore } from './lib/ChatStore';
import { ClipLoader } from 'react-spinners';


const App = () => {

  const {currentUser, isLoading, fetchUserInfo, setUser} = useUserStore();
  const {chatId} = useChatStore();

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, async (user) => {
      try {
        await fetchUserInfo(user?.uid || null);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    });
    return () => unSub();
  }, [fetchUserInfo]);

  if (isLoading) return <div className="loading"><ClipLoader size={40} color="#09f" /></div>

  return (
    <div className="wrapper">
      <div className='container'>
      {
        currentUser ?(<>
        <List/>
        {chatId && <Chat />}
        {chatId && <Detail  />}
        </>
        ) : (
        <Login setUser={setUser} />
      )}
      <Notification/>
      </div>
    </div>
  )
}



export default App
