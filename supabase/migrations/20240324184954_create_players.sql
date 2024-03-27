CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id),
    -- user_id UUID REFERENCES auth.users,
    user_id TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    last_scored_turn_id UUID,
    is_drawing BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    -- nickname TEXT UNIQUE NOT NULL
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;