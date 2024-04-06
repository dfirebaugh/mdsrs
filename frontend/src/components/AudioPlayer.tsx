import IconButton from "./IconButton";
import { PlayAudioFile } from '../../wailsjs/go/main/App';

export default function AudioPlayer({ src }: { src?: string }) {
  return <div>
    <IconButton icon="solar:play-bold" width="2rem" height="2rem" onClick={() => {
      if (!!src) PlayAudioFile(src);
    }} />
  </div>;
}