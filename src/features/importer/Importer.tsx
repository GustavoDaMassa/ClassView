import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import './Importer.css'

interface ImporterProps {
  onImport: (files: FileList) => void
  loading: boolean
  progress: number
  total: number
}

export function Importer({ onImport, loading, progress, total }: ImporterProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      onImport(e.target.files)
    }
  }

  return (
    <div className="importer">
      <div className="importer__content">
        <div className="importer__icon">⬡</div>
        <h1 className="importer__title">ClassView</h1>
        <p className="importer__subtitle">
          Visualize a arquitetura orientada a objetos do seu projeto
        </p>

        {loading ? (
          <div className="importer__progress">
            <div className="importer__progress-bar">
              <div
                className="importer__progress-fill"
                style={{ width: total > 0 ? `${(progress / total) * 100}%` : '0%' }}
              />
            </div>
            <span className="importer__progress-text">
              Analisando {progress} / {total} arquivos...
            </span>
          </div>
        ) : (
          <button
            className="importer__button"
            onClick={() => inputRef.current?.click()}
          >
            Selecionar pasta
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          // @ts-expect-error webkitdirectory is not in the standard types
          webkitdirectory=""
          multiple
          style={{ display: 'none' }}
          onChange={handleChange}
        />

        <p className="importer__hint">
          Suportado: Java · Kotlin · C# · TypeScript · Python · PHP · Ruby
        </p>
      </div>
    </div>
  )
}
