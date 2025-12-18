import { supabase } from '../lib/supabase';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  status: 'new' | 'read' | 'responded';
}

export const contactService = {
  // Get all contact messages
  async getAllMessages(): Promise<ContactMessage[]> {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get a single message by ID
  async getMessageById(id: string): Promise<ContactMessage | null> {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Mark message as read
  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status: 'read' })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  // Mark message as responded
  async markAsResponded(id: string): Promise<void> {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status: 'responded' })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  // Delete a message
  async deleteMessage(id: string): Promise<void> {
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  // Create a contact message (when form is submitted)
  async createMessage(data: {
    name: string;
    email: string;
    message: string;
  }): Promise<ContactMessage> {
    const { data: result, error } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: data.name,
          email: data.email,
          message: data.message,
          status: 'new'
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return result;
  }
};
