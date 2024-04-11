package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/dfirebaugh/mdsrs/internal/nihongo"
	"github.com/ikawaha/kagome-dict/ipa"
	"github.com/ikawaha/kagome/v2/tokenizer"
	"github.com/sirupsen/logrus"
)

type Subtitle struct {
	Index     int
	TimeRange string
	Text      []string
}

type WordInfo struct {
	Word      string
	Count     int
	Sentences map[string]struct{}
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run main.go <srt_file>")
		os.Exit(1)
	}

	filename := os.Args[1]
	file, err := os.Open(filename)
	if err != nil {
		fmt.Println("Error opening file:", err)
		os.Exit(1)
	}
	defer file.Close()

	subtitles, err := parseSRT(file)
	if err != nil {
		fmt.Println("Error parsing SRT file:", err)
		os.Exit(1)
	}

	count := 0
	wordFrequencies := tokenizeAndCountWords(subtitles)

	var wordFreqPairs []WordInfo
	for word, info := range wordFrequencies {
		if isParticle(word) || isPunctuation(word) {
			continue
		}
		var sentences []string
		for sentence := range info.Sentences {
			sentences = append(sentences, sentence)
		}
		sort.Strings(sentences)

		english, _ := nihongo.Translate(word, "ja", "en")
		writeMDFile(word, english, info.Count, sentences)
	}

	sort.Slice(wordFreqPairs, func(i, j int) bool {
		return wordFreqPairs[i].Count > wordFreqPairs[j].Count
	})

	for word, info := range wordFrequencies {
		var sentences []string
		for sentence := range info.Sentences {
			sentences = append(sentences, sentence)
		}
		sort.Strings(sentences)

		english, _ := nihongo.Translate(word, "ja", "en")
		writeMDFile(word, english, info.Count, sentences)
	}
	println(count)
}

func writeMDFile(japaneseText string, englishText string, frequency int, sentences []string) {
	os.Mkdir(".mdsrs/decks/dragonball", 0755)
	file, err := os.Create(filepath.Join(".mdsrs/decks/dragonball", strings.Replace(japaneseText, "?", "", -1)+".md"))
	if err != nil {
		panic(err)
	}
	defer file.Close()

	_, err = file.WriteString(fmt.Sprintf("# %s\n\n<audio tts=\"%s\" language=\"ja\"></audio>\n\n", japaneseText, japaneseText))
	if err != nil {
		logrus.Error(err)
	}

	for _, sentence := range sentences {
		_, err = file.WriteString(fmt.Sprintf("- %s\n", sentence))
		if err != nil {
			panic(err)
		}
	}

	_, err = file.WriteString(fmt.Sprintf("\n\n<card-back>\n\n# %s - %s\n\nFrequency: %d\n\n\n</card-back>\n", japaneseText, englishText, frequency))
	if err != nil {
		panic(err)
	}
}

func isParticle(word string) bool {
	particles := []string{"は", "が", "か", "の", "も", "を", "に", "で", "へ", "と", "や", "から", "まで", "ね", "よ"}
	for _, p := range particles {
		if p == word {
			return true
		}
	}
	return false
}

func isPunctuation(word string) bool {
	punctuation := []string{"！", "｡", " ", "？", "…", ")", "(", "!?", "\"", ",", "<", ">", ":", "≪", "≪(", "《"}
	for _, p := range punctuation {
		if p == word {
			return true
		}
	}
	return false
}

func parseSRT(file *os.File) ([]Subtitle, error) {
	var subtitles []Subtitle
	scanner := bufio.NewScanner(file)
	var currentSubtitle *Subtitle
	textBlock := []string{}

	for scanner.Scan() {
		line := scanner.Text()
		line = strings.Replace(line, "♬", "", -1)
		line = strings.Replace(line, "➡", "", -1)

		if line == "" && currentSubtitle != nil {
			currentSubtitle.Text = textBlock
			subtitles = append(subtitles, *currentSubtitle)
			currentSubtitle = nil
			textBlock = []string{}
			continue
		}

		if currentSubtitle == nil {
			currentSubtitle = &Subtitle{}

			fmt.Sscanf(line, "%d", &currentSubtitle.Index)
			continue
		}

		if currentSubtitle.TimeRange == "" {
			currentSubtitle.TimeRange = line
			continue
		}

		textBlock = append(textBlock, line)
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return subtitles, nil
}

func tokenizeAndCountWords(subtitles []Subtitle) map[string]*WordInfo {
	t, _ := tokenizer.New(ipa.Dict(), tokenizer.OmitBosEos())
	wordFrequencies := make(map[string]*WordInfo)

	for _, subtitle := range subtitles {
		for _, line := range subtitle.Text {
			tokens := t.Tokenize(line)
			for _, token := range tokens {
				if token.Class == tokenizer.DUMMY {
					continue
				}
				surface := token.Surface
				if _, exists := wordFrequencies[surface]; !exists {
					wordFrequencies[surface] = &WordInfo{
						Count:     0,
						Sentences: make(map[string]struct{}),
					}
				}
				wordFrequencies[surface].Count++
				wordFrequencies[surface].Sentences[line] = struct{}{}
			}
		}
	}

	return wordFrequencies
}
