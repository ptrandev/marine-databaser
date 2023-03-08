import { Button } from "@mui/material"
const { ipcRenderer } = window.require('electron')

console.log('[App.tsx]', `Hello world from Electron ${process.versions.electron}!`)

const App = () => {
  return (
    <div>
      <Button variant='contained' onClick={() => {
        ipcRenderer.send('select-file')
        ipcRenderer.on('selected-file', (event, files) => {
          console.log('files', files)
        })
      }}>
        hello
      </Button>
    </div>
  )
}

export default App
