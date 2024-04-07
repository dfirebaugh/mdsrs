import IconButton from "./IconButton";
import { PlayAudioFile, Speak } from '../../wailsjs/go/main/App';

export default function AudioPlayer({ src, tts, language }: { src?: string, tts?:string, language?: string }) {
  return <div>
    <IconButton icon="solar:play-bold" width="2rem" height="2rem" onClick={() => {
      if (!!tts && !!language) Speak(tts, language)
      if (!!src) PlayAudioFile(src);
      }} />
  </div>;
}
