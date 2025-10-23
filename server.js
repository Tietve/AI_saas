#!/usr/bin/env node

/**
 * Azure App Service Entry Point
 * 
 * This file is required for Azure App Service to properly start the Next.js application.
 * It ensures the app listens on the correct PORT provided by Azure.
 */

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

// Get port from Azure environment or default to 3000
const port = process.env.PORT || 3000
const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0' // Listen on all interfaces for Azure

console.log(`🚀 Starting Next.js server...`)
console.log(`📍 Environment: ${process.env.NODE_ENV}`)
console.log(`🔌 Port: ${port}`)
console.log(`🌐 Hostname: ${hostname}`)

// Initialize Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })
  .listen(port, hostname, (err) => {
    if (err) {
      console.error('❌ Failed to start server:', err)
      process.exit(1)
    }
    console.log(`✅ Server ready on http://${hostname}:${port}`)
    console.log(`🏥 Health check: http://${hostname}:${port}/api/health`)
  })
  .on('error', (err) => {
    console.error('❌ Server error:', err)
    process.exit(1)
  })
})
.catch((err) => {
  console.error('❌ Failed to prepare Next.js app:', err)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...')
  process.exit(0)
})
