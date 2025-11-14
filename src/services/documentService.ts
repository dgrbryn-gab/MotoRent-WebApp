import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type DocumentVerification = Database['public']['Tables']['document_verifications']['Row'];
type DocumentVerificationInsert = Database['public']['Tables']['document_verifications']['Insert'];
type DocumentVerificationUpdate = Database['public']['Tables']['document_verifications']['Update'];

// File validation constants
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const documentService = {
  // Validate file before upload
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload JPG, PNG, or PDF files only.'
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'File size exceeds 5MB limit. Please upload a smaller file.'
      };
    }

    return { valid: true };
  },

  // Upload file to Supabase Storage
  async uploadFile(file: File, userId: string, documentType: 'driver-license' | 'valid-id' | 'profile-picture'): Promise<string> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Create unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${userId}/${documentType}-${timestamp}-${sanitizedFileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Return the file path
      return data.path;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // Get public URL for a document
  getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // Get signed URL (for private access)
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  // Delete file from storage
  async deleteFile(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from('documents')
      .remove([filePath]);

    if (error) throw error;
  },
  // Get all documents (admin)
  async getAllDocuments() {
    const { data, error } = await supabase
      .from('document_verifications')
      .select(`
        *,
        user:users(*),
        reviewer:admin_users(*)
      `)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get user's documents
  async getUserDocuments(userId: string) {
    const { data, error } = await supabase
      .from('document_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get documents by status
  async getDocumentsByStatus(status: 'pending' | 'approved' | 'rejected') {
    const { data, error } = await supabase
      .from('document_verifications')
      .select(`
        *,
        user:users(*)
      `)
      .eq('status', status)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get pending count
  async getPendingCount() {
    const { count, error } = await supabase
      .from('document_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw error;
    return count || 0;
  },

  // Submit document
  async submitDocument(document: DocumentVerificationInsert) {
    const { data, error } = await supabase
      .from('document_verifications')
      .insert(document)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Approve document
  async approveDocument(id: string, reviewerId: string) {
    // Update document status
    const { data, error } = await supabase
      .from('document_verifications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId,
        rejection_reason: null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Document approved');
    
    // Note: Reservation auto-approval is now handled by AdminReservations
    // to avoid duplicate notifications and ensure proper workflow

    return data;
  },

  // Reject document
  async rejectDocument(id: string, reviewerId: string, reason: string) {
    // Update document status
    const { data, error } = await supabase
      .from('document_verifications')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId,
        rejection_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log('❌ Document rejected');
    
    // Note: Reservation auto-cancellation is now handled by AdminReservations
    // to avoid duplicate notifications and ensure proper workflow

    return data;
  },

  // Bulk reject all pending documents for a user
  async rejectAllUserDocuments(userId: string, reviewerId: string, reason: string) {
    const { data, error } = await supabase
      .from('document_verifications')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId,
        rejection_reason: reason
      })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .select();

    if (error) throw error;

    console.log(`✅ Rejected ${data?.length || 0} documents for user`);
    
    return data;
  },

  // Bulk approve all pending documents for a user
  async approveAllUserDocuments(userId: string, reviewerId: string) {
    const { data, error } = await supabase
      .from('document_verifications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId,
        rejection_reason: null
      })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .select();

    if (error) throw error;

    console.log(`✅ Approved ${data?.length || 0} documents for user`);
    
    return data;
  },

  // Delete document
  async deleteDocument(id: string) {
    // First, get the document to find the file path
    const { data: doc, error: fetchError } = await supabase
      .from('document_verifications')
      .select('document_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching document:', fetchError);
      throw fetchError;
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('document_verifications')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting document from database:', deleteError);
      throw deleteError;
    }

    // Delete file from storage
    if (doc?.document_url) {
      try {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([doc.document_url]);

        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Don't throw - database record is already deleted
        } else {
          console.log('✅ File deleted from storage:', doc.document_url);
        }
      } catch (storageError) {
        console.error('Storage deletion failed:', storageError);
        // Don't throw - database record is already deleted
      }
    }

    console.log('✅ Document deleted successfully:', id);
  }
};
