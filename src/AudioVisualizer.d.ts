declare type AudioVisualState = {
  current_audio : HTMLAudioElement | null,
  spectrum : Uint8Array
}

declare type SongObject = {
  title: string, 
  artist: string,
  preview :string
}

declare type DeezerSearchProps = {
  sendMusicURL : Function
}

declare type DeezerSearchState = {
  songs : Array<SongObject>
}