import { supabase } from '../lib/supabase';

export interface TrainingData {
  id?: number;
  question: string;
  answer: string;
  intent?: string;
  category?: string;
  confidence?: number;
  active?: boolean;
}

export interface ChatbotFeedback {
  conversation_id?: number;
  bot_response: string;
  rating: number; // 1-5
  user_comment?: string;
  helpful?: boolean;
}

/**
 * Retrieval-Augmented Generation (RAG) Service
 * Retrieves relevant training data to enhance AI responses
 */

/**
 * Get relevant training examples for a user query
 * Uses full-text search and semantic similarity
 */
export async function getRelevantTrainingData(query: string, limit = 5): Promise<TrainingData[]> {
  try {
    // Search for similar questions in training data
    const { data, error } = await supabase
      .from('chatbot_training_data')
      .select('id, question, answer, intent, category, confidence')
      .eq('active', true)
      .textSearch('question', query) // PostgreSQL full-text search
      .order('confidence', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Error fetching training data:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRelevantTrainingData:', error);
    return [];
  }
}

/**
 * Get training data by category
 */
export async function getTrainingDataByCategory(category: string, limit = 5): Promise<TrainingData[]> {
  try {
    const { data, error } = await supabase
      .from('chatbot_training_data')
      .select('*')
      .eq('active', true)
      .eq('category', category)
      .order('confidence', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching training data by category:', error);
    return [];
  }
}

/**
 * Get all training data for a specific intent
 */
export async function getTrainingDataByIntent(intent: string): Promise<TrainingData[]> {
  try {
    const { data, error } = await supabase
      .from('chatbot_training_data')
      .select('*')
      .eq('active', true)
      .eq('intent', intent)
      .order('confidence', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching training data by intent:', error);
    return [];
  }
}

/**
 * Add new training data (admin only)
 */
export async function addTrainingData(training: TrainingData): Promise<TrainingData | null> {
  try {
    const { data, error } = await supabase
      .from('chatbot_training_data')
      .insert([{
        question: training.question,
        answer: training.answer,
        intent: training.intent,
        category: training.category,
        confidence: training.confidence || 100,
        active: training.active !== false,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding training data:', error);
    return null;
  }
}

/**
 * Deactivate training data instead of deleting
 */
export async function deactivateTrainingData(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chatbot_training_data')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deactivating training data:', error);
    return false;
  }
}

/**
 * Save user feedback for continuous improvement
 */
export async function saveChatbotFeedback(feedback: ChatbotFeedback): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('chatbot_feedback')
      .insert([{
        conversation_id: feedback.conversation_id,
        bot_response: feedback.bot_response,
        rating: feedback.rating,
        user_comment: feedback.user_comment,
        helpful: feedback.helpful,
        user_id: user?.user?.id
      }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving feedback:', error);
    return false;
  }
}

/**
 * Get feedback statistics for quality monitoring
 */
export async function getFeedbackStats() {
  try {
    // Get average rating
    const { data: avgData } = await supabase
      .rpc('get_feedback_stats'); // Custom RPC function

    // If RPC not available, use basic query
    const { data, error } = await supabase
      .from('chatbot_feedback')
      .select('rating');

    if (error) throw error;

    const ratings = data?.map(d => d.rating) || [];
    const avgRating = ratings.length > 0 
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
      : 'N/A';

    const distribution = {
      '5': ratings.filter(r => r === 5).length,
      '4': ratings.filter(r => r === 4).length,
      '3': ratings.filter(r => r === 3).length,
      '2': ratings.filter(r => r === 2).length,
      '1': ratings.filter(r => r === 1).length
    };

    return { avgRating, totalFeedback: ratings.length, distribution };
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    return null;
  }
}

/**
 * Find commonly unhandled queries for retraining
 */
export async function findUnhandledQueries(limit = 20) {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('user_message, intent, COUNT(*) as frequency')
      .eq('intent', 'unknown')
      .group_by('user_message', 'intent')
      .order('frequency', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error finding unhandled queries:', error);
    return [];
  }
}

/**
 * Get statistics on bot performance
 */
export async function getChatbotStats() {
  try {
    const { data: intents, error: intentError } = await supabase
      .from('chat_conversations')
      .select('intent, COUNT(*) as count')
      .group_by('intent')
      .order('count', { ascending: false });

    if (intentError) throw intentError;

    const stats = {
      totalConversations: intents?.reduce((sum, item) => sum + item.count, 0) || 0,
      intents: intents || [],
      unknownIntents: intents?.find(i => i.intent === 'unknown')?.count || 0
    };

    return stats;
  } catch (error) {
    console.error('Error getting chatbot stats:', error);
    return null;
  }
}

export default {
  getRelevantTrainingData,
  getTrainingDataByCategory,
  getTrainingDataByIntent,
  addTrainingData,
  deactivateTrainingData,
  saveChatbotFeedback,
  getFeedbackStats,
  findUnhandledQueries,
  getChatbotStats
};
