CREATE TYPE turn_status AS ENUM ('waiting', 'in_progress', 'finished');

CREATE TABLE turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id),
    -- winner_id UUID REFERENCES auth.users,
    winner_id TEXT,
    word_id UUID REFERENCES words(id),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    status turn_status DEFAULT 'waiting',
    turn_order INT,
    
    is_tie_breaker BOOLEAN DEFAULT FALSE,
    tie_break_participants UUID[] DEFAULT '{}'
);

ALTER TABLE turns ENABLE ROW LEVEL SECURITY;

-- allow anyone to read, insert, update, or delete turns
CREATE POLICY select_turns ON turns FOR SELECT USING (true);
CREATE POLICY insert_turns ON turns FOR INSERT WITH CHECK (true);
CREATE POLICY update_turns ON turns FOR UPDATE USING (true);
CREATE POLICY delete_turns ON turns FOR DELETE USING (true);


-- -- Find rows where uuid_array contains a specific UUID
-- SELECT * FROM turns 
-- WHERE '{123e4567-e89b-12d3-a456-426614174000}'::UUID[] <@ tie_break_participants::UUID[];
