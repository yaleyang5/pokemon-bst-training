import { useEffect, useRef, useState } from 'react'

type Props = {
  /** Cry audio url (PokéAPI `cries.latest`), or null if unavailable. */
  src: string | null | undefined
  /** Play once automatically the first time a url becomes available. */
  autoPlay?: boolean
}

export function CryButton({ src, autoPlay = false }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const autoPlayedFor = useRef<string | null>(null)

  const play = () => {
    if (!src) return
    if (playing) {
      audioRef.current?.pause()
      setPlaying(false)
      return
    }
    const audio = audioRef.current ?? new Audio(src)
    audio.src = src
    audioRef.current = audio
    audio.onended = () => setPlaying(false)
    audio.currentTime = 0
    audio.play().then(
      () => setPlaying(true),
      () => setPlaying(false), // autoplay/codec blocked — leave the button usable
    )
  }

  // Cry-only rounds benefit from hearing the cry immediately.
  useEffect(() => {
    if (autoPlay && src && autoPlayedFor.current !== src) {
      autoPlayedFor.current = src
      play()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, src])

  useEffect(
    () => () => {
      audioRef.current?.pause()
    },
    [],
  )

  return (
    <button
      type="button"
      className="cry-btn"
      onClick={play}
      disabled={!src}
      title={src ? 'Play cry' : 'No cry available'}
    >
      {playing ? '🔊' : '▶️'} Play cry
    </button>
  )
}
