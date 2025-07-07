import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { fileToBase64 } from '../utils';
import { updateUserProfile } from '../firebase';
import { MoreVertical, LogOut, X } from 'lucide-react';

export default function EditProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
  });
  const [photoBase64, setPhotoBase64] = useState('');
  const [preview, setPreview] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (u) {
        setUser(u);
        const ref = doc(db, 'users', u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setForm({
            displayName: data.displayName || '',
            bio: data.bio || '',
            location: data.location || '',
            website: data.website || '',
          });
          setPreview(data.photoURL || '');
        }
      } else {
        await signInAnonymously(auth);
      }
    });
    return () => unsub();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFile = async e => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setPhotoBase64(base64);
      setPreview(base64);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const updates = {};
    Object.keys(form).forEach(k => {
      if (form[k] !== '') updates[k] = form[k];
    });
    if (photoBase64) updates.photoURL = photoBase64;
    await updateUserProfile(updates);
    navigate(-1);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login'); // or wherever you want to redirect after logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto py-8 bg-white min-h-screen">
      {/* Header with Menu */}
      <div className="flex justify-between items-center mb-6 relative">
        <h2 className="text-xl font-semibold text-black">Edit Profile</h2>
        
        {/* Three Dots Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-black" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              
              {/* Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-xl z-20">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center space-x-3 transition-colors rounded-lg"
                >
                  <LogOut className="w-4 h-4 text-black" />
                  <span className="text-black">Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-black mb-2">Profile Picture</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFile} 
            className="w-full border border-gray-300 rounded-lg p-2 bg-white text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-black file:text-white file:hover:bg-gray-800"
          />
          {preview && (
            <img
              src={preview}
              alt="preview"
              className="mt-3 w-24 h-24 rounded-full object-cover border-2 border-gray-300"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">Name</label>
          <input
            name="displayName"
            value={form.displayName}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 p-3 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">Location</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">Website</label>
          <input
            name="website"
            value={form.website}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}