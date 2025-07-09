import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Search, User, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { db, auth, followUser, unfollowUser, subscribeToFollowStatus } from '../firebase';

export default function SearchUser() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [followingStates, setFollowingStates] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!searchTerm) {
      setResults([]);
      setLoading(false);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'users'), 
          where('displayName', '>=', searchTerm), 
          where('displayName', '<=', searchTerm + '\uf8ff')
        );
        const snap = await getDocs(q);
        const matches = snap.docs
          .filter(doc => doc.id !== auth.currentUser?.uid)
          .map(doc => ({ id: doc.id, ...doc.data() }));
        
        setResults(matches);

        // Listen to follow status
        const unsubMap = {};
        matches.forEach(user => {
          unsubMap[user.id] = subscribeToFollowStatus(user.id, isFollowing => {
            setFollowingMap(prev => ({ ...prev, [user.id]: isFollowing }));
          });
        });

        return () => Object.values(unsubMap).forEach(unsub => unsub());
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleFollowToggle = async (uid) => {
    setFollowingStates(prev => ({ ...prev, [uid]: true }));
    try {
      if (followingMap[uid]) {
        await unfollowUser(uid);
      } else {
        await followUser(uid);
      }
    } catch (err) {
      console.error('Follow toggle failed:', err);
    } finally {
      setFollowingStates(prev => ({ ...prev, [uid]: false }));
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  return (
    <div className="fixed left-2 right-2 bottom-25 sm:bottom-5 sm:left-auto sm:right-5 sm:w-96 max-w-md mx-auto sm:mx-0 bg-white shadow-2xl rounded-xl border border-gray-100 z-50 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Results */}
      <div className="max-h-72 sm:max-h-96 overflow-y-auto">
        {loading && (
          <div className="flex justify-center items-center py-6 sm:py-8">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-gray-400" />
          </div>
        )}

        {!loading && searchTerm && results.length === 0 && (
          <div className="text-center py-8 sm:py-12 px-4">
            <User className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No users found</p>
            <p className="text-gray-400 text-xs mt-1">Try searching with a different name</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="divide-y divide-gray-100">
            {results.map((user, index) => (
              <div 
                key={user.id} 
                className="p-3 sm:p-4 hover:bg-gray-50 transition-colors duration-150 group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div 
                    className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm shrink-0">
                      {(user.displayName || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 group-hover:text-black transition-colors duration-150 truncate text-sm sm:text-base">
                        {user.displayName || 'Anonymous'}
                      </p>
                      <p className="text-gray-500 text-xs sm:text-sm truncate">
                        @{user.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleFollowToggle(user.id)}
                    disabled={followingStates[user.id]}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center space-x-1 sm:space-x-2 shrink-0 ${
                      followingMap[user.id]
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        : 'bg-black text-white hover:bg-gray-800 border border-black'
                    } ${followingStates[user.id] ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {followingStates[user.id] ? (
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    ) : followingMap[user.id] ? (
                      <>
                        <UserMinus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Follow</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!searchTerm && (
          <div className="text-center py-8 sm:py-12 px-4">
            <Search className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Start typing to search for users</p>
          </div>
        )}
      </div>
    </div>
  );
}