import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import _ from 'lodash'

import React from 'react'
import ReactDOM from 'react-dom/server'
import { flushChunkNames } from 'react-universal-component/server'
import flushChunks from 'webpack-flush-chunks'
import serialize from 'serialize-javascript'
import createApp from '../src/containers/App'
import { collect } from 'linaria/server'

import { staticMap } from '../src/routes'

const cssCache = {}

function addStylesheet(url) {
  return `
    <link rel="preload" href="${url}" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="${url}"></noscript>
  `
}

const renderStatic = ({ url, clientStats }) => {
  const { App, store } = createApp({ url })
  const app = ReactDOM.renderToString(<App/>)

  const chunkNames = flushChunkNames()

  const {
    js,
    styles,
    cssHash,
    scripts,
    stylesheets,
  } = flushChunks(clientStats, { chunkNames })

  const css = stylesheets.map(stylesheet => {
    return fs.readFileSync(path.join(clientStats.outputPath, stylesheet))
  }).join('\n ')

  const { critical, other } = collect(app, css)
  const cssMd5 = crypto.createHash('md5').update(other).digest('hex')
  cssCache[cssMd5] = other

  const preloadedState = store.getState()
  const preloadedStateString = serialize(preloadedState)

  const html =
    `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <style type="text/css">${critical}</style>
        </head>
        <body>
            <script>window.__PRELOADED_STATE__ = ${preloadedStateString}</script>
            <div id="app">${app}</div>
            ${addStylesheet(`/styles/${cssMd5}`)}
            ${cssHash}
            ${js}
        </body>
    </html>
    `
  return html
}

export { renderStatic, staticMap }

export default ({ clientStats }) => (req, res) => {
  const url = req.url || '/'

  const matches = /^\/styles\/(?<cssHash>.*)$/.exec(url)

  const cssHash = _.get(matches, 'groups.cssHash')
  if(cssHash) {
    const css = _.get(cssCache, cssHash)
    if(css) {
      res.set('Content-Type', 'text/css')
      return res.send(css)
    }
  }

  const html = renderStatic({ url, clientStats })
  res.send(html)
}
