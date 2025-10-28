-- Manually add tool_calls column if migration fails

-- Add tool_calls column to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS tool_calls JSON;

-- Add comment
COMMENT ON COLUMN conversations.tool_calls IS 'Tool calls with results [{id, name, input, result, is_error}]';

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'conversations'
  AND column_name = 'tool_calls';
