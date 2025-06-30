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

  function getRandomPages(count: number, maxPage: number) {
    const pages = new Set<number>()
    while (pages.size < count) {
      const rand = Math.floor(Math.random() * maxPage) + 1
      pages.add(rand)
    }
    return Array.from(pages)
  }

  function nextVideo() {
    setCurrentIndex((idx) => (idx < videoUrls.length - 1 ? idx + 1 : idx))
  }

  function prevVideo() {
    setCurrentIndex((idx) => (idx > 0 ? idx - 1 : idx))
  }

  useEffect(() => {
    function onWheel(e: WheelEvent) {
      if (!videoUrls.length) return
      e.deltaY > 0 ? nextVideo() : prevVideo()
    }
    window.addEventListener('wheel', onWheel)
    return () => window.removeEventListener('wheel', onWheel)
  }, [videoUrls])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!videoUrls.length) return
      if (e.key === 'ArrowDown') nextVideo()
      else if (e.key === 'ArrowUp') prevVideo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [videoUrls])

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

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const currentUrl = videoUrls[currentIndex]

    container.innerHTML = ''

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
      iframe.style.height = '100vh'
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

  function switchSource(source: 'rumble' | 'odysee') {
    if (currentSource !== source) {
      setCurrentSource(source)
      setVideoUrls([])
      setCurrentIndex(0)
      setInfoText('')
    }
  }

  function buttonStyle(active: boolean): React.CSSProperties {
    return {
      width: 40,
      height: 40,
      borderRadius: 10,
      fontSize: 18,
      backgroundColor: active ? 'yellow' : 'rgba(255,255,255,0.1)',
      color: active ? 'black' : 'white',
      border: '1px solid white',
      cursor: 'pointer',
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#000',
        color: 'white',
        fontFamily: 'sans-serif',
        margin: 0,
        height: '100vh',
        width: '100vw',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Fullscreen Video Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100vh',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      ></div>

      {/* Right-side Floating Button Stack */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: 10,
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 10,
        }}
      >
        <button onClick={() => switchSource('rumble')} title="Rumble" style={buttonStyle(currentSource === 'rumble')}>
          ®️
        </button>
        <button onClick={() => switchSource('odysee')} title="Odysee" style={buttonStyle(currentSource === 'odysee')}>
          ©️
        </button>
        <button onClick={() => setAutoplay((a) => !a)} title="Autoplay" style={buttonStyle(false)}>
          ◉
        </button>
        <button onClick={loadVideos} disabled={loading} title="Load" style={buttonStyle(false)}>
          ▶
        </button>
      </div>

      {/* Info Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          width: '100%',
          textAlign: 'center',
          fontSize: 12,
          color: '#aaa',
          zIndex: 5,
        }}
      >
        {infoText}
      </div>
    </div>
  )
}
