/**
 * API Documentation Page
 *
 * Interactive Swagger UI for exploring APIs
 * Access at: /api-docs
 */

'use client'

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen">
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-bold">API Documentation</h1>
        <p className="mt-1 text-sm text-gray-600">
          Explore and test the AI SaaS Platform API endpoints
        </p>
      </div>
      <SwaggerUI url="/api/docs" />
    </div>
  )
}
