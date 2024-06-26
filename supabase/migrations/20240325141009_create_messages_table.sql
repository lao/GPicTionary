CREATE TABLE public.messages (
  id            BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  message       TEXT,
  user_id       TEXT NOT NULL,
  room_id       TEXT NOT NULL
);
COMMENT ON TABLE public.messages IS 'Individual messages sent by each user in a room.';
