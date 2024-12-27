// App.js
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import UsersList from "./UsersList";
import "../index.css";

function App() {
  return (
    <div className="border border-gray-400 rounded-2xl p-2 m-2 flex justify-around items-center">
      <h1 className="text-3xl font-bold underline">Hello Tailwind CSS!</h1>
      <p className="m-0 text-gray-400">Tailwind CSSです</p>
      <button className="bg-gray-300 border-0 p-2 rounded-md hover:bg-gray-400 hover:text-white">
        ボタン
      </button>
    </div>
  );
}

// const App = () => {
//   return (
//     <Router>
//       <div>
//         <h1 className="text-3xl font-bold underline">Hello world!</h1>
//         <nav>
//           <ul>
//             <li>
//               <Link to="/">Home</Link>
//             </li>
//             <li>
//               <Link to="/users">Users</Link>
//             </li>
//           </ul>
//         </nav>

//         <Routes>
//           <Route path="/users" element={<UsersList />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// };

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);
