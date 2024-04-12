package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

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
	Word       string
	Count      int
	Sentences  map[string]struct{}
	Definition string
}

const workerCount = 5

var dictService *nihongo.DictionaryService

func main() {
	logrus.Info("Starting application...")
	if len(os.Args) < 2 {
		logrus.Fatal("Usage: go run main.go <srt_file>")
		os.Exit(1)
	}

	dictService = nihongo.NewDictionaryService()

	filename := os.Args[1]
	file, err := os.Open(filename)
	if err != nil {
		logrus.Errorf("Error opening file %s: %v", filename, err)
		os.Exit(1)
	}
	defer file.Close()

	subtitles, err := parseSRT(file)
	if err != nil {
		logrus.Errorf("Error parsing SRT file: %v", err)
		os.Exit(1)
	}

	wordFrequencies := tokenizeAndCountWords(subtitles)
	tasks := make(chan WordInfo)
	errors := make(chan error, workerCount)
	var wg sync.WaitGroup

	logrus.Info("preforming dictionary lookups...")
	logrus.Info("this can take a while...")
	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go worker(tasks, errors, &wg)
	}

	logrus.Info("Sending tasks to workers...")
	for _, info := range wordFrequencies {
		if isIgnorableWord(info.Word) {
			continue
		}
		tasks <- info
	}

	go func() {
		wg.Wait()
		close(errors)
	}()

	close(errors)
	handleErrors(errors)
	logrus.Info("Processing completed.")
}

func worker(tasks <-chan WordInfo, errors chan<- error, wg *sync.WaitGroup) {
	defer wg.Done()
	for task := range tasks {
		if err := writeMDFile(task.Word, task.Count, setToSlice(task.Sentences)); err != nil {
			select {
			case errors <- err:
				// Error sent successfully
			default:
				// Error channel is full or no longer listened to
				logrus.Warnf("Dropped error: %v", err)
			}
		}
	}
}

func writeMDFile(japaneseText string, frequency int, sentences []string) error {
	dirPath := ".mdsrs/decks/dragonball"
	err := os.MkdirAll(dirPath, 0755)
	if err != nil {
		return fmt.Errorf("failed to create directory %s: %v", dirPath, err)
	}

	fileName := strings.Replace(japaneseText, "?", "", -1) + ".md"
	filePath := filepath.Join(dirPath, fileName)
	file, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to create file %s: %v", filePath, err)
	}
	defer file.Close()

	logrus.Infof("Writing content to file %s", filePath)
	header := fmt.Sprintf("# %s\n\n<audio tts=\"%s\" language=\"ja\"></audio>\n\n", japaneseText, japaneseText)
	if _, err := file.WriteString(header); err != nil {
		return fmt.Errorf("failed to write header to file %s: %v", filePath, err)
	}

	for _, sentence := range sentences {
		if _, err := file.WriteString(fmt.Sprintf("- <audio tts=\"%s\" language=\"ja\"></audio>\n", sentence)); err != nil {
			return fmt.Errorf("failed to write sentence to file %s: %v", filePath, err)
		}
	}

	if _, err := file.WriteString(fmt.Sprintf("\n\n<card-back>\n\n# %s\n\n", japaneseText)); err != nil {
		return fmt.Errorf("failed to write card back to file %s: %v", filePath, err)
	}

	defer func() {
		frequencyFooter := fmt.Sprintf("\n\nFrequency: %d\n\n</card-back>\n", frequency)
		if _, err := file.WriteString(frequencyFooter); err != nil {
			logrus.Errorf("Failed to write closing card-back and frequency to file %s: %v", filePath, err)
		}
	}()

	if definition, err := dictService.Lookup(japaneseText); err == nil {
		file.WriteString("\n### Definitions\n\n")
		for _, d := range definition.Definitions {
			if _, err := file.WriteString(fmt.Sprintf("- %s\n", d)); err != nil {
				return fmt.Errorf("failed to write definition to file %s: %v", filePath, err)
			}
		}
		file.WriteString("### PartsOfSpeech\n\n")
		for _, d := range definition.PartsOfSpeech {
			if _, err := file.WriteString(fmt.Sprintf("- %s\n", d)); err != nil {
				return fmt.Errorf("failed to write parts of speech to file %s: %v", filePath, err)
			}
		}

		file.WriteString("\n### Notes\n\n")
		for _, d := range definition.Notes {
			if _, err := file.WriteString(fmt.Sprintf("- %s\n", d)); err != nil {
				return fmt.Errorf("failed to write note to file %s: %v", filePath, err)
			}
		}
	} else {
		logrus.Errorf("Failed to lookup Japanese text %s: %v", japaneseText, err)
		return err
	}

	return nil
}

func handleErrors(errors <-chan error) {
	for err := range errors {
		logrus.Error(err)
	}
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
		line = strings.Replace(line, "『", "", -1)
		line = strings.Replace(line, "｢", "", -1)
		line = strings.Replace(line, "』", "", -1)
		line = strings.Replace(line, "｣", "", -1)
		line = strings.Replace(line, "〉", "", -1)
		line = strings.Replace(line, "〈", "", -1)
		line = strings.Replace(line, "》", "", -1)
		line = strings.Replace(line, "》", "", -1)

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

func tokenizeAndCountWords(subtitles []Subtitle) map[string]WordInfo {
	t, _ := tokenizer.New(ipa.Dict(), tokenizer.OmitBosEos())
	wordFrequencies := make(map[string]WordInfo)

	for _, subtitle := range subtitles {
		for _, line := range subtitle.Text {
			tokens := t.Tokenize(line)
			for _, token := range tokens {
				if token.Class == tokenizer.DUMMY {
					continue
				}
				surface := token.Surface
				info := wordFrequencies[surface]
				info.Word = surface
				info.Count++
				if info.Sentences == nil {
					info.Sentences = make(map[string]struct{})
				}
				info.Sentences[line] = struct{}{}
				wordFrequencies[surface] = info
			}
		}
	}

	return wordFrequencies
}

func isIgnorableWord(word string) bool {
	return isParticle(word) || isPunctuation(word) || isUnitOfMeasurement(word)
}

func isParticle(word string) bool {
	return strings.Contains("はがかのもをにでへとやからまでねよ", word)
}

func isPunctuation(word string) bool {
	return strings.Contains("！｡ ?…)(!?,<>:≪≪(《･？", word)
}

func isUnitOfMeasurement(word string) bool {
	return strings.Contains("mmkmcm", word)
}

func setToSlice(set map[string]struct{}) []string {
	var slice []string
	for s := range set {
		slice = append(slice, s)
	}
	return slice
}
