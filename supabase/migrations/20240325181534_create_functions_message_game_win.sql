
CREATE OR REPLACE FUNCTION public.get_turn_of_game(player_game_id UUID)
RETURNS UUID AS $$
DECLARE
  turn_id UUID;
BEGIN
  SELECT t.id INTO turn_id FROM public.turns t WHERE t.game_id = player_game_id AND t.status = 'in_progress';
  RETURN turn_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- create function that retrieve player_id or insert player and return player_id
CREATE OR REPLACE FUNCTION public.get_player_id(player_game_id UUID, user_name TEXT)
RETURNS UUID AS $$
DECLARE
  player_id UUID;
BEGIN
  SELECT p.id INTO player_id FROM public.players p WHERE p.game_id = player_game_id AND p.user_id = user_name;
  
  IF player_id IS NULL THEN
    INSERT INTO public.players (game_id, user_id) VALUES (player_game_id, user_name) RETURNING id INTO player_id;
  END IF;
  
  RETURN player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- create a function that will update turn status to finished
CREATE OR REPLACE FUNCTION public.update_turn_status(turn_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.turns t SET t.status = 'finished' WHERE t.id = turn_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- create function to verify message in game answer and update player score (creates player if not exists)
CREATE OR REPLACE FUNCTION public.verify_message_in_game_answer(message TEXT, user_id TEXT, player_game_id UUID, turn_id UUID)
RETURNS VOID AS $$
DECLARE
  word_i UUID;
  turn_answer TEXT;
  player_id UUID;
  r_status turn_status;
BEGIN
  SELECT t.word_id INTO word_i FROM public.turns t WHERE t.id = turn_id;
  SELECT w.word INTO turn_answer FROM public.words w WHERE w.id = word_i;
  SELECT t.status INTO r_status FROM public.turns t WHERE t.id = turn_id;

  player_id := public.get_player_id(player_game_id, user_id);
  
  IF lower(turn_answer) = lower(message) AND r_status = 'in_progress' THEN
    UPDATE public.players 
    SET score = score + 1, 
        last_scored_turn_id = turn_id
    WHERE game_id = player_game_id 
    AND id = player_id
    AND (last_scored_turn_id IS NULL OR last_scored_turn_id != turn_id);
    -- PERFORM public.update_turn_status(turn_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER after_insert_verify_message_in_game_answer
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.after_insert_verify_message_in_game_answer();
COMMENT ON TRIGGER after_insert_verify_message_in_game_answer ON public.messages IS 'Verify that the game exists before inserting a message';