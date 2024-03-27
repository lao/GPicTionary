CREATE TABLE words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL,
    difficulty TEXT,
    svg TEXT,
    height INT,
    width INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

-- nobody can read words
CREATE POLICY select_words ON words FOR SELECT USING (false);

-- nobody can insert words
CREATE POLICY insert_words ON words FOR INSERT WITH CHECK (false);

-- nobody can update words
CREATE POLICY update_words ON words FOR UPDATE USING (false);

-- nobody can delete words
CREATE POLICY delete_words ON words FOR DELETE USING (false);
