package nihongo

import (
	"fmt"
	"os"

	jmdict "github.com/themoeway/jmdict-go"
)

type WordInfo struct {
	Definitions   []string
	PartsOfSpeech []string
	Notes         []string
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

func loadDictionary[T any](path string, loader func(file *os.File) (T, error)) (T, error) {
	var dict T
	file, err := os.Open(path)
	if err != nil {
		return dict, fmt.Errorf("failed to open dictionary file: %w", err)
	}
	defer file.Close()

	dict, err = loader(file)
	if err != nil {
		return dict, fmt.Errorf("failed to load dictionary: %w", err)
	}

	return dict, nil
}

func loadJMDict() (jmdict.Jmdict, error) {
	var dict jmdict.Jmdict
	jmdictPath := ".mdsrs/dictionaries/JMdict_e"

	file, err := os.Open(jmdictPath)
	if err != nil {
		return dict, fmt.Errorf("failed to open JMDict file: %w", err)
	}
	defer file.Close()

	dict, _, err = jmdict.LoadJmdict(file)
	if err != nil {
		return dict, fmt.Errorf("failed to load JMDict: %w", err)
	}

	return dict, nil
}

func loadEMDict() (jmdict.Jmnedict, error) {
	var dict jmdict.Jmnedict
	jmdictPath := ".mdsrs/dictionaries/JMdict_e"

	file, err := os.Open(jmdictPath)
	if err != nil {
		return dict, fmt.Errorf("failed to open JMDict file: %w", err)
	}
	defer file.Close()

	dict, _, err = jmdict.LoadJmnedict(file)
	if err != nil {
		return dict, fmt.Errorf("failed to load JMDict: %w", err)
	}

	return dict, nil
}

func loadKanjiDict() (jmdict.Kanjidic, error) {
	var dict jmdict.Kanjidic
	jmdictPath := ".mdsrs/dictionaries/kanjidic2_dtd"

	file, err := os.Open(jmdictPath)
	if err != nil {
		return dict, fmt.Errorf("failed to open JMDict file: %w", err)
	}
	defer file.Close()

	dict, err = jmdict.LoadKanjidic(file)
	if err != nil {
		return dict, fmt.Errorf("failed to load JMDict: %w", err)
	}

	return dict, nil
}

func Lookup(word string) (*WordInfo, error) {
	dict, err := loadJMDict()
	if err != nil {
		return nil, err
	}

	for _, entry := range dict.Entries {
		found := false
		for _, kanji := range entry.Kanji {
			if kanji.Expression == word {
				found = true
				break
			}
		}
		for _, reading := range entry.Readings {
			if reading.Reading == word {
				found = true
				break
			}
		}
		if found {
			info := &WordInfo{}
			for _, sense := range entry.Sense {
				for _, gloss := range sense.Glossary {
					info.Definitions = append(info.Definitions, gloss.Content)
				}
				info.PartsOfSpeech = append(info.PartsOfSpeech, sense.PartsOfSpeech...)
				info.Notes = append(info.Notes, sense.Information...)
			}
			return info, nil
		}
	}

	return nil, fmt.Errorf("word not found")
}
