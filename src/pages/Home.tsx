import { Button } from "@mui/material"
import { useState, useEffect } from "react"
const { ipcRenderer } = window.require('electron')

import { FileList } from '@/components/Home'

import { File } from "../../electron/database/schemas"
import FileSearch from "@/components/Home/FileSearch"

console.log('[App.tsx]', `Hello world from Electron ${process.versions.electron}!`)

const Home = () => {
  const [files, setFiles] = useState<File[]>()
  const [searchFiles, setSearchFiles] = useState<File[]>()

  const [searchTerm, setSearchTerm] = useState<string>('')

  const loadFiles = () => {
    ipcRenderer.send('list-files')
    ipcRenderer.on('listed-files', (_, files) => {
      setFiles(files)
    })
  }

  useEffect(() => {
    loadFiles()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const searchFiles = files?.filter(file => file.dataValues.name.toLowerCase().includes(searchTerm.toLowerCase()))
      setSearchFiles(searchFiles)
    } else {
      setSearchFiles(files)
    }
  }, [files, searchTerm])

  return (
    <div>
      <FileSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      {
        searchFiles && <FileList files={searchFiles} />
      }
    </div>
  )
}

export default Home
