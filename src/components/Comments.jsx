import { useEffect, useState } from 'react';
import { subscribeToComments, addComment } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { Send, MessageCircle, User } from 'lucide-react';

export default function Comments({ postId }) {
  const [comments, setComments] = useState([]);
  const [text, setText]       = useState('');
  const [profiles, setProfiles] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => subscribeToComments(postId, setComments), [postId]);

  useEffect(() => {
    comments.forEach(c => {
      if (c.uid && !profiles[c.uid]) {
        getDoc(doc(db, 'users', c.uid)).then(snap => {
          if (snap.exists()) {
            setProfiles(prev => ({
              ...prev,
              [c.uid]: snap.data()
            }));
          }
        })
        .catch(console.error);
      }
    });
  }, [comments, profiles]);

  const send = async e => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      await addComment(postId, text.trim());
      setText('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  const displayed = showAll
    ? [...comments].reverse()
    : comments.length > 0
      ? [comments[comments.length - 1]]
      : [];
  const hasMore   = comments.length > 1;

  const fmtTs = timestamp => {
    if (!timestamp) return 'just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((Date.now() - date) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
    return `${Math.floor(diff/1440)}d ago`;
  };

 return (
    <div className="space-y-4">
      {comments.length > 0 && (
        <div className="space-y-3">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {displayed.map(c => {
              const prof = profiles[c.uid] || {};
              const name = prof.displayName
                || (prof.email && prof.email.split('@')[0])
                || 'Anonymous';

              return (
                <Link
                  to={`/profile/${c.uid}`}
                  key={c.id}
                  className="block bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                      {prof.photoURL
                        ? <img src={prof.photoURL} alt={name} className="w-full h-full object-cover" />
                        : <User className="w-4 h-4 text-gray-600 m-auto" />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 text-sm">{name}</span>
                        <span className="text-xs text-gray-500">{fmtTs(c.createdAt)}</span>
                      </div>
                      <p className="text-gray-800 text-sm leading-relaxed break-words">
                        {c.text}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-gray-600 hover:text-black transition-colors font-medium"
            >
              {showAll ? 'Show less' : `Show all ${comments.length} comments`}
            </button>
          )}
        </div>
      )}

      {comments.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No comments yet. Be the first to comment!</p>
        </div>
      )}

      {/* comment input */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1 relative">
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none placeholder-gray-400"
              placeholder="Add a comment..."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={2}
              maxLength={500}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(e);
                }
              }}
            />
            <div className="absolute bottom-2 right-2 flex items-center space-x-2">
              <span className="text-xs text-gray-400">{text.length}/500</span>
              <button
                onClick={send}
                disabled={!text.trim() || loading}
                className="p-1 text-gray-400 hover:text-black disabled:cursor-not-allowed"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
