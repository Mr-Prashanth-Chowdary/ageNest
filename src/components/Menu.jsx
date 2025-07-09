import React, { useState } from 'react';
import { Home, Plus, User, Search,RefreshCw} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchUser from './SearchUser';

export default function FloatingIsland() {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);

  const home = () => navigate('/');
  const handleCreatePost = () => navigate('/create-post');
  const handleLogout = () => navigate('/profile');
  const toggleSearch = () => setShowSearch((prev) => !prev);


    const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      <div className="fixed z-10 bottom-6 left-1/2 transform -translate-x-1/2 bg-black border border-gray-300 rounded-full shadow-2xl py-2 px-5  flex items-center space-x-5 backdrop-blur-sm">
        {/* Home */}
        <button
          onClick={home}
          className="p-3 rounded-full hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 hover:scale-105"
          aria-label="Home"
        >
          <Home className="w-5 h-5 text-white hover:text-gray-300" />
        </button>

         <button onClick={handleRefresh} className="p-3 rounded-full hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 hover:scale-105" aria-label="Refresh">
          <RefreshCw className="w-5 h-5 text-white hover:text-gray-300" />
        </button>

        {/* Create */}
        <button
          onClick={handleCreatePost}
          className="p-3 rounded-full hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 hover:scale-105"
          aria-label="Create"
        >
          <Plus className="w-5 h-5 text-white hover:text-gray-300" />
        </button>

        {/* Search */}
        <button
          onClick={toggleSearch}
          className="p-3 rounded-full hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 hover:scale-105"
          aria-label="Search"
        >
          <Search className="w-5 h-5 text-white hover:text-gray-300" />
        </button>

        {/* Profile */}
        <button
          onClick={handleLogout}
          className="p-3 rounded-full hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 hover:scale-105"
          aria-label="Profile"
        >
          <User className="w-5 h-5 text-white hover:text-gray-300" />
        </button>
      </div>

      {showSearch && <SearchUser />}
    </>
  );
}
