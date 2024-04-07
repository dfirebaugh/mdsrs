package audio

import (
	htgotts "github.com/hegedustibor/htgo-tts"
	"github.com/hegedustibor/htgo-tts/handlers"
)

// Speak does text to speach
//
//	language should follow country codes that are two characters
//	e.g. for japanese, it would be 'ja' english would be 'en' or 'en-UK
//	additional examples are here: "github.com/hegedustibor/htgo-tts/voices"
func Speak(text string, language string) {
	speech := htgotts.Speech{Folder: ".mdsrs/audio", Language: language, Handler: &handlers.Native{}}
	speech.Speak(text)
}
