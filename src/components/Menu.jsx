import React from 'react';
import { Home, Plus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FloatingIsland() {
     const navigate = useNavigate();

    const home = ()=>{
         navigate('/');
    }

    const handleCreatePost = ()=>{
        navigate('/create-post');
    }

    const handleLogout =()=>{
     navigate('/profile');
    }
  return (
    <div className="fixed z-10 bottom-6 left-1/2 transform -translate-x-1/2 bg-black border border-gray-300 rounded-full shadow-2xl py-2 px-10 flex items-center space-x-10 backdrop-blur-sm">
      {/* Refresh Button */}
      <button
        onClick={home}
        className="p-3 rounded-full hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 hover:scale-105"
        aria-label="home"
      >
        <Home className="w-5 h-5 text-white hover:text-gray-300" />
      </button>
      
      {/* Create Button */}
      <button
        onClick={handleCreatePost}
        className="p-3 rounded-full hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 hover:scale-105"
        aria-label="Create"
      >
        <Plus className="w-5 h-5 text-white hover:text-gray-300" />
      </button>
      
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="p-3 rounded-full hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 hover:scale-105"
        aria-label="Logout"
      >
        <User className="w-5 h-5 text-white hover:text-gray-300" />
      </button>
    </div>
  );
}