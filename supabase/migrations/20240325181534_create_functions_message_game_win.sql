-- create function to return turn of game_id
CREATE OR REPLACE FUNCTION public.get_turn_of_game(game_id UUID)
RETURNS UUID AS $$
DECLARE
  turn_id UUID;
BEGIN
  SELECT id INTO turn_id FROM public.turns WHERE game_id = game_id AND status = 'in_progress';
  RETURN turn_id;
END;
$$ LANGUAGE plpgsql;

-- create function that retrieve player_id or insert player and return player_id
CREATE OR REPLACE FUNCTION public.get_player_id(game_id UUID, user_id TEXT)
RETURNS UUID AS $$
DECLARE
  player_id UUID;
BEGIN
  SELECT id INTO player_id FROM public.players WHERE game_id = game_id AND user_id = user_id;
  
  IF player_id IS NULL THEN
    INSERT INTO public.players (game_id, user_id) VALUES (game_id, user_id) RETURNING id INTO player_id;
  END IF;
  
  RETURN player_id;
END;
$$ LANGUAGE plpgsql;

-- create function to verify message in game answer and update player score (creates player if not exists)
CREATE OR REPLACE FUNCTION public.verify_message_in_game_answer(message TEXT, user_id TEXT, game_id UUID, turn_id UUID)
RETURNS VOID AS $$
DECLARE
  turn_answer TEXT;
  player_id UUID;
BEGIN
  SELECT word_id INTO turn_answer FROM public.turns WHERE id = turn_id;
  SELECT word INTO turn_answer FROM public.words WHERE id = turn_answer;
  
  IF turn_answer = message THEN
    player_id := public.get_player_id(game_id, user_id);

    UPDATE public.players SET score = score + 1 WHERE game_id = game_id AND user_id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- create trigger for after insert
CREATE OR REPLACE FUNCTION public.after_insert_verify_message_in_game_answer()
RETURNS TRIGGER AS $$
DECLARE
  id UUID;
  turn_id UUID;
  turn_answer TEXT;
BEGIN
  SELECT g.id INTO id FROM public.games g WHERE g.slug = NEW.room_id;

  IF id IS NOT NULL THEN
    turn_id := public.get_turn_of_game(id);
    
    IF turn_id IS NOT NULL THEN
      PERFORM verify_message_in_game_answer(NEW.message, NEW.user_id, id, turn_id);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_insert_verify_message_in_game_answer
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.after_insert_verify_message_in_game_answer();
COMMENT ON TRIGGER after_insert_verify_message_in_game_answer ON public.messages IS 'Verify that the game exists before inserting a message';


