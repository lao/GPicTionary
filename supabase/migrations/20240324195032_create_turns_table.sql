CREATE TYPE turn_status AS ENUM ('waiting', 'in_progress', 'finished');

CREATE TABLE turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id),
    winner_id UUID REFERENCES auth.users,
    word_id UUID REFERENCES words(id),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    guesses INTEGER DEFAULT 0,
    is_tie_breaker BOOLEAN DEFAULT FALSE,
    status turn_status DEFAULT 'waiting',
    tie_break_participants UUID[] DEFAULT '{}'
);

ALTER TABLE turns ENABLE ROW LEVEL SECURITY;


-- -- Find rows where uuid_array contains a specific UUID
-- SELECT * FROM turns 
-- WHERE '{123e4567-e89b-12d3-a456-426614174000}'::UUID[] <@ tie_break_participants::UUID[];
