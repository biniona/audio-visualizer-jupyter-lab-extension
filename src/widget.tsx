import { ReactWidget } from "@jupyterlab/apputils";
import React from "react";
import axios from "axios";

const DEEZER_RESPONSE_LIMIT = 20;
const URL_BASE = `https://cors-anywhere.herokuapp.com/api.deezer.com/search/track/?limit=${DEEZER_RESPONSE_LIMIT}&q=`;
const CANVAS_HEIGHT = 300;
const CANVAS_WIDTH = 300;
const FTT_SIZE = 64;

function sleep(ms: number) {
  /**
   * wait ms number of milliseconds
   */
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class DeezerSearch extends React.Component<
  DeezerSearchProps,
  DeezerSearchState
> {
  last_search: Number;

  constructor(props: DeezerSearchProps) {
    super(props);
    this.searchDeezer = this.searchDeezer.bind(this);
    this.last_search = Date.now();
    this.state = { songs: [] };
  }

  async searchDeezer(event: React.ChangeEvent<HTMLInputElement>) {
    /**
     * query deezer for songs by name
     *
     * This function is responsible for saying
     * this.state.songs by querying the Deezer API.
     * There is a 1/2 second delay on the query
     * to prevent sending an api per change event,
     * as the Deezer API rate limits requests.
     */
    const query_paramater = event.target.value;
    const search_url = `${URL_BASE}${query_paramater}`;
    const current_search = Date.now();
    this.last_search = current_search;
    await sleep(500);
    if (
      current_search === this.last_search &&
      query_paramater !== null &&
      query_paramater !== ""
    ) {
      axios.get(search_url).then((response) => {
        let new_songs = [];
        for (const track of response.data.data) {
          if (track.preview !== undefined) {
            if (
              new_songs.find((o) => o.preview === track.preview) === undefined
            ) {
              new_songs.push({
                title: track.title,
                artist: track.artist.name,
                preview: track.preview,
              });
            }
          }
        }
        this.setState({
          songs: new_songs.slice(0, Math.min(10, new_songs.length)),
        });
      });
    }
  }

  render(): JSX.Element {
    return (
      <div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          action=""
        >
          <label>
            Search For Songs In Deezer: <br />
            <input
              type="text"
              name="name"
              onChange={this.searchDeezer}
              placeholder="Ex: Free Bird"
            />
          </label>
        </form>
        {this.state.songs.map((song, index) => {
          return (
            <div key={`song-${index}`}>
              <button
                className="deezer-song-button"
                onClick={() => {
                  this.props.sendMusicURL(song.preview);
                }}
              >
                {`${song.title} -- By: ${song.artist}`}
              </button>
              <br />
            </div>
          );
        })}
      </div>
    );
  }
}

class AudioVisualizer extends React.Component<any, AudioVisualState> {
  /**
   * visualizes frequency of deezer songs
   *
   * responsible for rendering frequency
   * visualization component and Deezer Search
   * bar.
   */

  ctx: AudioContext;
  analyser: AnalyserNode;
  dataArray: Uint8Array;
  playing: Boolean;
  url: string;

  constructor(props: any) {
    super(props);
    this.url = "";
    this.ctx = new window.AudioContext();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = FTT_SIZE;
    let bufferLength = this.analyser.frequencyBinCount;
    this.updateCanvas = this.updateCanvas.bind(this);
    this.retrieve_audio_and_play = this.retrieve_audio_and_play.bind(this);
    this.updateFrequencyGraphUntilComplete = this.updateFrequencyGraphUntilComplete.bind(
      this
    );
    this.dataArray = new Uint8Array(bufferLength);
    this.playing = false;
    this.state = {
      current_audio: null,
      spectrum: this.dataArray,
    };
  }

  retrieve_audio_and_play(url: string) {
    /**
     *handles retrieving audio and setting up related event listeners
     *
     *This function handles setting up an audio stream
     *from a url and creating event listeners for the pause/play
     *button related to that url.
     *the audio stream handling code is largely base off this blogpost:
     *http://ianreah.com/2013/02/28/Real-time-analysis-of-streaming-audio-data-with-Web-Audio-API.html
     */

    if (
      this.state.current_audio === null ||
      (this.url !== "" && this.url !== url)
    ) {
      this.url = url;
      if (this.state.current_audio !== null) {
        this.state.current_audio.pause();
        this.state.current_audio.remove();
      }
      const audio = document.createElement("audio");
      audio.crossOrigin = "anonymous";
      audio.src = url;
      audio.addEventListener("canplay", () => {
        let source = this.ctx.createMediaElementSource(audio);
        audio.crossOrigin = "anonymous";
        audio.play();
        source.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      });
      audio.addEventListener("playing", () => {
        this.playing = true;
        this.updateFrequencyGraphUntilComplete();
      });
      audio.addEventListener("paused", () => {
        this.playing = false;
      });
      audio.addEventListener("paused", () => {
        this.playing = false;
      });
      this.setState({ current_audio: audio });
    } else {
      if (this.playing) {
        this.playing = false;
        this.state.current_audio.pause();
      } else {
        this.state.current_audio.play();
      }
    }
  }

  async updateFrequencyGraphUntilComplete() {
    /**
     * update spectrum while music is playing
     */
    while (this.playing) {
      this.analyser.getByteFrequencyData(this.dataArray);
      this.setState({ spectrum: this.dataArray });
      await sleep(20);
    }
  }

  updateCanvas(): void {
    /**
     * graph frequency spectrum from analyzer
     */
    if (this.state.spectrum !== null) {
      const canvas = document.getElementById(
        "audio_canvas"
      ) as HTMLCanvasElement;
      if (canvas !== null) {
        const canvas_context = canvas.getContext("2d");
        console.log(canvas);
        if (canvas_context !== null) {
          canvas_context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          canvas_context.fillStyle = "#000000";
          canvas_context.fillRect(0, 0, 300, 300);
          let column_width = Math.ceil(
            CANVAS_WIDTH / (this.state.spectrum.length * 2)
          );
          let i = 0;
          for (const freq of Array.from(this.state.spectrum)) {
            canvas_context.fillStyle = "#FF0000";
            canvas_context.fillRect(
              column_width * i,
              CANVAS_HEIGHT - freq,
              column_width * (i + 1),
              CANVAS_HEIGHT
            );
            i += 1;
          }
        }
      }
    }
  }

  render(): JSX.Element {
    this.updateCanvas();
    return (
      <div>
        <canvas id="audio_canvas" width={300} height={300} />
        <DeezerSearch sendMusicURL={this.retrieve_audio_and_play} />
      </div>
    );
  }
}

/**
 * A Counter Lumino Widget that wraps a CounterComponent.
 */
export class AudioVisualizerJupyter extends ReactWidget {
  /**
   * Constructs a new CounterWidget.
   */
  constructor() {
    super();
    this.addClass("jp-ReactWidget");
  }

  render(): JSX.Element {
    return (
      <div>
        <AudioVisualizer />
      </div>
    );
  }
}
