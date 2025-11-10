import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
} from 'react'
import Editor from '@monaco-editor/react'
import { convertJsonToToon } from './lib/conversion'
import './App.css'

const INITIAL_JSON = `{
  "title": "JSON to TOON",
  "items": [
    { "sku": "A1", "name": "Widget", "qty": 2, "price": 9.99 },
    { "sku": "B2", "name": "Gadget", "qty": 1, "price": 14.5 }
  ]
}`

function App() {
  const [jsonInput, setJsonInput] = useState(INITIAL_JSON)
  const [isDragging, setIsDragging] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [dropMessage, setDropMessage] = useState<string | null>(null)

  const conversion = useMemo(() => convertJsonToToon(jsonInput), [jsonInput])

  useEffect(() => {
    if (copyState === 'idle') {
      return
    }

    const timeout = window.setTimeout(() => {
      setCopyState('idle')
    }, 2000)

    return () => window.clearTimeout(timeout)
  }, [copyState])

  const handleEditorChange = useCallback((value?: string) => {
    setJsonInput(value ?? '')
  }, [])

  const handleCopy = useCallback(async () => {
    if (!conversion.toonText) {
      return
    }

    try {
      await navigator.clipboard.writeText(conversion.toonText)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }
  }, [conversion.toonText])

  const handleDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDropMessage(null)
    setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const related = event.relatedTarget as Node | null
    if (related && event.currentTarget.contains(related)) {
      return
    }

    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    const [file] = Array.from(event.dataTransfer.files)
    if (!file) {
      return
    }

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setDropMessage('Unsupported file type. Please drop a .json file.')
      return
    }

    file
      .text()
      .then((text) => {
        setDropMessage(null)
        setJsonInput(text)
      })
      .catch(() => {
        setDropMessage('Failed to read file. Please try again.')
      })
  }, [])

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>JSON to TOON Converter</h1>
          <p>
            Paste or drop JSON on the left and get deterministic TOON output on
            the right. Everything stays in your browser.
          </p>
        </div>
        <a
          className="app__link"
          href="https://github.com/toon-format/toon#readme"
          target="_blank"
          rel="noreferrer"
        >
          TOON Specification
        </a>
      </header>

      <main className="app__workspace">
        <section
          className={`pane pane--editor ${isDragging ? 'pane--dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="pane__header">
            <div className="pane__title-group">
              <h2>JSON Input</h2>
              <span className="pane__hint">Drag & Drop supported (.json)</span>
              {dropMessage ? (
                <span className="pane__hint pane__hint--warning">{dropMessage}</span>
              ) : null}
            </div>
          </div>
          <div className="pane__body">
            <Editor
              height="100%"
              language="json"
              theme="vs-dark"
              value={jsonInput}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                tabSize: 2,
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          </div>
        </section>

        <section className="pane pane--output">
          <div className="pane__header">
            <div className="pane__title-group">
              <h2>TOON Output</h2>
              <div className="token-stats">
                <span>JSON tokens: {conversion.jsonTokens}</span>
                <span>TOON tokens: {conversion.toonTokens}</span>
                <span>Tokens saved: {conversion.savedTokens}</span>
              </div>
            </div>
            <button
              type="button"
              className="button"
              onClick={handleCopy}
              disabled={!conversion.toonText}
            >
              {copyState === 'copied'
                ? 'Copied!'
                : copyState === 'error'
                  ? 'Copy failed'
                  : 'Copy TOON'}
            </button>
          </div>
          <div className="pane__body output">
            {conversion.error ? (
              <div className="output__error">Invalid JSON: {conversion.error}</div>
            ) : conversion.toonText ? (
              <pre className="output__content">{conversion.toonText}</pre>
            ) : (
              <div className="output__placeholder">
                TOON conversion will appear here.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
