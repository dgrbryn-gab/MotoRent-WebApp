/**
 * Storage Service
 * Handles file uploads to Supabase Storage
 */

import { supabase } from '../lib/supabase';

export const storageService = {
  /**
   * Upload a motorcycle image
   * @param file - The image file to upload
   * @param fileName - Optional custom filename (auto-generated if not provided)
   * @returns The public URL of the uploaded image
   */
  async uploadMotorcycleImage(file: File, fileName?: string): Promise<string> {
    try {
      // Generate unique filename if not provided
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExt = file.name.split('.').pop();
      const finalFileName = fileName || `motorcycle_${timestamp}_${randomString}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('motorcycle-images')
        .upload(finalFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('motorcycle-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading motorcycle image:', error);
      throw new Error(error.message || 'Failed to upload image');
    }
  },

  /**
   * Delete a motorcycle image
   * @param imageUrl - The public URL or path of the image to delete
   */
  async deleteMotorcycleImage(imageUrl: string): Promise<void> {
    try {
      // Extract path from URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/motorcycle-images/filename.jpg
      const urlParts = imageUrl.split('/motorcycle-images/');
      if (urlParts.length < 2) {
        console.warn('Invalid image URL format, skipping deletion');
        return;
      }
      
      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from('motorcycle-images')
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Error deleting motorcycle image:', error);
      throw new Error(error.message || 'Failed to delete image');
    }
  },

  /**
   * Upload multiple images
   * @param files - Array of image files
   * @returns Array of public URLs
   */
  async uploadMultipleImages(files: File[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadMotorcycleImage(file));
    return Promise.all(uploadPromises);
  },

  /**
   * Validate image file
   * @param file - The file to validate
   * @returns True if valid, throws error if invalid
   */
  validateImageFile(file: File): boolean {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, WEBP, or GIF images.');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    return true;
  },

  /**
   * Get the public URL for an uploaded file
   * @param filePath - The path of the file in storage
   * @returns The public URL
   */
  getPublicUrl(filePath: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from('motorcycle-images')
      .getPublicUrl(filePath);
    
    return publicUrl;
  },

  /**
   * List all motorcycle images
   * @returns Array of file objects
   */
  async listMotorcycleImages() {
    const { data, error } = await supabase.storage
      .from('motorcycle-images')
      .list();

    if (error) {
      console.error('Error listing images:', error);
      throw error;
    }

    return data;
  }
};
