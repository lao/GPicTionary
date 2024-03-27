import { useEffect, useState, useRef, ReactElement, Fragment } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { nanoid } from 'nanoid'
import { Badge } from '@supabase/ui'
import {
  REALTIME_LISTEN_TYPES,
  REALTIME_PRESENCE_LISTEN_EVENTS,
  REALTIME_SUBSCRIBE_STATES,
  RealtimeChannel,
  RealtimeChannelSendResponse,
} from '@supabase/supabase-js'
import supabaseClient from '../client'
import { Coordinates, Message, Payload, User } from '../types'
import { getRandomColor, getRandomColors, getRandomUniqueColor } from '../lib/RandomColor'

import Chatbox from '../components/Chatbox'
import Cursor from '../components/Cursor'
import Loader from '../components/Loader'
import Users from '../components/Users'
import WaitlistPopover from '../components/WaitlistPopover'
import DarkModeToggle from '../components/DarkModeToggle'

// Generate a random user id
const userId = nanoid()

const Room: NextPage = () => {
  let roomChannel: RealtimeChannel;
  let messageChannel: RealtimeChannel, pingChannel: RealtimeChannel;

  const chatboxRef = useRef<any>()
  const joinTimestampRef = useRef<number>()
  const [messagesInTransit, _setMessagesInTransit] = useState<string[]>([])

  const [areMessagesFetched, setAreMessagesFetched] = useState<boolean>(false)
  const [isInitialStateSynced, setIsInitialStateSynced] = useState<boolean>(false)
  const [gameCreated, setGameCreated] = useState<boolean>(false)
  const [latency, setLatency] = useState<number>(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [roomSlug, setRoomSlug] = useState<undefined | string>(undefined)
  const [users, setUsers] = useState<{ [key: string]: User }>({})
  const [turns, setTurns] = useState<any[]>([])
  const [gameId, setGameId] = useState<string>('')

  const startGame = async (roomId: string) => {
    const { data, error } = await supabaseClient.rpc('start_game', { slug: roomId, host_id: userId })

    if (error) {
      console.error(error)
      return
    }

    console.log(data)
    return data;
  }

  const updateTurn = async (turnId: string, action: string, turn: any) => {
    const { data, error } = await supabaseClient.from('turns').update({ status: action }).eq('id', turnId)
    if (error) {
      console.error(error)
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
    console.log(data)
    return data;
  }


  const startListeners = (roomId: string) => {
    roomChannel = supabaseClient.channel('rooms', { config: { presence: { key: roomId } } })
    roomChannel.on(
      REALTIME_LISTEN_TYPES.PRESENCE,
      { event: REALTIME_PRESENCE_LISTEN_EVENTS.SYNC },
      () => {
        setIsInitialStateSynced(true)
        // mapInitialUsers(roomChannel, roomId)
      }
    )
    roomChannel.subscribe(async (status: `${REALTIME_SUBSCRIBE_STATES}`) => {
      if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        const resp: RealtimeChannelSendResponse = await roomChannel.track({ user_id: userId })

        console.log('Subscribed to room:', roomId)
        console.log(resp)
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
      console.error(error)
      return
    }

    console.log(data)

    const promises = data.map(async (turn: any) => {
        const { word_id: wordId } = turn
        const result = await supabaseClient
          .from('words')
          .select('*')
          .eq('id', wordId)
          .single()

        const { data, error } = result

        if (error) {
          console.error(error)
          return
        }

        return {
          turn,
          word: data,
        }
      }
    )
    const turns = await Promise.all(promises)
    console.log(turns)


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
        console.error(error)
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
          {/* add line separator */}
          <div className="w-1 h-5 bg-scale-1200 "></div>
          <div className="flex items-center justify-center space-x-2 border border-scale-1200 rounded-md px-3 py-2 ">
            <p className="text-scale-1200 cursor-default text-sm">Latency</p>
            <code className="bg-scale-1100 text-scale-100 px-1 h-6 rounded flex items-center justify-center">
              {latency}
            </code>
          </div>
        </div>
        <div className="absolute top-30 right-0 p-4">
          {/* Add a list  */}
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

              {/* add action buttons */}
              <button
                className="bg-scale-1100 text-scale-100 px-1 h-6 rounded flex items-center justify-center"
                onClick={() => {
                  updateTurn(turn.id, 'in_progress', turn)
                  // 'waiting', 'in_progress', 'finished'
                }}
              >
                Start
              </button>

              <button
                className="bg-scale-1100 text-scale-100 px-1 h-6 rounded flex items-center justify-center"
                onClick={() => {
                  updateTurn(turn.id, 'waiting', turn)
                  // 'waiting', 'in_progress', 'finished'
                }}
              >
                Waiting
              </button>

              <button
                className="bg-scale-1100 text-scale-100 px-1 h-6 rounded flex items-center justify-center"
                onClick={() => {
                  updateTurn(turn.id, 'finished', turn)
                  // 'waiting', 'in_progress', 'finished'
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
