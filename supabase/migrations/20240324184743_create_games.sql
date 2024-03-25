-- Creating an enum type for game status
CREATE TYPE game_status AS ENUM ('waiting', 'in_progress', 'finished');

CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID REFERENCES users(id),
    status game_status DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE,
    winner_id UUID REFERENCES users(id)
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Hosts can update their own games
CREATE POLICY update_own_games ON games FOR UPDATE USING (auth.uid() = host_id);

-- Anyone can read games
CREATE POLICY select_games ON games FOR SELECT USING (true);
