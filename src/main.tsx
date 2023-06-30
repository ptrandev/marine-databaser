import React from 'react'
import ReactDOM from 'react-dom/client'
import './samples/node-api'

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import CssBaseline from '@mui/material/CssBaseline';
import { RouterProvider } from 'react-router-dom';
import router from './routes';
import { FilesProvider } from './contexts/FilesContext';
import { DirectoriesProvider } from './contexts/DirectoriesContext';
import { ExtractAudioProvider } from './contexts/ExtractAudioContext';
import { SpliceVideoProvider } from './contexts/SpliceVideoContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <CssBaseline />
    <DirectoriesProvider>
      <FilesProvider>
        <ExtractAudioProvider>
          <SpliceVideoProvider>
            <RouterProvider router={router} />
          </SpliceVideoProvider>
        </ExtractAudioProvider>
      </FilesProvider>
    </DirectoriesProvider>
  </React.StrictMode>,
)

postMessage({ payload: 'removeLoading' }, '*')
