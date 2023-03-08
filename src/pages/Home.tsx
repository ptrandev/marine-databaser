import { Button } from "@mui/material"
import { useState, useEffect } from "react"
const { ipcRenderer } = window.require('electron')

import { FileList } from '../components/Home'

console.log('[App.tsx]', `Hello world from Electron ${process.versions.electron}!`)

const Home = () => {
  const [files, setFiles] = useState()

  const loadFiles = () => {
    ipcRenderer.send('list-files')
    ipcRenderer.on('listed-files', (_, files) => {
      setFiles(files)
    })
  }

  useEffect(() => {
    loadFiles()
  }, [])

  return (
    <div>
      <Button variant='contained' onClick={() => {
        ipcRenderer.send('select-file')
        ipcRenderer.on('selected-file', () => {
          loadFiles()
        })
      }}>
        hello
      </Button>
      <FileList files={files} />
    </div>
  )
}

export default Home
