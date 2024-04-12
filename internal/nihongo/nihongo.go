package nihongo

import (
	"fmt"

	"github.com/ikawaha/kagome.ipadic/tokenizer"
)

type Token struct {
	Features     []string `json:"features"`
	Start        int      `json:"start"`
	End          int      `json:"end"`
	Surface      string   `json:"surface"`
	Translation  string   `json:"translation"`
	PartOfSpeech string   `json:"partOfSpeech"`
}

func Tokenize(text string) []Token {
	t := tokenizer.New()

	var outTokens []Token

	tokens := t.Analyze(text, tokenizer.Search)
	for _, token := range tokens {
		tok := Token{}
		tok.Surface = token.Surface
		tok.End = token.End
		tok.Start = token.Start
		tok.Features = token.Features()

		translation, err := Translate(tok.Surface, "ja", "en")
		if err != nil {
			fmt.Println(err)
		}
		tok.Translation = translation
		tok.PartOfSpeech = extractPartOfSpeech(token.Features())
		outTokens = append(outTokens, tok)
	}

	for _, token := range tokens {
		fmt.Printf("%s: %s\n", token.Surface, token.Features())
	}
	return outTokens
}

func extractPartOfSpeech(features []string) string {
	if len(features) > 0 {
		return features[0]
	}
	return "Unknown"
}
