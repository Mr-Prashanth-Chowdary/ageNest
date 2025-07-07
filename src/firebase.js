import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword,setPersistence,browserLocalPersistence } from 'firebase/auth'
import { getFirestore, doc, setDoc, deleteDoc, collection,updateDoc,
  onSnapshot, serverTimestamp, addDoc, query, orderBy,where, Timestamp } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
    apiKey: "AIzaSyC2PzD_CkwxijYWBbzGz1ArG2r3mSCjIIk",
  authDomain: "agenest-26d96.firebaseapp.com",
  projectId: "agenest-26d96",
  storageBucket: "agenest-26d96.firebasestorage.app",
  messagingSenderId: "191575603093",
  appId: "1:191575603093:web:7431ce2fc3443af9ede89c",
  measurementId: "G-8K5Q52VN3Q"
}

const app = initializeApp(firebaseConfig)
export const analytics = getAnalytics(app)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

setPersistence(auth, browserLocalPersistence)
  .catch(err => console.error("Auth persistence failed:", err));


const createUserProfile = async (user, age) => {
  const userRef = doc(db, 'users', user.uid)
  if (!(await getDoc(userRef)).exists()) {
    await setDoc(userRef, { age, createdAt: serverTimestamp() })
  }
}

export const signUpAnonymous = async age => {
  const { user } = await signInAnonymously(auth)
  await createUserProfile(user, age)
  return user
}

export const signUpWithEmail = async (email, password, age) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await createUserProfile(user, age)
  return user
}

export const logInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

export const uploadImage = async file => {
  const user = auth.currentUser
  const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${file.name}`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export const createPost = async ({ text, images }) => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')

  return addDoc(collection(db, 'posts'), {
    uid:       user.uid,
    text,
    images,   // array of Base64 data-URLs coming from the client
    likes:     0,              
    createdAt: serverTimestamp()
    
  })
}

export const deletePost = async postId => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  // only owner should call this, but extra check:
  const postRef = doc(db, 'posts', postId)
  await deleteDoc(postRef)
}

export const subscribeToPosts = callback => {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => {
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(posts)
  })
}

export const addComment = async (postId, text) => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  return addDoc(collection(db, 'posts', postId, 'comments'), {
    uid: user.uid,
    text,
    createdAt: Date.now()
  })
}

export const subscribeToComments = (postId, callback) => {
  const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'))
  return onSnapshot(q, snap => {
    const comments = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(comments)
  })
}


export const followUser = async targetUid => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  await setDoc(doc(db, 'users', user.uid, 'following', targetUid), { createdAt: serverTimestamp() })
  await setDoc(doc(db, 'users', targetUid, 'followers', user.uid), { createdAt: serverTimestamp() })
}

export const unfollowUser = async targetUid => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  await deleteDoc(doc(db, 'users', user.uid, 'following', targetUid))
  await deleteDoc(doc(db, 'users', targetUid, 'followers', user.uid))
}

export const subscribeToFollowStatus = (targetUid, callback) => {
  const user = auth.currentUser
  if (!user) return () => {}
  const docRef = doc(db, 'users', user.uid, 'following', targetUid)
  return onSnapshot(docRef, snap => callback(snap.exists()))
}

export const subscribeToFollowers = (userId, callback) => {
  const q = query(collection(db, 'users', userId, 'followers'), orderBy('createdAt', 'asc'))
  return onSnapshot(q, snap => {
    const followers = snap.docs.map(d => d.id)
    callback(followers)
  })
}

export const subscribeToFollowing = (userId, callback) => {
  const q = query(collection(db, 'users', userId, 'following'), orderBy('createdAt', 'asc'))
  return onSnapshot(q, snap => {
    const following = snap.docs.map(d => d.id)
    callback(following)
  })
}


// Save/un-save (bookmark) a post
export const savePost = async postId => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  await setDoc(
    doc(db, 'users', user.uid, 'savedPosts', postId),
    { createdAt: serverTimestamp() }
  );
};

export const unsavePost = async postId => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  await deleteDoc(doc(db, 'users', user.uid, 'savedPosts', postId));
};

// Subscribe to saved status for a single post
export const subscribeToSavedStatus = (postId, callback) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const docRef = doc(db, 'users', user.uid, 'savedPosts', postId);
  return onSnapshot(docRef, snap => callback(snap.exists()));
};

// Optional: web-share helper (falls back to copying link)
export const sharePost = async postId => {
  const url = `${window.location.origin}/posts/${postId}`;
  if (navigator.share) {
    await navigator.share({ title: 'Check out this post', url });
  } else {
    await navigator.clipboard.writeText(url);
    alert('Link copied to clipboard');
  }
};

// like
export const likePost = async postId => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  await setDoc(
    doc(db, 'posts', postId, 'likes', user.uid),
    { createdAt: serverTimestamp() }
  )
}

// unlike
export const unlikePost = async postId => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  await deleteDoc(doc(db, 'posts', postId, 'likes', user.uid))
}

// subscribe to whether current user has liked
export const subscribeToLikeStatus = (postId, callback) => {
  const user = auth.currentUser
  if (!user) return () => {}
  const likeRef = doc(db, 'posts', postId, 'likes', user.uid)
  return onSnapshot(likeRef, snap => callback(snap.exists()))
}

// subscribe to total likes count
export const subscribeToLikesCount = (postId, callback) => {
  const likesCol = collection(db, 'posts', postId, 'likes')
  return onSnapshot(likesCol, snap => callback(snap.size))
}

export async function updateUserProfile(updates) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const userRef = doc(db, 'users', user.uid);

  try {
    await updateDoc(userRef, updates);
  } catch (e) {
    if (e.code === 'not-found') {
      // if the doc wasn't there, create it
      await setDoc(userRef, updates);
    } else {
      throw e;
    }
  }
}

export const createStory = async (base64Image) => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')

  return addDoc(collection(db, 'stories'), {
    uid:       user.uid,
    image:     base64Image,
    createdAt: serverTimestamp()
  })
}

export const subscribeToStories = (userIds, callback) => {
  // only filter by UID; we'll handle timestamps & ordering locally
  const q = query(
    collection(db, 'stories'),
    where('uid', 'in', userIds)
  )

  return onSnapshot(q, (snap) => {
    const cutoffTs = Date.now() - 24 * 3600 * 1000
    const groups = {}

    snap.docs.forEach(docSnap => {
      const data = docSnap.data()
      // client-side drop anything older than 24 h
      if (!data.createdAt || data.createdAt.toDate().getTime() < cutoffTs) return

      const uid = data.uid
      groups[uid] = groups[uid] || []
      groups[uid].push({ id: docSnap.id, ...data })
    })

    // sort each user's stories newest→oldest
    Object.values(groups).forEach(list =>
      list.sort((a, b) =>
        b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
      )
    )

    // build a new object with keys in userIds order
    const ordered = {}
    userIds.forEach(uid => {
      if (groups[uid]) ordered[uid] = groups[uid]
    })

    callback(ordered)
  })
}