import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check if all required environment variables are set
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    
    const status = {
      vercelBlob: {
        tokenConfigured: !!blobToken,
        tokenLength: blobToken ? blobToken.length : 0,
        tokenPreview: blobToken ? `${blobToken.substring(0, 10)}...` : 'Not set'
      },
      imageUpload: {
        endpointAvailable: true,
        supportedFormats: ['JPEG', 'PNG', 'WebP'],
        maxFileSize: '10MB',
        storageLocation: 'Vercel Blob Storage'
      },
      production: {
        environment: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV || 'Not set',
        isProduction: process.env.NODE_ENV === 'production'
      }
    }

    return NextResponse.json({
      success: true,
      ready: !!blobToken,
      status,
      message: blobToken 
        ? 'Image upload system is properly configured and ready!'
        : 'Image upload system needs BLOB_READ_WRITE_TOKEN configuration'
    })

  } catch (error) {
    console.error('Configuration check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check configuration'
    }, { status: 500 })
  }
}