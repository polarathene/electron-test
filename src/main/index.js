'use strict'

import { app, BrowserWindow, session } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'

const isDevelopment = process.env.NODE_ENV !== 'production'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

function createMainWindow() {
  const windowSettings = {}
  if (isDevelopment) {
    windowSettings.webPreferences = { webSecurity: false }
  } else {
    // Default in Electron 5.0+
    // TODO: Enable or look into why it's failing (electron-webpack repo should be a good start)
    //windowSettings.webPreferences = { nodeIntegration: false }
  }

  const window = new BrowserWindow(windowSettings)

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  }
  else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }))
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  if (isDevelopment) {
    // Modify the user agent for all requests to the following urls.
    const filter = {
      urls: ['https://translate.google.*']
    }
    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      details.requestHeaders['Referer'] = '';
      callback({cancel: false, requestHeaders: details.requestHeaders})
    })
  }

  mainWindow = createMainWindow()
})
