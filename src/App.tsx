import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from 'react'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { convertJsonToToon, convertToonToJson } from './lib/conversion'
import { gtag } from './services/analytics'
import './App.css'

const INITIAL_JSON = `{
  "title": "JSON to TOON",
  "items": [
    { "sku": "A1", "name": "Widget", "qty": 2, "price": 9.99 },
    { "sku": "B2", "name": "Gadget", "qty": 1, "price": 14.5 }
  ]
}`

type ConversionMode = 'json-to-toon' | 'toon-to-json'

function App() {
  const [mode, setMode] = useState<ConversionMode>('json-to-toon')
  const [inputText, setInputText] = useState(INITIAL_JSON)
  const [isDragging, setIsDragging] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [dropMessage, setDropMessage] = useState<string | null>(null)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const isJsonToToon = mode === 'json-to-toon'

  const conversion = useMemo(
    () =>
      isJsonToToon
        ? convertJsonToToon(inputText)
        : convertToonToJson(inputText),
    [inputText, isJsonToToon],
  )

  const inputTitle = isJsonToToon ? 'JSON Input' : 'TOON Input'
  const outputTitle = isJsonToToon ? 'TOON Output' : 'JSON Output'
  const inputHint = isJsonToToon
    ? 'Drag & Drop supported (.json)'
    : 'Drag & Drop supported (.toon, .txt)'
  const outputPlaceholder = isJsonToToon
    ? 'TOON conversion will appear here.'
    : 'JSON conversion will appear here.'
  const outputLanguage = isJsonToToon ? 'yaml' : 'json'
  const inputLanguage = isJsonToToon ? 'json' : 'yaml'
  const copyLabel =
    copyState === 'copied'
      ? 'Copied!'
      : copyState === 'error'
        ? 'Copy failed'
        : isJsonToToon
          ? 'Copy TOON'
          : 'Copy JSON'
  const errorPrefix = isJsonToToon ? 'Invalid JSON' : 'Invalid TOON'
  const inputTokenLabel = isJsonToToon ? 'JSON tokens' : 'TOON tokens'
  const outputTokenLabel = isJsonToToon ? 'TOON tokens' : 'JSON tokens'
  const inputTokenCount = isJsonToToon ? conversion.jsonTokens : conversion.toonTokens
  const outputTokenCount = isJsonToToon ? conversion.toonTokens : conversion.jsonTokens
  const tokenDelta = outputTokenCount - inputTokenCount
  const tokenDeltaLabel =
    tokenDelta > 0 ? `+${tokenDelta}` : tokenDelta.toString()
  const headerDescription = isJsonToToon
    ? 'Paste or drop JSON on the left and get deterministic TOON output on the right. Everything stays in your browser.'
    : 'Paste or drop TOON on the left and get formatted JSON output on the right. Everything stays in your browser.'

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
    setInputText(value ?? '')
  }, [])

  const handleEditorMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) {
      return
    }

    const disposable = editor.onDidPaste(() => {
      const type = isJsonToToon ? 'json' : 'toon'
      gtag('event', 'paste_input', {
        type: type,
      })
    })

    return () => {
      disposable.dispose()
    }
  }, [isJsonToToon])

  const handleCopy = useCallback(async () => {
    if (!conversion.convertedText) {
      return
    }

    try {
      await navigator.clipboard.writeText(conversion.convertedText)
      setCopyState('copied')
      const type = isJsonToToon ? 'toon' : 'json'
      gtag('event', 'copy_output', {
        type: type,
      })
    } catch {
      setCopyState('error')
    }
  }, [conversion.convertedText, isJsonToToon])

  const handleModeToggle = useCallback(() => {
    setMode((previousMode) => {
      const nextMode =
        previousMode === 'json-to-toon' ? 'toon-to-json' : 'json-to-toon'

      // Track mode switch
      gtag('event', 'switch_mode', {
        type: previousMode === 'json-to-toon' ? 'json' : 'toon',
      })

      return nextMode
    })

    // Update input text with converted text if available
    if (!conversion.error && conversion.convertedText) {
      setInputText(conversion.convertedText)
    }

    setCopyState('idle')
    setDropMessage(null)
  }, [conversion])

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

    if (isJsonToToon) {
      const isJsonFile =
        file.type === 'application/json' || file.name.endsWith('.json')
      if (!isJsonFile) {
        setDropMessage('Unsupported file type. Please drop a .json file.')
        return
      }
    } else {
      const isToonFile =
        !file.type ||
        file.type === 'text/plain' ||
        file.type.includes('yaml') ||
        file.name.endsWith('.toon') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.yaml') ||
        file.name.endsWith('.yml')

      if (!isToonFile) {
        setDropMessage('Unsupported file type. Please drop a TOON file.')
        return
      }
    }

    file
      .text()
      .then((text) => {
        setDropMessage(null)
        setInputText(text)
      })
      .catch(() => {
        setDropMessage('Failed to read file. Please try again.')
      })
  }, [isJsonToToon])

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>
            JSON &lt;&gt; TOON Converter
          </h1>
          <p>{headerDescription}</p>
        </div>
        <div className="app__header-actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={handleModeToggle}
          >
            {isJsonToToon ? 'Switch to TOON → JSON' : 'Switch to JSON → TOON'}
          </button>
          {/* <a
            className="app__link"
            href="https://github.com/toon-format/toon#readme"
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              gtag('event', 'click_documentation')
            }}
          >
            TOON Specification
          </a> */}
          <a
            className="app__link"
            href="https://smartjsondiff.com"
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              gtag('event', 'click_json_comparison')
            }}
          >
            Try our JSON comparison tool!
          </a>
        </div>
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
              <h2>{inputTitle}</h2>
              <span className="pane__hint">{inputHint}</span>
              {dropMessage ? (
                <span className="pane__hint pane__hint--warning">{dropMessage}</span>
              ) : null}
            </div>
          </div>
          <div className="pane__body">
            <Editor
              height="100%"
              language={inputLanguage}
              theme="vs-dark"
              value={inputText}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
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
              <h2>{outputTitle}</h2>
              <div className="token-stats">
                <span>
                  {inputTokenLabel}: {inputTokenCount}
                </span>
                <span>
                  {outputTokenLabel}: {outputTokenCount}
                </span>
                <span>
                  Token delta:{' '}
                  {tokenDeltaLabel}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="button"
              onClick={handleCopy}
              disabled={!conversion.convertedText}
            >
              {copyLabel}
            </button>
          </div>
          <div className="pane__body output">
            {conversion.error ? (
              <div className="output__error">
                {errorPrefix}: {conversion.error}
              </div>
            ) : (
              <>
                <Editor
                  className="output__editor"
                  height="100%"
                  width="100%"
                  language={outputLanguage}
                  theme="vs-dark"
                  value={conversion.convertedText ?? ''}
                  options={{
                    readOnly: true,
                    domReadOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    tabSize: 2,
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
                {!conversion.convertedText ? (
                  <div className="output__placeholder">
                    {outputPlaceholder}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
