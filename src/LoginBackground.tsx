import { useEffect, useRef, useSyncExternalStore } from 'react'

const subscribeTheme = (notify: () => void) => {
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}
const getDarkTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches

function BackgroundVideo({ dark }: { dark: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const poster = dark ? '/videos/login-night-cover.jpg' : '/videos/login-beach-cover.jpg'
  const source = dark ? '/videos/login-night-smooth.mp4' : '/videos/login-beach-four.mp4'
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const resume = () => { void video.play().catch(() => { /* Poster remains visible if autoplay is blocked. */ }) }
    const onVisibility = () => { if (document.hidden) video.pause(); else resume() }
    document.addEventListener('visibilitychange', onVisibility)
    if (!document.hidden) resume()
    return () => { document.removeEventListener('visibilitychange', onVisibility); video.pause() }
  }, [])
  return <div className={`login-scene${dark ? ' dark' : ''}`} aria-hidden="true">
    <img className="login-cover" src={poster} alt="" />
    <video ref={videoRef} className="login-background-video" src={source} poster={poster} autoPlay loop muted playsInline preload="auto" disablePictureInPicture
      onPlaying={event => { event.currentTarget.dataset.ready = 'true' }}
      onError={event => { event.currentTarget.dataset.ready = 'false' }}
      onEnded={event => { const video = event.currentTarget; if (!document.hidden) { video.currentTime = 0; void video.play().catch(() => {}) } }} />
    <div className="login-shade" />
  </div>
}

export default function LoginBackground() {
  const dark = useSyncExternalStore(subscribeTheme, getDarkTheme)
  return <BackgroundVideo key={dark ? 'dark' : 'light'} dark={dark} />
}
