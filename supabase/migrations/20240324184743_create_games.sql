-- Creating an enum type for game status
CREATE TYPE game_status AS ENUM ('waiting', 'in_progress', 'finished');

CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    -- host_id UUID REFERENCES auth.users,
    host_id TEXT NOT NULL,
    status game_status DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE,
    -- winner_id UUID REFERENCES auth.users
    winner_id TEXT
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Anyone can read, insert, update, or delete games
CREATE POLICY select_games ON games FOR SELECT USING (true);
CREATE POLICY insert_games ON games FOR INSERT WITH CHECK (true);
CREATE POLICY update_games ON games FOR UPDATE USING (true);
CREATE POLICY delete_games ON games FOR DELETE USING (true);

-- create function to start game receiving the slug, host_id and picking random words with 10 turns
CREATE OR REPLACE FUNCTION public.start_game(slug TEXT, host_id TEXT)
RETURNS UUID AS $$
DECLARE
    game_id UUID;
    word_ids UUID[];
    i INT;
    word_id UUID;
BEGIN
    INSERT INTO public.games (slug, host_id) VALUES (slug, host_id) RETURNING id INTO game_id;
    
    word_ids := ARRAY(SELECT id FROM public.words ORDER BY random() LIMIT 10);
    
    FOR i IN 1..10 LOOP
            word_id := word_ids[i];
            INSERT INTO public.turns (game_id, word_id, turn_order) VALUES (game_id, word_id, i);
    END LOOP;

    RETURN game_id;
END;
$$ LANGUAGE plpgsql security definer;