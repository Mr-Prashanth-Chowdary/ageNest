import { useEffect, useState } from "react";
import {
  auth,
  subscribeToPosts,
  likePost, unlikePost,
  subscribeToComments,
  subscribeToFollowing,
  subscribeToLikeStatus,
  subscribeToLikesCount,
  deletePost,
  sharePost,
} from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Comments from "./Comments";
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share, MoreHorizontal, Trash2 } from "lucide-react";

export default function PostsFeed() {
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});    // { [uid]: { displayName, photoURL } }
  const [following, setFollowing] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [liked, setLiked] = useState({});
  const [likesCount, setLikesCount] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);

  // track auth user
  useEffect(() => auth.onAuthStateChanged(u => setMe(u)), []);

  // subscribe to posts
  useEffect(() => {
    return subscribeToPosts(fetched => {
      setPosts(fetched);
      setLoading(false);
    });
  }, []);

    // 2. subscribe to who I follow
  useEffect(() => {
    if (!me) return;
    return subscribeToFollowing(me.uid, setFollowing);
  }, [me]);


  // fetch any missing user-profiles
  useEffect(() => {
    const missing = posts
      .map(p => p.uid)
      .filter(uid => uid && !profiles[uid]);

    missing.forEach(uid => {
      getDoc(doc(db, 'users', uid))
        .then(snap => {
          if (snap.exists()) {
            const { displayName, photoURL, age } = snap.data();
            setProfiles(prev => ({ ...prev, [uid]: { displayName, photoURL,age} }));
          }
        })
        .catch(console.error);
    });
  }, [posts, profiles]);

  // likes count + status
  useEffect(() => {
    const unsubs = [];
    posts.forEach(p => {
      
      unsubs.push(
        subscribeToLikesCount(p.id, cnt => setLikesCount(c => ({ ...c, [p.id]: cnt }))),
        subscribeToLikeStatus(p.id, ex => setLiked(s => ({ ...s, [p.id]: ex }))),
        subscribeToComments(p.id, cmts => setCommentCounts(c => ({ ...c, [p.id]: cmts.length })))
      );
    });
    return () => unsubs.forEach(unsub => unsub());
  }, [posts]);

  // dropdown outside click
  useEffect(() => {
    const handler = e => {
      if (!e.target.closest('.dropdown-container')) setOpenDropdown(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const formatDate = ts => {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("en-IN", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const handleDeletePost = async id => {
    if (!confirm('Delete this post?')) return;
    try { await deletePost(id); setOpenDropdown(null); }
    catch (e) { console.error(e); }
  };

  if (loading) {
    return <div className="min-h-screen bg-black p-4">…loading skeleton…</div>;
  }


   // 5. helper to figure my age bucket
  const getBucket = age => {
    if (age < 10)    return [1,10];
    if (age < 20)   return [10,20];
    if (age < 30)   return [20,30];
    if (age < 40)   return [30,40];
    if (age < 50)   return [40,50];
    if (age < 60)   return [50,60];
    if (age < 70)   return [60,70];
    if (age < 80)   return [70,80];
    if (age < 90)   return [80,90];
    return [0,100]; // fallback
  };

  // 6. compute filtered list
  const myAge = profiles[me?.uid]?.age;
  const [minA, maxA] = getBucket(myAge);
 const filteredPosts = posts.filter(p => {
  return p.uid === me?.uid ||  
         following.includes(p.uid) ||
         (profiles[p.uid]?.age >= minA && profiles[p.uid]?.age < maxA);
});


  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Feed</h1>
          <p className="text-gray-400 mt-2">Latest posts from the community</p>
        </header>

        {posts.length === 0
          ? <div className="…no-posts message…"/>
          : (
            <div className="space-y-6">
              {filteredPosts.map(p => {
                const prof = profiles[p.uid] || {};
                const name = prof.displayName || p.author || 'Anonymous';
                return (
                  <article key={p.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    {/* Header */}
                    <div className="p-6 pb-4 flex items-start justify-between">
                      <Link to={`/profile/${p.uid}`} className="flex items-center space-x-3 no-underline">
                        {/* Avatar */}
                        {prof.photoURL
                          ? <img src={prof.photoURL} alt={name}
                              className="w-10 h-10 rounded-full object-cover" />
                          : <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-medium text-sm">
                                {p.uid.charAt(0).toUpperCase()}
                              </span>
                            </div>
                        }

                        {/* Name + date */}
                        <div>
                          <h3 className="font-semibold text-gray-900">{name}</h3>
                          <p className="text-sm text-gray-500">{formatDate(p.createdAt)}</p>
                        </div>
                      </Link>

                      {/* delete menu */}
                      {me?.uid === p.uid && (
                        <div className="relative dropdown-container">
                          <button onClick={() => setOpenDropdown(p.id)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                          {openDropdown===p.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                              <button onClick={() => handleDeletePost(p.id)}
                                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                <Trash2 className="w-4 h-4 mr-2"/> Delete Post
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="px-6 pb-4">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{p.text}</p>
                    </div>

                    {/* Images */}
                    {p.images?.length > 0 && (
                      <div className="px-6 pb-4 grid gap-2">
                        {p.images.map((img, i) => (
                          <img key={i} src={img} alt="" className="w-full h-auto rounded-lg object-cover max-h-96"/>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="px-6 pb-4 border-t border-gray-100">
                      <div className="flex items-center space-x-6 pt-4">
                        <button onClick={() => liked[p.id] ? unlikePost(p.id) : likePost(p.id)}
                                className="flex items-center space-x-2">
                          <Heart className={`w-5 h-5 ${liked[p.id] ? 'text-red-500 fill-current' : 'text-gray-500'}`}/>
                          <span className="text-sm font-medium">{likesCount[p.id]||0}</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                          <MessageCircle className="w-5 h-5"/>
                          <span className="text-sm font-medium">{commentCounts[p.id]||0}</span>
                        </button>
                        <button onClick={()=>sharePost(p.id)} className="flex items-center space-x-2 text-gray-500 hover:text-green-500">
                          <Share className="w-5 h-5"/>
                          <span className="text-sm font-medium">Share</span>
                        </button>
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="px-6 pb-6">
                      <Comments postId={p.id}/>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}
