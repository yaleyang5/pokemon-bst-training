import { useState } from 'react'

type Props = {
  label: string
  /** The text copied to the clipboard. When null the button isn't rendered. */
  text: string | null
  className?: string
}

/** A button that copies `text` to the clipboard and briefly flips to "Copied!". */
export function ShareButton({ label, text, className = 'reset-btn' }: Props) {
  const [copied, setCopied] = useState(false)
  if (text == null) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button type="button" className={className} onClick={copy}>
      {copied ? 'Copied!' : label}
    </button>
  )
}
