import { useState } from 'react'
import { createPost, createStory } from '../firebase'
import { Image, X, Send, Loader2, Plus } from 'lucide-react'

export default function PostCreator() {
  const [mode, setMode] = useState('post')
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const fileToBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleFiles = e => {
    const selected = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
    setFiles(mode === 'story' ? selected.slice(0, 1) : selected)
    setErr('')
  }

  const handleDrag = e => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = e => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    setFiles(mode === 'story' ? dropped.slice(0, 1) : dropped)
    setErr('')
  }

  const removeFile = i => setFiles(files.filter((_, idx) => idx !== i))

  const submit = async e => {
    e.preventDefault()
    if (mode === 'post' && !text.trim() && files.length === 0) {
      setErr('Add text or a photo')
      return
    }
    if (mode === 'story' && files.length === 0) {
      setErr('Select one image for your story')
      return
    }
    setLoading(true)
    setErr('')
    try {
      if (mode === 'post') {
        const images = await Promise.all(files.map(f => fileToBase64(f)))
        await createPost({ text: text.trim(), images })
        setText('')
        setFiles([])
      } else {
        const [base64] = await Promise.all(files.map(f => fileToBase64(f)))
        await createStory(base64)
        setFiles([])
      }
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Create Content</h1>
          <p className="text-gray-600">Share your thoughts or create a story</p>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8">
          {/* Mode Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === 'post' 
                  ? 'bg-black text-white shadow-sm' 
                  : 'text-gray-600 hover:text-black hover:bg-gray-50'
              }`}
              onClick={() => setMode('post')}
            >
              Post
            </button>
            <button
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === 'story' 
                  ? 'bg-black text-white shadow-sm' 
                  : 'text-gray-600 hover:text-black hover:bg-gray-50'
              }`}
              onClick={() => setMode('story')}
            >
              Story
            </button>
          </div>

          {/* Text Area (Post Mode Only) */}
          {mode === 'post' && (
            <div className="mb-6">
              <textarea
                className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="What's on your mind?"
                value={text}
                onChange={e => setText(e.target.value)}
                rows={4}
                maxLength={2000}
              />
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>Share your thoughts...</span>
                <span>{text.length}/2000</span>
              </div>
            </div>
          )}

          {/* File Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 mb-6 transition-all duration-200 ${
              dragActive 
                ? 'border-black bg-gray-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              multiple={mode === 'post'}
              onChange={handleFiles}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                {mode === 'post'
                  ? 'Choose images or drag and drop'
                  : 'Choose one image for your story'}
              </p>
              <p className="text-xs text-gray-500">
                {mode === 'post' 
                  ? 'PNG, JPG, GIF up to 10MB each' 
                  : 'PNG, JPG, GIF up to 10MB'}
              </p>
            </div>
          </div>

          {/* File Preview Grid */}
          {files.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {files.map((file, idx) => (
                  <div key={idx} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <img 
                        src={URL.createObjectURL(file)} 
                        className="w-full h-full object-cover" 
                        alt={`Upload ${idx + 1}`}
                      />
                    </div>
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {err && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{err}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={submit}
            disabled={loading || (mode === 'post' && !text.trim() && files.length === 0) || (mode === 'story' && files.length === 0)}
            className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'post' ? (
              <Send className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>{loading ? 'Publishing...' : mode === 'post' ? 'Publish Post' : 'Add Story'}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          <p>Share responsibly and follow community guidelines</p>
        </div>
      </div>
    </div>
  )
}