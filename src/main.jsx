import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { DataProvider } from './context/DataProvider'
import { SearchProvider } from './context/SearchContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <DataProvider>
        <SearchProvider>
          <App />
        </SearchProvider>
      </DataProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
