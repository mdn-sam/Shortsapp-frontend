'use client'
import { useEffect, useState, useRef } from 'react'

const BACKENDS = {
  rumble: 'https://reelsapp-backend.onrender.com',
  odysee: 'https://reelsapp-2nd-backend.onrender.com',
}

export default function ReelsViewer() {
  const containerRef = useRef<HTMLDivElement>(null)

  const [videoUrls, setVideoUrls] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(false)
  const [currentSource, setCurrentSource] = useState<'rumble' | 'odysee'>('rumble')
  const [loading, setLoading] = useState(false)
  const [infoText, setInfoText] = useState('')

  // Load videos from backend
  async function loadVideos() {
    setLoading(true)
    setInfoText('')
    setVideoUrls([])

    try {
      if (currentSource === 'rumble') {
        const randomPages = getRandomPages(3, 94)
        setInfoText(`Loaded Rumble pages: ${randomPages.join(', ')}`)
        const urls = randomPages.map((num) => `https://reelsmunkey.com/page/${num}`)
        const encoded = encodeURIComponent(urls.join(','))
        const res = await fetch(`${BACKENDS.rumble}/scrape-multi?urls=${encoded}`)
        const data = await res.json()
        setVideoUrls(data.videos || [])
      } else {
        const page = Math.floor(Math.random() * 99) + 2
        setInfoText(`Loaded Odysee page: ${page}`)
        const encodedUrl = encodeURIComponent(`https://tik.sx/page/${page}`)
        const res = await fetch(`${BACKENDS.odysee}/scrape-odysee?url=${encodedUrl}`)
        const data = await res.json()
        setVideoUrls(data.videos || [])
      }
      setCurrentIndex(0)
    } catch (err) {
      setInfoText('Error loading videos.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Helper: random pages
  function getRandomPages(count: number, maxPage: number) {
    const pages = new Set<number>()
    while (pages.size < count) {
      const rand = Math.floor(Math.random() * maxPage) + 1
      pages.add(rand)
    }
    return Array.from(pages)
  }

  // Navigation helpers
  function nextVideo() {
    setCurrentIndex((idx) => (idx < videoUrls.length - 1 ? idx + 1 : idx))
  }
  function prevVideo() {
    setCurrentIndex((idx) => (idx > 0 ? idx - 1 : idx))
  }

  // Handle scroll (wheel)
  useEffect(() => {
    function onWheel(e: WheelEvent) {
      if (!videoUrls.length) return
      e.deltaY > 0 ? nextVideo() : prevVideo()
    }
    window.addEventListener('wheel', onWheel)
    return () => window.removeEventListener('wheel', onWheel)
  }, [videoUrls])

  // Handle keyboard
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!videoUrls.length) return
      if (e.key === 'ArrowDown') nextVideo()
      else if (e.key === 'ArrowUp') prevVideo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [videoUrls])

  // Handle swipe
  useEffect(() => {
    let touchStartY = 0
    let touchEndY = 0

    function onTouchStart(e: TouchEvent) {
      touchStartY = e.changedTouches[0].screenY
    }
    function onTouchEnd(e: TouchEvent) {
      touchEndY = e.changedTouches[0].screenY
      const deltaY = touchStartY - touchEndY
      if (!videoUrls.length) return
      if (deltaY > 50) nextVideo()
      else if (deltaY < -50) prevVideo()
    }

    document.addEventListener('touchstart', onTouchStart)
    document.addEventListener('touchend', onTouchEnd)

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [videoUrls])

  // Autoplay effect on video element
  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const currentUrl = videoUrls[currentIndex]

    container.innerHTML = '' // clear

    if (!currentUrl) return

    if (currentSource === 'rumble' && currentUrl.endsWith('.mp4')) {
      const video = document.createElement('video')
      video.src = currentUrl
      video.controls = true
      video.autoplay = true
      video.muted = false
      video.loop = false
      video.style.width = '100%'
      video.style.height = '100vh'
      video.style.objectFit = 'cover'

      if (autoplay) {
        video.addEventListener('ended', nextVideo)
      }
      container.appendChild(video)
    } else {
      const iframe = document.createElement('iframe')
      iframe.src = currentUrl
      iframe.width = '100%'
      iframe.style.height = '95vh'
      iframe.frameBorder = '0'
      iframe.allow = 'autoplay; fullscreen; picture-in-picture'
      iframe.allowFullscreen = true
      container.appendChild(iframe)

      if (autoplay) {
        setTimeout(() => {
          iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
        }, 1000)

        setTimeout(nextVideo, 30000)
      }
    }
  }, [currentIndex, videoUrls, autoplay, currentSource])

  // Toggle source handler
  function switchSource(source: 'rumble' | 'odysee') {
    if (currentSource !== source) {
      setCurrentSource(source)
      setVideoUrls([])
      setCurrentIndex(0)
      setInfoText('')
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#111',
        color: 'white',
        fontFamily: 'sans-serif',
        textAlign: 'center',
        margin: 0,
        minHeight: '100vh',
      }}
    >
      <h5>Reels Viewer</h5>

      <div
        ref={containerRef}
        className="video-container"
        style={{
          width: '100%',
          height: currentSource === 'rumble' ? '100vh' : '95vh',
          marginTop: 10,
          overflow: 'hidden',
          position: 'relative',
        }}
      ></div>  

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 10 }}>
        <button
          onClick={() => switchSource('rumble')}
          style={{
            fontWeight: '300',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: 6,
            backgroundColor: currentSource === 'rumble' ? 'yellow' : 'transparent',
            color: currentSource === 'rumble' ? 'black' : 'transparent',
            border: 'none',
          }}
        >
          Rumble
        </button>

        <button
          onClick={() => switchSource('odysee')}
          style={{
            fontWeight: '300',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: 6,
            backgroundColor: currentSource === 'odysee' ? 'yellow' : 'transparent',
            color: currentSource === 'odysee' ? 'black' : 'transparent',
            border: 'none',
          }}
        >
          Odysee
        </button>

        <button
          onClick={() => setAutoplay((a) => !a)}
          style={{
            fontWeight: '600',
            cursor: 'pointer',
            background: 'yellow',
            color: 'black',
            padding: '4px 6px',
            border: 'none',
            borderRadius: 6,
          }}
        >
          Autoplay: {autoplay ? 'On' : 'Off'}
        </button>
      </div>

      <button
        onClick={loadVideos}
        disabled={loading}
        style={{
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 10,
          padding: '6px 10px',
          fontSize: 8,
        }}
      >
        {loading ? 'Loading...' : `Load ${currentSource === 'rumble' ? 'Rumble' : 'Odysee'} Reels`}
      </button>

      <div className="info-bar" style={{ marginTop: 10, minHeight: 20 }}>
        {infoText}
      </div>
    </div>
  )
}
