import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from '../style'

const PASSWORD = 'letmein'
const API_BASE = import.meta.env.VITE_API_BASE || ''
const WORKSHEETS = [
  {
    id: 'quote',
    title: 'QUOTE',
    url: 'https://1drv.ms/x/c/3E4893196952076B/IQSZuU3Y41K5SpekOUxDT5kSAetVhKWwCuXCvH-KtexznkM',
    embed: 'https://1drv.ms/x/c/3E4893196952076B/IQSZuU3Y41K5SpekOUxDT5kSAetVhKWwCuXCvH-KtexznkM?action=edit&wdAllowInteractivity=True&wdDownloadButton=True',
    folder: '2026',
  },
  {
    id: 'straight-seed',
    title: 'STRAIGHT SEED PRICING',
    url: 'https://1drv.ms/x/c/3E4893196952076B/IQBzKP5q_4tBS7VTgGtEw-IIAQ3PI9MkwrbgdUP6LlhqVoE?e=c8VXwi',
    embed: 'https://1drv.ms/x/c/3E4893196952076B/IQBzKP5q_4tBS7VTgGtEw-IIAQ3PI9MkwrbgdUP6LlhqVoE?e=c8VXwi&action=edit&wdAllowInteractivity=True&wdDownloadButton=True',
    folder: '2026',
  },
]

const DEFAULT_FOLDERS = ['2026', 'pricing']
const uploadConfigured = Boolean(API_BASE)

const USER_PASSWORDS = {
  iamhappy: 'Ari',
  QS_2025: 'Cedric',
  QS_ACC: 'JoAnne',
}

const Product = () => {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [showWorksheets, setShowWorksheets] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState('2026')
  const [customFolders, setCustomFolders] = useState(() => {
    if (API_BASE) return []
    try {
      const stored = JSON.parse(localStorage.getItem('worksheetCustomFolders') || '[]')
      return Array.isArray(stored) ? stored : []
    } catch (_) {
      return []
    }
  })
  const [newFolderName, setNewFolderName] = useState('')
  const [uploadStatus, setUploadStatus] = useState({})
  const [customSheets, setCustomSheets] = useState(() => {
    if (API_BASE) return []
    try {
      const stored = JSON.parse(localStorage.getItem('worksheetCustomSheets') || '[]')
      return Array.isArray(stored) ? stored : []
    } catch (_) {
      return []
    }
  })
  const [worksheetMeta, setWorksheetMeta] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('worksheetLastOpened') || '{}')
      return stored && typeof stored === 'object' ? {} : {}
    } catch (_) {
      return {}
    }
  })
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const allSheets = useMemo(() => [...WORKSHEETS, ...customSheets], [customSheets])
  const displayedSheets = useMemo(
    () => allSheets.filter((sheet) => sheet.folder === selectedFolder || !sheet.folder),
    [allSheets, selectedFolder]
  )
  const folderOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...DEFAULT_FOLDERS,
          ...customFolders,
          ...customSheets.map((s) => s.folder).filter(Boolean),
        ])
      ),
    [customFolders, customSheets]
  )
  const worksheetsRef = useRef(null)
  const saveSheetsLocal = (sheets) => {
    if (API_BASE) return
    try {
      localStorage.setItem('worksheetCustomSheets', JSON.stringify(sheets))
    } catch (_) {
      /* ignore */
    }
  }
  const saveFoldersLocal = (folders) => {
    if (API_BASE) return
    try {
      localStorage.setItem('worksheetCustomFolders', JSON.stringify(folders))
    } catch (_) {
      /* ignore */
    }
  }

  useEffect(() => {
    // Load locally cached "last opened" times
    try {
      const stored = JSON.parse(localStorage.getItem('worksheetLastOpened') || '{}')
      if (stored && typeof stored === 'object') {
        setWorksheetMeta((prev) => {
          const updated = { ...prev }
          for (const sheet of allSheets) {
            const val = stored[sheet.id]
            updated[sheet.id] = {
              ...(updated[sheet.id] || {}),
              lastOpened: typeof val === 'string' ? val : val?.time || '',
              lastOpenedBy: typeof val === 'object' ? val?.user || '' : '',
            }
          }
          return updated
        })
      }
    } catch (_) {
      /* ignore parse errors */
    }
  }, [])

  useEffect(() => {
    // Persist "last opened" times
    const toSave = {}
    for (const sheet of allSheets) {
      const meta = worksheetMeta[sheet.id]
      if (meta?.lastOpened) {
        toSave[sheet.id] = {
          time: meta.lastOpened,
          user: meta.lastOpenedBy || '',
        }
      }
    }
    try {
      localStorage.setItem('worksheetLastOpened', JSON.stringify(toSave))
    } catch (_) {
      /* ignore storage errors */
    }
  }, [worksheetMeta])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    const matchedName = USER_PASSWORDS[trimmed]
    if (matchedName) {
      setAuthorized(true)
      setDisplayName(matchedName)
      setError('')
    } else {
      setAuthorized(false)
      setError('Incorrect password. Try again.')
    }
  }

  const markOpenedNow = (sheetId) => {
    const now = new Date().toLocaleString()
    const user = displayName.trim() || 'Unknown'
    setWorksheetMeta((prev) => ({
      ...prev,
      [sheetId]: {
        ...(prev[sheetId] || {}),
        lastOpened: now,
        lastOpenedBy: user,
      },
    }))
  }

  const addCustomSheet = async () => {
    if (!newTitle.trim() || !newUrl.trim()) return
    const id = `${newTitle.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    const embed = `${newUrl.trim()}${newUrl.includes('?') ? '&' : '?'}action=edit&wdAllowInteractivity=True&wdDownloadButton=True`
    const sheet = { id, title: newTitle.trim(), url: newUrl.trim(), embed, folder: selectedFolder }

    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/worksheets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: sheet.title, url: sheet.url, folder: sheet.folder, embed }),
        })
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        const saved = data.sheet || sheet
        setCustomSheets((prev) => [...prev, saved])
        setDataError('')
      } catch (err) {
        setDataError('Unable to save to server. Saved locally instead.')
        setCustomSheets((prev) => {
          const updated = [...prev, sheet]
          saveSheetsLocal(updated)
          return updated
        })
      }
    } else {
      setCustomSheets((prev) => {
        const updated = [...prev, sheet]
        saveSheetsLocal(updated)
        return updated
      })
    }

    setWorksheetMeta((prev) => ({
      ...prev,
      [id]: { lastOpened: '', lastOpenedBy: '', loading: false, embedUrl: embed },
    }))
    setNewTitle('')
    setNewUrl('')
  }

  const addFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    const addLocal = () => {
      setCustomFolders((prev) => {
        if (prev.includes(name) || DEFAULT_FOLDERS.includes(name)) return prev
        const updated = [...prev, name]
        saveFoldersLocal(updated)
        return updated
      })
    }

    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/worksheets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'folder', name }),
        })
        if (!res.ok) throw new Error(`Status ${res.status}`)
        setCustomFolders((prev) => (prev.includes(name) ? prev : [...prev, name]))
        setDataError('')
      } catch (err) {
        setDataError('Unable to save folder to server. Saved locally instead.')
        addLocal()
      }
    } else {
      addLocal()
    }
    setNewFolderName('')
  }

  const handleShowWorksheets = () => {
    setShowWorksheets(true)
    setTimeout(() => {
      worksheetsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  const handleUpload = async (file, sheetId) => {
    if (!file) return
    if (!API_BASE) {
      setUploadStatus((prev) => ({
        ...prev,
        [sheetId]: { state: 'error', message: 'Upload API not configured (set VITE_API_BASE).' },
      }))
      return
    }
    setUploadStatus((prev) => ({ ...prev, [sheetId]: { state: 'uploading', message: 'Uploading...' } }))
    const formData = new FormData()
    formData.append('file', file)
    formData.append('sheetId', sheetId)
    formData.append('folder', selectedFolder)
    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error(`Status ${res.status}`)
      setUploadStatus((prev) => ({ ...prev, [sheetId]: { state: 'done', message: 'Upload complete' } }))
    } catch (err) {
      setUploadStatus((prev) => ({
        ...prev,
        [sheetId]: { state: 'error', message: 'Upload failed. Check API settings.' },
      }))
    }
  }

  useEffect(() => {
    if (!authorized) return
    const fetchMeta = async () => {
      const updates = {}
      for (const sheet of allSheets) {
        const shareId = encodeShareId(sheet.url)
        if (!shareId) {
          updates[sheet.id] = {
            lastOpened: '',
            lastOpenedBy: worksheetMeta[sheet.id]?.lastOpenedBy || '',
            loading: false,
            embedUrl: sheet.embed,
          }
          continue
        }
        try {
          updates[sheet.id] = { ...(worksheetMeta[sheet.id] || {}), loading: true }
          const res = await fetch(`https://api.onedrive.com/v1.0/shares/${shareId}/driveItem`)
          if (!res.ok) {
            throw new Error(`Status ${res.status}`)
          }
          const data = await res.json()
          const lastOpened = data?.lastModifiedDateTime || data?.lastAccessedDateTime
          const embedUrl = data?.embedUrl || sheet.embed
          updates[sheet.id] = {
            lastOpened: lastOpened ? new Date(lastOpened).toLocaleString() : 'Unavailable',
            lastOpenedBy: worksheetMeta[sheet.id]?.lastOpenedBy || '',
            loading: false,
            embedUrl,
          }
        } catch (err) {
          updates[sheet.id] = {
            lastOpened: '',
            lastOpenedBy: worksheetMeta[sheet.id]?.lastOpenedBy || '',
            loading: false,
            embedUrl: sheet.embed,
          }
        }
      }
      setWorksheetMeta((prev) => ({ ...prev, ...updates }))
    }
    fetchMeta()
  }, [authorized, allSheets])

  useEffect(() => {
    if (!authorized || !API_BASE) return
    const fetchRemote = async () => {
      setDataLoading(true)
      setDataError('')
      try {
        const res = await fetch(`${API_BASE}/worksheets`)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        if (Array.isArray(data.sheets)) {
          setCustomSheets(data.sheets)
        }
        if (Array.isArray(data.folders)) {
          setCustomFolders(data.folders)
        }
      } catch (err) {
        setDataError('Unable to load shared worksheets. Using local data instead.')
      } finally {
        setDataLoading(false)
      }
    }
    fetchRemote()
  }, [authorized])

  return (
    <div className={`bg-primary ${styles.paddingX} ${styles.flexStart}`}>
      <div className={`${styles.boxWidth} py-16`}>
        {!authorized ? (
          <div className='max-w-[520px] rounded-2xl bg-black-gradient p-6 border border-dimBlue'>
            <h2 className='text-3xl font-semibold text-body mb-3'>Enter password</h2>
            <p className={`${styles.paragraph} mb-4`}>
              This page is protected. Provide the authorization password to continue.
            </p>
            <form onSubmit={handleSubmit} className='space-y-3'>
              <label className='flex flex-col text-muted text-sm gap-1'>
                Password
                <input
                  type='password'
                  className='rounded-lg bg-primary/80 border border-dimBlue px-3 py-2 text-body'
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </label>
              {error && <p className='text-secondary text-sm'>{error}</p>}
              <button
                type='submit'
                className='px-4 py-2 bg-secondary text-primary font-semibold rounded-lg w-full'
              >
                Unlock
              </button>
            </form>
          </div>
        ) : (
          <div className='rounded-2xl bg-black-gradient p-6 border border-dimBlue'>
            <div className='space-y-6'>
              <h1 className='text-4xl sm:text-5xl font-poppins font-semibold text-body'>
                Ari Ekstein
              </h1>
              <p className={`${styles.paragraph} max-w-[680px]`}>
                Welcome to Ari Ekstein&apos;s workspace. Use this space to outline project objectives, key contacts,
                and quick links for the tools you need. Replace this text with the real content once you&apos;re ready.
              </p>
              <div className='grid gap-4 sm:grid-cols-2 max-w-[640px]'>
                <PlaceholderCard title='Project Overview' />
                <PlaceholderCard title='Key Contacts' />
                <button
                  type='button'
                  onClick={handleShowWorksheets}
                  className='rounded-xl bg-primary/60 border border-secondary px-4 py-3 text-left min-h-[120px] hover:border-secondary/80 transition'
                >
                  <h3 className='text-body font-semibold text-lg mb-2'>Worksheets</h3>
                  <p className='text-muted text-sm'>Open and manage worksheet folders.</p>
                </button>
                <PlaceholderCard title='Next Actions' />
              </div>
            </div>

            {showWorksheets && (
              <div
                ref={worksheetsRef}
                className='mt-8 rounded-xl bg-primary/60 border border-dimBlue px-4 py-4'
              >
                <h2 className='text-2xl font-semibold text-body mb-2'>Worksheets</h2>
                <p className='text-muted text-sm mb-3'>
                  Select a worksheet folder to open in your browser or Excel.
                </p>
                {dataLoading && (
                  <p className='text-muted text-sm mb-2'>Loading shared worksheets…</p>
                )}
                {dataError && (
                  <p className='text-secondary text-sm mb-2'>{dataError}</p>
                )}
                {!uploadConfigured && (
                  <p className='text-secondary text-sm mb-3'>
                    Uploads are disabled: set VITE_API_BASE to enable OneDrive uploads.
                  </p>
                )}
                <div className='flex gap-2 flex-wrap mb-4'>
                  {folderOptions.map((folder) => (
                    <button
                      key={folder}
                      type='button'
                      onClick={() => setSelectedFolder(folder)}
                      className={`px-4 py-2 rounded-lg border bg-[#d72631] text-white ${selectedFolder === folder ? 'border-secondary' : 'border-dimBlue'}`}
                    >
                      {folder}
                    </button>
                  ))}
                </div>
                <div className='flex gap-3 flex-wrap mb-6 items-end'>
                  <label className='flex flex-col text-muted text-sm gap-1'>
                    New folder
                    <input
                      type='text'
                      className='rounded-lg bg-primary/80 border border-dimBlue px-3 py-2 text-body'
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder='e.g., 2027'
                    />
                  </label>
                  <button
                    type='button'
                    onClick={addFolder}
                    className='px-4 py-2 rounded-lg border bg-[#d72631] text-white font-semibold'
                  >
                    Add folder
                  </button>
                </div>
                <div className='space-y-3'>
                  {displayedSheets.map((sheet) => {
                    const meta = worksheetMeta[sheet.id] || {}
                    return (
                      <div
                        key={sheet.id}
                        className='rounded-lg px-4 py-3 flex flex-col gap-3 border border-dimBlue bg-primary/60'
                      >
                        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                          <div>
                            <p className='text-body font-semibold'>{sheet.title}</p>
                            <p className='text-muted text-sm'>
                              Last opened:{' '}
                              {meta.loading
                                ? 'Loading...'
                                : meta.lastOpened
                                ? `${meta.lastOpened}${meta.lastOpenedBy ? ` by ${meta.lastOpenedBy}` : ''}`
                                : 'Unavailable'}
                            </p>
                          </div>
                          <div className='flex gap-2 flex-wrap'>
                            <a
                              href={sheet.url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='px-4 py-2 bg-secondary text-primary font-semibold rounded-lg whitespace-nowrap'
                              onClick={() => markOpenedNow(sheet.id)}
                            >
                              Open in browser (OneDrive)
                            </a>
                            <a
                              href={`ms-excel:ofe|u|${sheet.url}`}
                              className='px-4 py-2 border border-dimBlue text-body font-semibold rounded-lg whitespace-nowrap'
                              onClick={() => markOpenedNow(sheet.id)}
                            >
                              Open in Excel
                            </a>
                            <label
                              className={`px-4 py-2 border text-body font-semibold rounded-lg whitespace-nowrap ${
                                uploadConfigured ? 'cursor-pointer border-dimBlue hover:border-secondary/70' : 'opacity-60 cursor-not-allowed border-dimBlue'
                              }`}
                            >
                              Upload from computer
                              <input
                                type='file'
                                className='hidden'
                                disabled={!uploadConfigured}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleUpload(file, sheet.id)
                                    e.target.value = ''
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        {uploadStatus[sheet.id]?.message && (
                          <p
                            className={`text-sm ${
                              uploadStatus[sheet.id].state === 'error'
                                ? 'text-secondary'
                                : uploadStatus[sheet.id].state === 'uploading'
                                ? 'text-muted'
                                : 'text-body'
                            }`}
                          >
                            {uploadStatus[sheet.id].message}
                          </p>
                        )}
                      </div>
                    )
                  })}
                  <div className='mt-4 rounded-lg bg-primary/60 border border-dimBlue p-4 space-y-3'>
                    <h3 className='text-body font-semibold text-lg'>Add a worksheet</h3>
                    <div className='grid gap-3 sm:grid-cols-2'>
                      <label className='flex flex-col text-muted text-sm gap-1'>
                        Title
                        <input
                          type='text'
                          className='rounded-lg bg-primary/80 border border-dimBlue px-3 py-2 text-body'
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder='e.g., New Folder'
                        />
                      </label>
                      <label className='flex flex-col text-muted text-sm gap-1'>
                        Link (OneDrive URL)
                        <input
                          type='text'
                          className='rounded-lg bg-primary/80 border border-dimBlue px-3 py-2 text-body'
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          placeholder='https://1drv.ms/...'
                        />
                      </label>
                    </div>
                    <button
                      type='button'
                      onClick={addCustomSheet}
                      className='px-4 py-2 bg-secondary text-primary font-semibold rounded-lg'
                    >
                      Add worksheet
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const PlaceholderCard = ({ title }) => (
  <div className='rounded-xl bg-primary/60 border border-dimBlue px-4 py-3 min-h-[120px]'>
    <h3 className='text-body font-semibold text-lg mb-2'>{title}</h3>
    <p className='text-muted text-sm'>Add details here when you&apos;re ready.</p>
  </div>
)

const encodeShareId = (url) => {
  try {
    const base64 = btoa(unescape(encodeURIComponent(url)))
    // OneDrive expects URL-safe base64 with u! prefix
    return `u!${base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`
  } catch (e) {
    return ''
  }
}

export default Product
