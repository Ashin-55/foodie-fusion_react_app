import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Receipes from "./components/Receipes";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Recepi from "./components/Feed/Recepi";
import createPost from "./components/Feed/newPost";
import Profile from "./components/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Receipes />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/recepie" element={<Recepi />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/mypost" element={<Recepi />} />
        <Route path="/newpost" element={<createPost/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
