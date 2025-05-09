import { useState, useEffect  } from "react";
import "./login.css";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { uploadImage } from "../../lib/cloudinary";
import { useChatStore } from '../../lib/ChatStore';


const Login = ({ setUser }) => {
  const [avatar, setAvatar] = useState({ file: null, url: "" });
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  
  

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0])
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loadingLogin) return;
    setLoadingLogin(true);
    toast.dismiss();
  
    const email = e.target.loginEmail.value;
    const password = e.target.loginPassword.value;
  
    try {
      console.log("Signing in:", email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login success:", userCredential);
  
      if (userCredential?.user?.uid) {
        toast.success("Logged in successfully!");
        setUser(true);
      } else {
        console.log("User credential missing UID", userCredential);
        toast.error("Invalid login response.");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === "auth/user-not-found") {
        toast.warn("User does not exist");
      } else if (err.code === "auth/wrong-password") {
        toast.error("Invalid password");
      } else {
        toast.error("Login failed");
      }
    } finally {
      setLoadingLogin(false);
    }
  };
  

const handleRegister = async (e) => {
    e.preventDefault();
    if (loadingRegister) return;
    setLoadingRegister(true);
  
    const formData = new FormData(e.target);
    const { registerUsername: username, registerEmail: email, registerPassword: password } = Object.fromEntries(formData);
  
    try {
      let avatarUrl = "";
      if (avatar.file) {
        avatarUrl = await uploadImage(avatar.file);
      }
  
      const res = await createUserWithEmailAndPassword(auth, email, password);
  
      await setDoc(doc(db, "users", res.user.uid), {
        username,
        email,
        id: res.user.uid,
        avatar: avatarUrl,
        blocked: [],
      });
  
      await setDoc(doc(db, "userchats", res.user.uid), {
        chats: [],
      });
  
      toast.success("Account created! You can login now.");
  
      useChatStore.getState().resetChat();
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    } finally {
      setLoadingRegister(false);
    }
  };
  

  useEffect(() => {
    // Clear login inputs
    const loginEmail = document.querySelector("input[name='loginEmail']");
    const loginPassword = document.querySelector("input[name='loginPassword']");
    if (loginEmail) loginEmail.value = "";
    if (loginPassword) loginPassword.value = "";
  
    // Clear register inputs
    const registerEmail = document.querySelector("input[name='registerEmail']");
    const registerUsername = document.querySelector("input[name='registerUsername']");
    const registerPassword = document.querySelector("input[name='registerPassword']");
    if (registerEmail) registerEmail.value = "";
    if (registerUsername) registerUsername.value = "";
    if (registerPassword) registerPassword.value = "";
  }, []);

  return (
    <div className="Login">
      <div className="item">
        <h2>Welcome</h2>
        <form onSubmit={handleLogin} autoComplete="off">
          <input type="text" placeholder="Email" name="loginEmail" autoComplete="username" />
          <input type="password" placeholder="Password" name="loginPassword" autoComplete="new-password" />
          <button disabled={loadingLogin}>{loadingLogin ? "Loading..." : "Sign In"}</button>
        </form>
      </div>
      <div className="separator"></div>
      <div className="item">
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister} autoComplete="off">
          <label htmlFor="file">
            <img src={avatar.url || "./avatar.jpg"} alt="" /> Upload an Image
          </label>
          <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
            <input type="text" placeholder="Username" name="registerUsername" autoComplete="new-username" />
            <input type="text" placeholder="Email" name="registerEmail" autoComplete="new-email" />
            <input type="password" placeholder="Password" name="registerPassword" autoComplete="new-password" />
          <button disabled={loadingRegister}>{loadingRegister ? "Loading..." : "Sign Up"}</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
