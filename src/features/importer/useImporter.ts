import { useState } from 'react'
import type { Language } from '../../core/model/CodeElement'

const SUPPORTED_EXTENSIONS: Record<string, Language> = {
  '.java': 'java',
  '.kt': 'kotlin',
  '.cs': 'csharp',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.php': 'php',
  '.rb': 'ruby',
}

export function useImporter() {
  const [files, setFiles] = useState<File[]>([])

  function handleFolderSelect(fileList: FileList) {
    const supported: File[] = []
    const jsFiles: File[] = []

    Array.from(fileList).forEach(file => {
      const ext = file.name.slice(file.name.lastIndexOf('.'))
      if (ext === '.js') {
        jsFiles.push(file)
      } else if (ext in SUPPORTED_EXTENSIONS) {
        supported.push(file)
      }
    })

    setFiles(supported)
    return { supported, jsFiles }
  }

  function getLanguage(filename: string): Language | null {
    const ext = filename.slice(filename.lastIndexOf('.'))
    return SUPPORTED_EXTENSIONS[ext] ?? null
  }

  return { files, handleFolderSelect, getLanguage }
}
