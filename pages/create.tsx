import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import {
  REALTIME_SUBSCRIBE_STATES,
  RealtimeChannel,
  RealtimeChannelSendResponse,
} from '@supabase/supabase-js';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter 
} from '../components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  PlusIcon, 
  PlayIcon, 
  CheckIcon, 
  SpinnerIcon 
} from '../components/ui/icons';
import supabaseClient from '../client';

const userId = nanoid();

const Room = () => {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [gameCreated, setGameCreated] = useState(false);
  const [turns, setTurns] = useState<any[]>([]);
  const [gameId, setGameId] = useState('');
  const [isAddingTurn, setIsAddingTurn] = useState(false);
  const [newTurnWord, setNewTurnWord] = useState('');
  
  let roomChannel: RealtimeChannel | undefined;
  let messageChannel: RealtimeChannel | undefined;

  const generateRoomId = () => {
    const newId = nanoid(8).toLowerCase();
    setRoomId(newId);
  };

  const startGame = async (roomId: string) => {
    const { data, error } = await supabaseClient.rpc('start_game', { 
      slug: roomId, 
      host_id: userId 
    });

    if (error) {
      console.error(error);
      return;
    }

    return data;
  };

  const updateTurn = async (turnId: string, action: string, turn: any) => {
    const { error } = await supabaseClient
      .from('turns')
      .update({ status: action })
      .eq('id', turnId);

    if (error) {
      console.error(error);
      return;
    }

    messageChannel = supabaseClient.channel(`chat_messages:${roomId}`);
    messageChannel
      .send({
        type: 'broadcast',
        event: 'MESSAGE',
        payload: { status: action, data: turn },
      })
      .catch(console.error);

    await loadTurns(gameId);
  };

  const addNewTurn = async () => {
    if (!newTurnWord.trim()) return;

    const { data: wordData, error: wordError } = await supabaseClient
      .from('words')
      .insert([{ word: newTurnWord }])
      .select()
      .single();

    if (wordError) {
      console.error(wordError);
      return;
    }

    const { error: turnError } = await supabaseClient
      .from('turns')
      .insert([{
        game_id: gameId,
        word_id: wordData.id,
        turn_order: turns.length + 1,
        status: 'pending'
      }]);

    if (turnError) {
      console.error(turnError);
      return;
    }

    setNewTurnWord('');
    setIsAddingTurn(false);
    await loadTurns(gameId);
  };

  const startListeners = (roomId: string) => {
    roomChannel = supabaseClient.channel('rooms', { 
      config: { presence: { key: roomId } } 
    });
    
    roomChannel?.subscribe(async (status: `${REALTIME_SUBSCRIBE_STATES}`) => {
      if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        await roomChannel?.track({ user_id: userId });
      }
    });
  };

  const loadTurns = async (gameId: string) => {
    const { data: turnsData, error: turnsError } = await supabaseClient
      .from('turns')
      .select('*')
      .eq('game_id', gameId)
      .order('turn_order', { ascending: true });

    if (turnsError) {
      console.error(turnsError);
      return;
    }

    const promises = turnsData.map(async (turn: any) => {
      const { data: wordData, error: wordError } = await supabaseClient
        .from('words')
        .select('*')
        .eq('id', turn.word_id)
        .single();

      if (wordError) {
        console.error(wordError);
        return;
      }

      return {
        turn,
        word: wordData,
      };
    });

    const turns = await Promise.all(promises);
    setTurns(turns);
    return turns;
  };

  const createRoom = async () => {
    if (!roomId.trim()) return;
    
    setIsCreatingRoom(true);
    
    try {
      const gameId = await startGame(roomId);
      setGameId(gameId);
      startListeners(roomId);
      await loadTurns(gameId);
      setGameCreated(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {!gameCreated ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Create New Room</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Room ID</label>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Enter room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toLowerCase())}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={generateRoomId}
                    className="whitespace-nowrap"
                  >
                    Generate ID
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  This ID will be used to join the room later
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={createRoom}
              disabled={isCreatingRoom || !roomId.trim()}
              className="w-full"
            >
              {isCreatingRoom ? (
                <>
                  <SpinnerIcon /> 
                  <span className="ml-2">Creating...</span>
                </>
              ) : (
                'Create Room'
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Room ID: {roomId}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {turns.map(({turn, word}, index) => (
                  <Card key={index} className="border-l-4" style={{
                    borderLeftColor: 
                      turn.status === 'in_progress' ? '#22c55e' : 
                      turn.status === 'finished' ? '#3b82f6' : 
                      '#ef4444'
                  }}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">Turn {index + 1}</p>
                        <p className="text-gray-500">{word.word}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant={turn.status === 'in_progress' ? 'default' : 'outline'}
                          onClick={() => updateTurn(turn.id, 'in_progress', turn)}
                          className="flex items-center"
                        >
                          <PlayIcon />
                          <span className="ml-1">Start</span>
                        </Button>
                        <Button
                          size="sm"
                          variant={turn.status === 'finished' ? 'default' : 'outline'}
                          onClick={() => updateTurn(turn.id, 'finished', turn)}
                          className="flex items-center"
                        >
                          <CheckIcon />
                          <span className="ml-1">Complete</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Dialog open={isAddingTurn} onOpenChange={setIsAddingTurn}>
                <DialogTrigger asChild>
                  <Button className="w-full flex items-center">
                    <PlusIcon />
                    <span className="ml-2">Add New Turn</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Turn</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      type="text"
                      placeholder="Enter word for this turn"
                      value={newTurnWord}
                      onChange={(e) => setNewTurnWord(e.target.value)}
                    />
                    <Button 
                      className="w-full" 
                      onClick={addNewTurn}
                      disabled={!newTurnWord.trim()}
                    >
                      Add Turn
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Room;
