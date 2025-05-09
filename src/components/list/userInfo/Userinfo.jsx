import "./userInfo.css";
import { useUserStore } from "../../../lib/UserStore";
import { useState, useEffect, useRef  } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const UserInfo = () => {
  const { currentUser } = useUserStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newDesc, setNewDesc] = useState(currentUser.description || "");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(currentUser.username || "");
  const dropdownRef = useRef(null);

        const handleLogout = async () => {
            try {
            await signOut(auth);
            } catch (err) {
            console.error("Logout failed", err);
            }
        };

        const handleDescSubmit = async () => {
          try {
            const userRef = doc(db, "users", currentUser.id);
            await updateDoc(userRef, { description: newDesc });
            setIsEditingDesc(false);
            toast.success("Description updated!");
          } catch (err) {
            console.error("Failed to update description", err);
            toast.error("Failed to update description.");
          }
        };

        useEffect(() => {
            const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowMenu(false);
            }
            };

            document.addEventListener("mousedown", handleClickOutside);
            return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            };
        }, []);

        const handleUsernameSubmit = async () => {
          try {
            const userRef = doc(db, "users", currentUser.id);
            await updateDoc(userRef, { username: newUsername });
            setIsEditingUsername(false);
            toast.success("Username updated!");
          } catch (err) {
            console.error("Failed to update username", err);
            toast.error("Failed to update username.");
          }
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
  return (
    <div className="userInfo">
      <div className="user">
        <img src={currentUser.avatar?.url || "./avatar.jpg"} alt="avatar" className="avatar-img" />
        <div className="user-header">
             {isEditingUsername ? (
                          <div className="username-edit-form">
                            <input
                              type="text"
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                            />
                            <div className="button-group">
                              <button onClick={handleUsernameSubmit}>Save</button>
                              <button onClick={() => setIsEditingUsername(false)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <h2>{currentUser.username}</h2>
                )}
            {isEditingDesc ? (
                    <div className="desc-edit-form">
                        <input
                          type="text"
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                        />
                        <div className="button-group">
                          <button onClick={handleDescSubmit}>Save</button>
                          <button onClick={() => setIsEditingDesc(false)}>Cancel</button>
                        </div>
                  </div>
                  ) : (
                    currentUser?.description && (
                      <p className="description">{currentUser.description}</p>
                    )
              )}
                </div>
              </div>
              <div className="icons">
                <img
                  src="./edit.jpg"
                  alt="Edit Description"
                  onClick={() => setIsEditingDesc(true)}
                  className="clickable"
                />
                <img
                  src="./video.jpg"
                  alt="Video feature"
                  onClick={handleFeatureComingSoon}
                  className="clickable"
                />
        <div className="dropdown-container">
            <img
                src="./more.jpg"
                alt=""
                onClick={() => setShowMenu((prev) => !prev)}
                className="clickable"
            />
            {showMenu && (
                <div ref={dropdownRef} className="dropdown-menu">
                    <button onClick={handleLogout}>Logout</button>
                    <button onClick={() => setIsEditingDesc(true)}>Edit Description</button>
                    <button onClick={() => setIsEditingUsername(true)}>Edit Username</button>
                </div>
            )}
            </div>
      </div>
    </div>
  );
};

export default UserInfo;
