package nihongo

import (
	"fmt"
	"os"
	"strings"
	"sync"

	jmdict "github.com/themoeway/jmdict-go"
)

type WordInfo struct {
	Definitions   []string `json:"definitions"`
	PartsOfSpeech []string `json:"partsOfSpeech"`
	Notes         []string `json:"notes"`
	Surface       string   `json:"surface"`
}

func (w WordInfo) Print() {
	for _, d := range w.Definitions {
		println(d)
	}
	for _, p := range w.PartsOfSpeech {
		println(p)
	}
	for _, n := range w.Notes {
		println(n)
	}
}

type DictionaryService struct {
	dictionary    jmdict.Jmdict
	dictionaryMap map[string]string
	mutex         sync.Mutex
}

func NewDictionaryService() *DictionaryService {
	return &DictionaryService{
		dictionaryMap: make(map[string]string),
	}
}

func (ds *DictionaryService) loadJMDict() error {
	ds.mutex.Lock()
	defer ds.mutex.Unlock()

	if len(ds.dictionaryMap) != 0 {
		return nil // Dictionary already loaded
	}

	jmdictPath := ".mdsrs/dictionaries/JMdict_e"
	file, err := os.Open(jmdictPath)
	if err != nil {
		return fmt.Errorf("failed to open JMDict file: %w", err)
	}
	defer file.Close()

	ds.dictionary, ds.dictionaryMap, err = jmdict.LoadJmdict(file)
	if err != nil {
		return fmt.Errorf("failed to load JMDict: %w", err)
	}

	return nil
}

func (ds *DictionaryService) Lookup(word string) (*WordInfo, error) {
	if err := ds.loadJMDict(); err != nil {
		return nil, fmt.Errorf("failed to load the JMDict dictionary: %w", err)
	}

	for _, entry := range ds.dictionary.Entries {
		if ds.isWordInEntry(word, entry) {
			w := ds.createWordInfo(entry)
			w.Surface = word
			return w, nil
		}
	}

	return nil, fmt.Errorf("word '%s' not found in dictionary", word)
}

func (ds *DictionaryService) isWordInEntry(word string, entry jmdict.JmdictEntry) bool {
	word = strings.TrimSpace(strings.ToLower(word))
	for _, kanji := range entry.Kanji {
		if strings.ToLower(kanji.Expression) == word {
			return true
		}
	}
	for _, reading := range entry.Readings {
		if strings.ToLower(reading.Reading) == word {
			return true
		}
	}
	return false
}

func (ds *DictionaryService) createWordInfo(entry jmdict.JmdictEntry) *WordInfo {
	info := &WordInfo{}
	for _, sense := range entry.Sense {
		for _, gloss := range sense.Glossary {
			info.Definitions = append(info.Definitions, gloss.Content)
		}
		info.PartsOfSpeech = append(info.PartsOfSpeech, sense.PartsOfSpeech...)
		info.Notes = append(info.Notes, sense.Information...)
	}
	return info
}
