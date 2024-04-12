import IconButton from "./IconButton";
import { PlayAudioFile, Speak, Tokenize } from '../../wailsjs/go/main/App';
import "./AudioPlayer.css"
import TokenizedJapanese from "./TokenizedJapanese";

export default function AudioPlayer({ src, tts, language }: { src?: string, tts?: string, language?: string }) {
  return (
    <div style={{ display: "flex", alignContent: "center" }}>
      {language === "ja" ? <TokenizedJapanese text={tts} /> : tts}
      <IconButton icon="solar:play-bold" width="1rem" height="1rem" onClick={() => {
        if (!!tts && !!language) Speak(tts, language);
        if (!!src) PlayAudioFile(src);
      }} />
    </div>
  );
}