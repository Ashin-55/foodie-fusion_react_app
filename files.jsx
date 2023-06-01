// Signup files

/*

*/

//Login files

/*

    */

// Profile component

// <>
//   {userDetails ? (
//     <>
//       <div className="min-h-min max-w-7xl mx-auto shadow-md flex justify-between text-right py-3 px-3 mt-2 rounded-md">
//         <div>
//           <p className="text-xl">Hello Hitesh</p>
//         </div>
//         <div>
//           <button
//             className="bg-red-400 text-white p-1 rounded-md"

//           >
//             Logout
//           </button>
//         </div>
//       </div>
//       {/* TODO FORM */}
//       <TodoForm />
//       {/* TODOS BOX */}
//       <Todos />
//     </>
//   ) : (
//     <p className="mt-4">
//       Please Login To see Profile{" "}
//       <Link to="/">
//         <span className="bg-blue-300 p-2 cursor-pointer text-white rounded-md">
//           Login
//         </span>
//       </Link>
//     </p>
//   )}
// </>

// TodoForm Component

/*
<div className="max-w-7xl mx-auto mt-10">
      <form
        action=""

        className="flex justify-center mb-10"
      >
        <input
          type="text"
          name=""
          id=""
          placeholder="Enter Todo"
          className="border p-2 w-2/3 rounded-md"
          
        />
        <button
          className="bg-purple-500 p-2 text-white ml-2 rounded-md"
          type="submit"
        >
          Add Todo
        </button>
      </form>
    </div>
*/

// Todos

<div className="max-w-7xl mx-auto">
  <p className="text-xl font-bold mb-2">Todo List</p>
  {loader ? (
    <p>Loading ...</p>
  ) : (
    <div>
      <div>
        <div className="p-4 flex items-center justify-between border-b-2 bg-gray-100 rounded-lg mb-1">
          <div>
            <p>item</p>
          </div>
          <div>
            <span className="text-red-400 cursor-pointer">Delete</span>
          </div>
        </div>
      </div>
    </div>
  )}
</div>;
