import React from 'react'
import ReactDOM from 'react-dom/client'

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

import CssBaseline from '@mui/material/CssBaseline'
import { RouterProvider } from 'react-router-dom'
import router from './routes'
import { FilesProvider } from './contexts/FilesContext'
import { DirectoriesProvider } from './contexts/DirectoriesContext'
import { ExtractAudioProvider } from './contexts/ExtractAudioContext'
import { SpliceVideoProvider } from './contexts/SpliceVideoContext'
import { TagsProvider } from './contexts/TagsContext'
import { SnackbarProvider, closeSnackbar } from 'notistack'
import { IconButton } from '@mui/material'
import { Close } from '@mui/icons-material'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SnackbarProvider
      autoHideDuration={6000}
      action={(key) => (
        <IconButton
          onClick={() => {
            closeSnackbar(key)
          }}
          color='inherit'
          size='small'
        >
          <Close fontSize='small' />
        </IconButton>
      )}
    >
      <CssBaseline />
      <DirectoriesProvider>
        <FilesProvider>
          <TagsProvider>
            <ExtractAudioProvider>
              <SpliceVideoProvider>
                <RouterProvider router={router} />
              </SpliceVideoProvider>
            </ExtractAudioProvider>
          </TagsProvider>
        </FilesProvider>
      </DirectoriesProvider>
    </SnackbarProvider>
  </React.StrictMode >
)

postMessage({ payload: 'removeLoading' }, '*')
