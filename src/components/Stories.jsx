import { useState, useEffect } from 'react'
import { subscribeToFollowing } from '../firebase'
import { subscribeToStories } from '../firebase'
import { auth } from "../firebase";
import { X, ChevronRight, ChevronLeft, Plus } from 'lucide-react'

export default function Stories() {
  const [following, setFollowing] = useState([])
  const [stories, setStories] = useState({})
  const [currentUser, setCurrentUser] = useState(null)
  const [viewing, setViewing] = useState(null) // { uid, index }
  const [storyProgress, setStoryProgress] = useState(0)

  useEffect(() => {
    const unsubF = subscribeToFollowing(auth.currentUser.uid, setFollowing)
    return () => unsubF()
  }, [])

  useEffect(() => {
    const unsubS = subscribeToStories([auth.currentUser.uid, ...following], setStories)
    return () => unsubS()
  }, [following])

  // Auto-progress story every 5 seconds
  useEffect(() => {
    if (!viewing) return

    const timer = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          handleNext()
          return 0
        }
        return prev + 2
      })
    }, 100)

    return () => clearInterval(timer)
  }, [viewing])

  // Reset progress when viewing changes
  useEffect(() => {
    setStoryProgress(0)
  }, [viewing])

  if (!Object.keys(stories).length) return null

  const handleNext = () => {
    if (!viewing) return
    
    const currentStories = stories[viewing.uid]
    const next = viewing.index + 1
    
    if (next < currentStories.length) {
      setViewing({ ...viewing, index: next })
    } else {
      // Move to next user's stories or close
      const userIds = Object.keys(stories)
      const currentUserIndex = userIds.indexOf(viewing.uid)
      const nextUserIndex = currentUserIndex + 1
      
      if (nextUserIndex < userIds.length) {
        setViewing({ uid: userIds[nextUserIndex], index: 0 })
      } else {
        setViewing(null)
      }
    }
  }

  const handlePrev = () => {
    if (!viewing) return
    
    const prev = viewing.index - 1
    if (prev >= 0) {
      setViewing({ ...viewing, index: prev })
    } else {
      // Move to previous user's last story
      const userIds = Object.keys(stories)
      const currentUserIndex = userIds.indexOf(viewing.uid)
      const prevUserIndex = currentUserIndex - 1
      
      if (prevUserIndex >= 0) {
        const prevUserId = userIds[prevUserIndex]
        setViewing({ uid: prevUserId, index: stories[prevUserId].length - 1 })
      }
    }
  }

  const handleStoryClick = (uid, index) => {
    setViewing({ uid, index })
  }

  const handleViewerClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const centerX = rect.width / 2
    
    if (clickX < centerX) {
      handlePrev()
    } else {
      handleNext()
    }
  }

  // Sort stories to show current user first, then following users
  const sortedStories = Object.entries(stories).sort(([uidA], [uidB]) => {
    const currentUserId = auth.currentUser.uid
    if (uidA === currentUserId) return -1
    if (uidB === currentUserId) return 1
    return 0
  })

  return (
    <>
      {/* Stories Row */}
      <div className="w-full bg-black">
      <div className="w-full max-w-7xl pt-2 mx-auto px-4 sm:px-6 lg:px-8 bg-black">
        <div className="relative">
          {/* Gradient fade on edges for large screens */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none hidden lg:block"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none hidden lg:block"></div>
          
          <div className="flex space-x-3 sm:space-x-4 lg:space-x-6 overflow-x-auto py-4 px-2 scrollbar-hide">
            {/* Add Story Button (for current user) */}
            {!stories[auth.currentUser.uid] && (
            <button className="flex-shrink-0 flex flex-col items-center space-y-1 sm:space-y-2 group">
                <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
                </div>
                </div>
                <span className="text-xs sm:text-sm text-gray-300 font-medium">Your Story</span>
            </button>
            )}

            {/* Stories */}
            {sortedStories.map(([uid, userStories]) => (
              <button 
                key={uid}
                onClick={() => handleStoryClick(uid, 0)}
                className="flex-shrink-0 flex flex-col items-center space-y-1 sm:space-y-2 group"
              >
                <div className="relative">
                  {/* Black border for unviewed stories */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-black p-0.5 group-hover:scale-105 transition-transform duration-200">
                    <div className="w-full h-full rounded-full bg-white p-0.5">
                      <img 
                        src={userStories[0].image || userStories[0].url} 
                        alt="Story"
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* Current user indicator */}
                  {uid === auth.currentUser.uid && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-black rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                  
                  {/* Story count indicator */}
                  {userStories.length > 1 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-black rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-xs sm:text-sm text-white font-bold">{userStories.length}</span>
                    </div>
                  )}
                </div>
                <span className="text-xs sm:text-sm text-gray-300 font-medium max-w-16 sm:max-w-20 lg:max-w-24 truncate">
                  {uid === auth.currentUser.uid ? 'You' : `User ${uid.slice(-1)}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Story Viewer */}
      {viewing && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          {/* Close Button */}
          <button 
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white hover:text-gray-300 transition-colors z-30 p-2 rounded-full hover:bg-white/10"
            onClick={() => setViewing(null)}
            type="button"
          >
            <X size={24} className="sm:w-8 sm:h-8" />
          </button>

          {/* Progress Bars */}
          <div className="absolute top-4 left-4 right-16 sm:top-6 sm:left-6 sm:right-20 flex space-x-1 z-20">
            {stories[viewing.uid].map((_, index) => (
              <div
                key={index}
                className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
              >
                <div
                  className={`h-full bg-white transition-all duration-300 ${
                    index < viewing.index ? 'w-full' : 
                    index === viewing.index ? `w-[${storyProgress}%]` : 'w-0'
                  }`}
                  style={index === viewing.index ? { width: `${storyProgress}%` } : {}}
                />
              </div>
            ))}
          </div>

          {/* User Info */}
          <div className="absolute top-14 left-4 sm:top-16 sm:left-6 flex items-center space-x-3 z-20">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black p-0.5">
              <div className="w-full h-full rounded-full bg-white p-0.5">
                <img 
                  src={stories[viewing.uid][0].image || stories[viewing.uid][0].url} 
                  alt="User"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <div className="text-white">
              <p className="font-semibold text-sm sm:text-base">
                {viewing.uid === auth.currentUser.uid ? 'Your Story' : `User ${viewing.uid.slice(-1)}`}
              </p>
              <p className="text-xs sm:text-sm text-gray-300">
                {stories[viewing.uid][viewing.index].timestamp ? 
                  `${Math.floor((Date.now() - stories[viewing.uid][viewing.index].timestamp) / 3600000)}h ago` : 
                  'Recently'
                }
              </p>
            </div>
          </div>

          {/* Navigation Buttons - Hidden on mobile, visible on larger screens */}
          <div className="hidden sm:flex absolute inset-y-0 left-0 items-center pl-4 z-10">
            {(viewing.index > 0 || Object.keys(stories).indexOf(viewing.uid) > 0) && (
              <button
                className="text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white/10"
                onClick={handlePrev}
              >
                <ChevronLeft size={40} />
              </button>
            )}
          </div>

          <div className="hidden sm:flex absolute inset-y-0 right-0 items-center pr-4 z-20">
            <button
              className="text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white/10"
              onClick={handleNext}
            >
              <ChevronRight size={40} />
            </button>
          </div>

          {/* Story Content */}
          <div className="relative max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl max-h-full mx-4">
            <img
              src={stories[viewing.uid][viewing.index].image || stories[viewing.uid][viewing.index].url}
              alt="Story"
              className="w-full h-full max-h-[80vh] sm:max-h-[85vh] object-contain rounded-lg sm:rounded-xl"
            />
          </div>

          {/* Click Areas for Navigation */}
          <div 
            className="absolute inset-0 flex cursor-pointer z-10"
            onClick={handleViewerClick}
          >
            {/* Left half - Previous */}
            <div className="w-1/2 h-full" />
            {/* Right half - Next */}
            <div className="w-1/2 h-full" />
          </div>

          {/* Mobile Navigation Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4 sm:hidden z-20">
            <div className="text-white/70 text-sm">Tap left/right to navigate</div>
          </div>
        </div>
        
      )}
      </div>
    </>
  )
}