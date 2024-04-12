import { useEffect, useState } from "react";
import { Speak, Tokenize } from "../../wailsjs/go/main/App";
import { nihongo } from "../../wailsjs/go/models";
import "./TokenizedJapanese.css";

export default function TokenizedJapanese({ text }: { text: string | undefined }) {
  const [tokenizedResponse, setTokenizedResponse] = useState<Array<nihongo.WordInfo>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!text) return;
    Tokenize(text).then((response) => {
      setTokenizedResponse(response)
      setIsLoading(false)
    });
  }, [text]);

  if (!tokenizedResponse.length && !!text) {
    return <>{text}</>
  }

  return <>
    <div>
      {isLoading && "..."}
      {!!tokenizedResponse.length && tokenizedResponse.map((token, i) => (
        <span key={i} className="token-tooltip">
          <span className="token" onClick={() => {
            Speak(token.surface, "ja")
          }}>{token.surface}</span>
          <span className="tooltip-text">
            <div>{token.surface}</div>
            <div className="definition-container">
              <div className="definitions definition-info">
                <h2>Definitions</h2>
                {token.definitions?.map((def, index) => <h5 key={index}>{def}</h5>)}
              </div>
              <hr />
              <div className="parts-of-speech definition-info">
                <h2>Parts of Speech</h2>
                {token.partsOfSpeech?.map((pos, index) => <h5 key={index}>{pos}</h5>)}
              </div>
              <hr />
              <div className="notes definition-info">
                <h3>Notes</h3>
                {token.notes?.map((note, index) => <h5 key={index}>{note}</h5>)}
              </div>
            </div>
          </span>
        </span>
      ))}
    </div>
  </>
}
