import React from "react";
import Feed from "./Feed/Feed";
import RightSide from "./RightPart/RightSide";
import LeftSide from "./LeftPart/LeftSide";
import { useNavigate } from "react-router-dom";
import Header from "./Header";

function Receipes() {
  const navigate = useNavigate();
  return (
    <>
      <div className="">
        <Header />
        <div className="flex justify-around m-5 px-10 container mx-auto ">
          <div className="w-2/6">
            <LeftSide />
          </div>
          <div className="w-4/6 mx-5">
            <Feed />
          </div>
          <div className="w-1/6">
            <RightSide />
          </div>
        </div>
      </div>
    </>
  );
}

export default Receipes;
