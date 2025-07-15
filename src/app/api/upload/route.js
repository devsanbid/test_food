import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getCurrentUser } from '@/actions/authActions';

export async function POST(request) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.formData();
    const file = data.get('file');
    const type = data.get('type') || 'menu-item';

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${originalName}`;
    
    // Determine upload path based on type
    let uploadDir;
    switch (type) {
      case 'menu-item':
        uploadDir = 'menu-items';
        break;
      case 'restaurant-profile':
        uploadDir = 'restaurants/profiles';
        break;
      case 'restaurant-banner':
        uploadDir = 'restaurants/banners';
        break;
      default:
        uploadDir = 'general';
    }

    // Create the full path
    const uploadPath = join(process.cwd(), 'public', 'uploads', uploadDir, filename);
    const dirPath = join(process.cwd(), 'public', 'uploads', uploadDir);
    
    // Ensure directory exists
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }
    
    // Write the file
    await writeFile(uploadPath, buffer);
    
    // Return the public URL
    const publicUrl = `/uploads/${uploadDir}/${filename}`;
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}