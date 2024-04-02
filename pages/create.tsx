import { useEffect, useState, useRef } from 'react'
import type { NextPage } from 'next'
import { nanoid } from 'nanoid'
import {
  REALTIME_LISTEN_TYPES,
  REALTIME_PRESENCE_LISTEN_EVENTS,
  REALTIME_SUBSCRIBE_STATES,
  RealtimeChannel,
  RealtimeChannelSendResponse,
} from '@supabase/supabase-js'
import supabaseClient from '../client'

// Generate a random user id
const userId = nanoid()

const log = (...args: any[]) => {
  if (process.env.NODE_ENV === 'production') return
  log(...args)
}

const Room: NextPage = () => {
  let roomChannel: RealtimeChannel;
  let messageChannel: RealtimeChannel, pingChannel: RealtimeChannel;

  const joinTimestampRef = useRef<number>()
  const [gameCreated, setGameCreated] = useState<boolean>(false)
  const [roomSlug, setRoomSlug] = useState<undefined | string>(undefined)
  const [turns, setTurns] = useState<any[]>([])
  const [gameId, setGameId] = useState<string>('')

  const startGame = async (roomId: string) => {
    const { data, error } = await supabaseClient.rpc('start_game', { slug: roomId, host_id: userId })

    if (error) {
      log(error)
      return
    }

    log(data)
    return data;
  }

  const updateTurn = async (turnId: string, action: string, turn: any) => {
    const { data, error } = await supabaseClient.from('turns').update({ status: action }).eq('id', turnId)
    if (error) {
      log(error)
      return
    }

    if (action === 'in_progress') {
      messageChannel = supabaseClient.channel(`chat_messages:${roomSlug}`)

      messageChannel
        .send({
          type: 'broadcast',
          event: 'MESSAGE',
          payload: { status: 'in_progress', data: turn },
        })
        .catch(() => { })
    }

    if (action === 'finished') {
      messageChannel = supabaseClient.channel(`chat_messages:${roomSlug}`)

      messageChannel
        .send({
          type: 'broadcast',
          event: 'MESSAGE',
          payload: { status: 'finished', data: turn },
        })
        .catch(() => { })
    }
    await loadTurns(gameId)
    log(data)
    return data;
  }


  const startListeners = (roomId: string) => {
    roomChannel = supabaseClient.channel('rooms', { config: { presence: { key: roomId } } })
    roomChannel.subscribe(async (status: `${REALTIME_SUBSCRIBE_STATES}`) => {
      if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        const resp: RealtimeChannelSendResponse = await roomChannel.track({ user_id: userId })

        log('Subscribed to room:', roomId)
        log(resp)
      }
    })
  }

  const loadTurns = async (gamedId: string) => {
    const result = await supabaseClient.from('turns')
                                       .select('*')
                                       .eq('game_id', gamedId)
                                       .order('turn_order', { ascending: true })
    const { data, error } = result

    if (error) {
      log(error)
      return
    }

    log(data)

    const promises = data.map(async (turn: any) => {
        const { word_id: wordId } = turn
        const result = await supabaseClient
          .from('words')
          .select('*')
          .eq('id', wordId)
          .single()

        const { data, error } = result

        if (error) {
          log(error)
          return
        }

        return {
          turn,
          word: data,
        }
      }
    )
    const turns = await Promise.all(promises)
    log(turns)

    setTurns(turns as any[])
    return turns;
  }

  useEffect(() => {
    let roomChannel: RealtimeChannel
    let random = nanoid()

    // roomId is undefined when user first attempts to join a room
    const slugRoomId = window.prompt('Enter a room ID', random) || ''
    joinTimestampRef.current = performance.now()

    startGame(slugRoomId)
      .then((data) => {
        setGameId(data)
        startListeners(slugRoomId)
        loadTurns(data)
          .then(() => {
            setGameCreated(true)
            setRoomSlug(slugRoomId)
          })
      }
      ).catch((error) => {
        log(error)
      })

    // Must properly remove subscribed channel
    return () => {
      roomChannel && supabaseClient.removeChannel(roomChannel)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div>
    <div className="bg-scale-200 h-60 w-screen flex flex-col items-center justify-center space-y-4">
      <span className="flex h-5 w-5 relative">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-900 opacity-75" />
        <span className="relative inline-flex rounded-full h-full w-full bg-green-900" />
      </span>
    </div>
    {
      gameCreated && <div>
        <div className="absolute top-30 left-0 w-full h-3 flex items-center justify-center space-x-2 pointer-events-none">
          <div className="flex items-center justify-center space-x-2 border border-scale-1200 rounded-md px-3 py-2 ">
            <p className="text-scale-1200 cursor-default text-sm">Room ID</p>
            <code className="bg-scale-1100 text-scale-100 px-1 h-6 rounded flex items-center justify-center">
              {roomSlug}
            </code>
          </div>
          <div className="w-1 h-5 bg-scale-1200 "></div>
        </div>
        <div className="absolute top-30 right-0 p-4">
          <br />
          {turns.map(({turn, word}, index) => {
            return <div 
              key={index}
              className="flex items-center justify-center space-x-2 border border-scale-1200 rounded-md px-3 py-2 mt-2"
              style={{ borderColor: turn.status === 'in_progress' ? 'green' : turn.status === 'finished' ? 'blue' : 'red' }}
            >
              <p className="text-scale-1200 cursor-default text-sm">Turn {index + 1}</p>
              <code className="bg-scale-1100 text-scale-100 px-1 h-40 rounded flex items-center justify-center">
                {JSON.stringify(turn)}
                {word.word}
              </code>
              <div className="w-1 h-5 bg-scale-1200 "></div>

              <button
                className="bg-scale-1100 text-scale-100 px-1 h-6 rounded flex items-center justify-center"
                onClick={() => {
                  updateTurn(turn.id, 'in_progress', turn)
                }}
              >
                Start
              </button>

              <button
                className="bg-scale-1100 text-scale-100 px-1 h-6 rounded flex items-center justify-center"
                onClick={() => {
                  updateTurn(turn.id, 'waiting', turn)
                }}
              >
                Waiting
              </button>

              <button
                className="bg-scale-1100 text-scale-100 px-1 h-6 rounded flex items-center justify-center"
                onClick={() => {
                  updateTurn(turn.id, 'finished', turn)
                }}
              >
                Finish
              </button>
            </div>
          }
          )}
        </div>
      </div>
    }
  </div>
}

export default Room
