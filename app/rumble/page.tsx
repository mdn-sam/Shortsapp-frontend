'use client'
import { useEffect, useState } from 'react'

const apiURL = 'https://reelsapp-backend.onrender.com/scrape-multi?urls=https://reelsmunkey.com/page/1'

export default function RumblePage() {
  const [videos, setVideos] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetch(apiURL)
      .then((res) => res.json())
      .then((data) => {
        const vids = data.videos || []
        setVideos(vids)
      })
      .catch((err) => {
        console.error(err)
        setVideos([])
      })
  }, [])

  const renderVideo = (url: string) => {
    if (url.endsWith('.mp4')) {
      return (
        <video key={url} src={url} controls autoPlay style={{ width: '100%', height: '80vh', marginTop: '20px' }} />
      )
    } else {
      return (
        <iframe
          key={url}
          src={url}
          allowFullScreen
          style={{ width: '100%', height: '80vh', marginTop: '20px' }}
        />
      )
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  return (
    <div style={{ margin: 0, backgroundColor: '#111', color: 'white', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h2 style={{ marginTop: 20 }}>Streaming Rumble Videos (Page 1)</h2>

      <div id="videoContainer">
        {videos.length > 0 ? (
          renderVideo(videos[currentIndex])
        ) : (
          <p style={{ marginTop: 50 }}>{videos.length === 0 ? 'Loading videos...' : 'No videos found.'}</p>
        )}
      </div>

      <div className="controls" style={{ marginTop: 20 }}>
        <button onClick={handlePrev} style={buttonStyle}>◀ Prev</button>
        <span id="counter" style={{ margin: '0 15px' }}>
          {videos.length > 0 ? `${currentIndex + 1} / ${videos.length}` : ''}
        </span>
        <button onClick={handleNext} style={buttonStyle}>Next ▶</button>
      </div>
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  margin: '0 10px',
  fontSize: '16px',
  cursor: 'pointer',
}
