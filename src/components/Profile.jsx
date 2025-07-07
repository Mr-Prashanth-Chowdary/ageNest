import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Calendar,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  Settings,
  UserPlus,
  UserMinus,
  LogOut
} from 'lucide-react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import {
  subscribeToPosts,
  subscribeToFollowers,
  subscribeToFollowing,
  subscribeToFollowStatus,
  followUser,
  unfollowUser,
  subscribeToLikeStatus,
  subscribeToLikesCount,
  likePost,
  unlikePost,
  savePost,
  sharePost
} from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useParams } from 'react-router-dom'

export default function UserProfile({isOwnProfile = true }) {
  const { uid } = useParams()
  const viewedUserId = isOwnProfile ? undefined : uid
  
  // State hooks
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const [activeTab, setActiveTab] = useState('posts');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Ref for dropdown
  const dropdownRef = useRef(null);

  // 1. Auth (auto-anonymous)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async user => {
      if (user) setAuthUser(user);
      else {
        try { await signInAnonymously(auth); }
        catch (e) { console.error('Anonymous sign-in failed:', e); }
      }
    });
    return () => unsubAuth();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Derive target ID
  const targetId = isOwnProfile || !viewedUserId ? authUser?.uid : viewedUserId;

  // 2. Profile data
  useEffect(() => {
    if (!targetId) return;
    const ref = doc(db, 'users', targetId);
    const unsub = onSnapshot(ref,
      snap => { if (snap.exists()) setProfile(snap.data()); },
      err => console.error('Profile snapshot error:', err)
    );
    return () => unsub();
  }, [targetId]);

  // 3. Posts, followers, following, follow status
  useEffect(() => {
    if (!targetId) return;
    const unsubPosts = subscribeToPosts(all => setPosts(all.filter(p => p.uid === targetId)));
    const unsubF = subscribeToFollowers(targetId, setFollowers);
    const unsubG = subscribeToFollowing(targetId, setFollowing);
    const unsubStatus = !isOwnProfile
      ? subscribeToFollowStatus(targetId, setIsFollowing)
      : () => {};
    return () => { unsubPosts(); unsubF(); unsubG(); unsubStatus(); };
  }, [targetId, isOwnProfile]);

  // 4. Likes per post
  useEffect(() => {
    if (!authUser) return;
    const unsubs = posts.map(post => {
      const u1 = subscribeToLikeStatus(post.id, liked => {
        setLikedPosts(prev => {
          const s = new Set(prev);
          liked ? s.add(post.id) : s.delete(post.id);
          return s;
        });
      });
      const u2 = subscribeToLikesCount(post.id, count => {
        setLikeCounts(prev => ({ ...prev, [post.id]: count }));
      });
      return () => { u1(); u2(); };
    });
    return () => unsubs.forEach(fn => fn());
  }, [authUser, posts]);


  const shareProfile = () => {
  const shareData = {
    title: profile.displayName || 'Profile',
    text: `Check out ${profile.displayName || 'this user'} on AgeNest`,
    url: window.location.href
  };
  if (navigator.share) {
    navigator.share(shareData).catch(err => console.error('Share failed:', err));
  } else {
    // fallback: copy URL to clipboard
    navigator.clipboard.writeText(shareData.url)
      .then(() => alert('Profile link copied to clipboard'))
      .catch(err => console.error('Copy failed:', err));
  }
};


  // Show loading until authUser is set
  if (authUser === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Action handlers
  const handleFollow = async () => {
    try {
      if (isFollowing) await unfollowUser(targetId);
      else await followUser(targetId);
    } catch (err) {
      console.error('Follow/unfollow error:', err);
    }
  };
  
  const handleLike = id => {
    if (likedPosts.has(id)) unlikePost(id).catch(e => console.error(e));
    else likePost(id).catch(e => console.error(e));
  };
  
  const handleSave = id => savePost(id).catch(e => console.error(e));
  const handleShare = id => sharePost(id).catch(e => console.error(e));

  // Logout handler
  const handleLogout = async () => {
    try {
      await auth.signOut();
      setShowDropdown(false);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Formatters
  const fmtDate = ts => {
    if (!ts) return '';
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleDateString();
  };
  const fmtJoin = ts => ts?.seconds
    ? new Date(ts.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '';

  // Default profile picture component
  const DefaultAvatar = ({ size = "w-10 h-10" }) => (
    <div className={`${size} rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0`}>
      <User size={size.includes('32') ? 40 : 24} className="text-gray-400" />
    </div>
  );




  // Post card
  const PostCard = ({ post }) => (
    <div className="bg-white rounded-lg shadow-md mb-4 sm:mb-6 overflow-hidden">
      <div className="p-3 sm:p-4">
        <div className="flex items-start space-x-3">
          {profile.photoURL || authUser.photoURL ? (
            <img 
              src={profile.photoURL || authUser.photoURL} 
              alt="avatar" 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <DefaultAvatar />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {profile.displayName || authUser.displayName || 'Anonymous'}
              </h3>
              <span className="text-gray-500 text-xs sm:text-sm">• {fmtDate(post.createdAt)}</span>
            </div>
            <p className="text-gray-700 mt-1 sm:mt-2 text-sm sm:text-base">{post.text}</p>
          </div>
        </div>
      </div>
      
      {post.images?.length > 0 && (
        <div className={`grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.images.map((img, i) => (
            <img 
              key={i} 
              src={img} 
              alt="media" 
              className="w-full h-48 sm:h-64 object-cover" 
            />
          ))}
        </div>
      )}
      
      <div className="p-3 sm:p-4 border-t">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4 sm:space-x-6">
            <button 
              onClick={() => handleLike(post.id)} 
              className={`flex items-center space-x-1 sm:space-x-2 ${
                likedPosts.has(post.id) ? 'text-red-500' : 'text-gray-500'
              } hover:text-red-500 transition-colors`}
            >
              <Heart 
                size={18} 
                fill={likedPosts.has(post.id) ? 'currentColor' : 'none'} 
              />
              <span className="text-xs sm:text-sm">{likeCounts[post.id] || 0}</span>
            </button>
            <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
              <MessageCircle size={18} />
              <span className="text-xs sm:text-sm">5</span>
            </button>
          </div>
          <div className="flex space-x-3 sm:space-x-4">
            <button 
              onClick={() => handleSave(post.id)} 
              className="text-gray-500 hover:text-blue-500 transition-colors"
            >
              <Bookmark size={18} />
            </button>
            <button 
              onClick={() => handleShare(post.id)} 
              className="text-gray-500 hover:text-blue-500 transition-colors"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0">
            {/* Profile Picture */}
            <div className="flex justify-center sm:justify-start">
              {profile.photoURL || authUser.photoURL ? (
                <img 
                  src={profile.photoURL || authUser.photoURL} 
                  alt="avatar" 
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-gray-200 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (<DefaultAvatar size="w-24 h-24 sm:w-32 sm:h-32" />)}
            </div>
            
            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-3 sm:space-y-0">
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {profile.displayName || authUser.displayName || 'Anonymous'}
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base">
                    @{(authUser.email || '').split('@')[0] || 'anon'}
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-center sm:justify-end space-x-2 sm:space-x-3">
                  {isOwnProfile ? (
                    <Link
                     to="/edit-profile"
                     className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base">
                      <Settings size={18} />
                      <span className="hidden sm:inline">Edit Profile</span>
                    </Link>
                  ) : (
                    <button 
                      onClick={handleFollow} 
                      className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                        isFollowing
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isFollowing ? <UserMinus size={18} /> : <UserPlus size={18} />}
                      <span>{isFollowing ? 'Following' : 'Follow'}</span>
                    </button>
                  )}
                  
                  {/* Dropdown Menu */}
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={toggleDropdown}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    
                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <div className="py-1">
                            {isOwnProfile ? (
                            <button
                              onClick={handleLogout}
                              className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <LogOut size={16} />
                              <span>Logout</span>
                            </button>
                          ) : (
                            <button
                              onClick={shareProfile}
                              className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <Share2 size={16} />
                              <span>Share Profile</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-700 mb-4 text-sm sm:text-base text-center sm:text-left">
                  {profile.bio}
                </p>
              )}
              
              {/* Metadata */}
              <div className="flex flex-wrap justify-center sm:justify-start items-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-gray-600 mb-4">
                {profile.location && (
                  <span className="flex items-center space-x-1">
                    <span>📍</span>
                    <span>{profile.location}</span>
                  </span>
                )}
                {profile.website && (
                  <a 
                    href={`https://${profile.website}`} 
                    className="flex items-center space-x-1 text-blue-600 hover:underline"
                  >
                    <span>🔗</span>
                    <span>{profile.website}</span>
                  </a>
                )}
                {profile.createdAt && (
                  <span className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>Joined {fmtJoin(profile.createdAt)}</span>
                  </span>
                )}
              </div>
              
              {/* Stats */}
              <div className="flex justify-center sm:justify-start space-x-6 text-sm sm:text-base">
                <button className="hover:underline">
                  <span className="font-semibold">{following.length}</span>
                  <span className="text-gray-600 ml-1">Following</span>
                </button>
                <button className="hover:underline">
                  <span className="font-semibold">{followers.length}</span>
                  <span className="text-gray-600 ml-1">Followers</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-4 sm:mb-6">
          <nav className="flex border-b">
            {['posts', 'media', 'likes'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`flex-1 sm:flex-none sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
                {tab === 'posts' && (
                  <span className="ml-1 text-xs sm:text-sm">({posts.length})</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'posts' && (
            <div>
              {posts.length ? (
                posts.map(p => <PostCard key={p.id} post={p} />)
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <User size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-500 text-sm sm:text-base">
                    {isOwnProfile 
                      ? "You haven't posted anything yet. Share your first post!" 
                      : "This user hasn't posted anything yet."}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'media' && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              {posts.some(p => p.images?.length) ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  {posts.flatMap(p => p.images || []).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt="media"
                      className="w-full h-24 sm:h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No media yet</h3>
                  <p className="text-gray-500 text-sm sm:text-base">Media posts will appear here</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'likes' && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Heart size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No likes yet</h3>
              <p className="text-gray-500 text-sm sm:text-base">Liked posts will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}