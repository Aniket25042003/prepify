import { Room, RoomEvent, RemoteParticipant, RemoteTrack, RemoteTrackPublication, Track } from 'livekit-client'

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'wss://your-livekit-url'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export interface LiveKitConfig {
  room: string
  identity: string
  figure: string
  topic: string
  prompt: string
}

export class LiveKitService {
  private room: Room | null = null
  private onParticipantConnected?: (participant: RemoteParticipant) => void
  private onTrackSubscribed?: (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => void
  private onDisconnected?: () => void

  async generateToken(roomName: string, participantName: string): Promise<string> {
    try {
      // Get the current user's session token
      const authToken = localStorage.getItem('sb-' + SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token')
      let accessToken = ''
      
      if (authToken) {
        const authData = JSON.parse(authToken)
        accessToken = authData.access_token
      }

      // Request token from secure backend endpoint
      const response = await fetch(`${SUPABASE_URL}/functions/v1/livekit-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          roomName,
          participantName,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate token: ${response.statusText}`)
      }

      const { token } = await response.json()
      return token

    } catch (error) {
      console.error('Error generating LiveKit token:', error)
      throw error
    }
  }

  async connectToRoom(config: LiveKitConfig): Promise<Room> {
    try {
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
      })

      // Set up event listeners
      this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        this.onParticipantConnected?.(participant)
      })

      this.room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        this.onTrackSubscribed?.(track, publication, participant)
      })

      this.room.on(RoomEvent.Disconnected, () => {
        this.onDisconnected?.()
      })

      // Generate token and connect
      const token = await this.generateToken(config.room, config.identity)
      await this.room.connect(LIVEKIT_URL, token)

      // Send agent configuration
      await this.configureAgent(config)

      return this.room
    } catch (error) {
      console.error('Error connecting to LiveKit room:', error)
      throw error
    }
  }

  private async configureAgent(config: LiveKitConfig) {
    if (!this.room) return

    // Send configuration to the AI agent
    const agentConfig = {
      type: 'agent_config',
      figure: config.figure,
      topic: config.topic,
      prompt: config.prompt,
      instructions: `You are ${config.figure}. The user wants to discuss ${config.topic} with you. ${config.prompt}`,
    }

    // Send via data channel to the agent
    await this.room.localParticipant.publishData(
      JSON.stringify(agentConfig),
      { reliable: true }
    )
  }

  async enableMicrophone(): Promise<void> {
    if (!this.room) throw new Error('Not connected to room')

    try {
      await this.room.localParticipant.setMicrophoneEnabled(true)
    } catch (error) {
      console.error('Error enabling microphone:', error)
      throw error
    }
  }

  async disableMicrophone(): Promise<void> {
    if (!this.room) throw new Error('Not connected to room')

    try {
      await this.room.localParticipant.setMicrophoneEnabled(false)
    } catch (error) {
      console.error('Error disabling microphone:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.room) {
      await this.room.disconnect()
      this.room = null
    }
  }

  setEventHandlers(handlers: {
    onParticipantConnected?: (participant: RemoteParticipant) => void
    onTrackSubscribed?: (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => void
    onDisconnected?: () => void
  }) {
    this.onParticipantConnected = handlers.onParticipantConnected
    this.onTrackSubscribed = handlers.onTrackSubscribed
    this.onDisconnected = handlers.onDisconnected
  }

  getRoom(): Room | null {
    return this.room
  }
}