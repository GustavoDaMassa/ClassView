import { renderHook, act } from '@testing-library/react'
import { useImporter } from '../useImporter'

function makeFile(name: string): File {
  return new File(['content'], name)
}

function makeFileList(files: File[]): FileList {
  const dt = new DataTransfer()
  files.forEach(f => dt.items.add(f))
  return dt.files
}

describe('useImporter', () => {
  it('starts with an empty file list', () => {
    const { result } = renderHook(() => useImporter())
    expect(result.current.files).toHaveLength(0)
  })

  it('accepts supported OOP files', () => {
    const { result } = renderHook(() => useImporter())

    act(() => {
      result.current.handleFolderSelect(
        makeFileList([
          makeFile('Foo.java'),
          makeFile('Bar.kt'),
          makeFile('Baz.cs'),
          makeFile('Qux.ts'),
          makeFile('Comp.tsx'),
          makeFile('main.py'),
          makeFile('Service.php'),
          makeFile('model.rb'),
        ]),
      )
    })

    expect(result.current.files).toHaveLength(8)
  })

  it('ignores unsupported extensions silently', () => {
    const { result } = renderHook(() => useImporter())

    act(() => {
      result.current.handleFolderSelect(
        makeFileList([
          makeFile('README.md'),
          makeFile('config.json'),
          makeFile('styles.css'),
          makeFile('Foo.java'),
        ]),
      )
    })

    expect(result.current.files).toHaveLength(1)
    expect(result.current.files[0].name).toBe('Foo.java')
  })

  it('detects .js files and returns them separately', () => {
    const { result } = renderHook(() => useImporter())

    let returned: ReturnType<typeof result.current.handleFolderSelect>

    act(() => {
      returned = result.current.handleFolderSelect(
        makeFileList([makeFile('index.js'), makeFile('Foo.java')]),
      )
    })

    expect(result.current.files).toHaveLength(1)
    expect(returned!.jsFiles).toHaveLength(1)
    expect(returned!.jsFiles[0].name).toBe('index.js')
  })

  it('replaces previous selection on new call', () => {
    const { result } = renderHook(() => useImporter())

    act(() => {
      result.current.handleFolderSelect(makeFileList([makeFile('A.java')]))
    })
    expect(result.current.files).toHaveLength(1)

    act(() => {
      result.current.handleFolderSelect(
        makeFileList([makeFile('B.kt'), makeFile('C.cs')]),
      )
    })
    expect(result.current.files).toHaveLength(2)
  })

  it('maps each extension to the correct language', () => {
    const { result } = renderHook(() => useImporter())

    act(() => {
      result.current.handleFolderSelect(
        makeFileList([
          makeFile('A.java'),
          makeFile('B.kt'),
          makeFile('C.cs'),
          makeFile('D.ts'),
          makeFile('E.tsx'),
          makeFile('F.py'),
          makeFile('G.php'),
          makeFile('H.rb'),
        ]),
      )
    })

    const langs = result.current.files.map(f => result.current.getLanguage(f.name))
    expect(langs).toEqual(['java', 'kotlin', 'csharp', 'typescript', 'typescript', 'python', 'php', 'ruby'])
  })
})
