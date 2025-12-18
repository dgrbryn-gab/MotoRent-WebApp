-- Add reply field to contact_messages table
ALTER TABLE contact_messages
ADD COLUMN reply_message TEXT DEFAULT NULL,
ADD COLUMN replied_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for replied_at for faster queries
CREATE INDEX idx_contact_messages_replied_at ON contact_messages(replied_at DESC);

-- Add comment for clarity
COMMENT ON COLUMN contact_messages.reply_message IS 'Admin response to customer message';
COMMENT ON COLUMN contact_messages.replied_at IS 'Timestamp when admin replied to the message';
