package storage

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"

	"github.com/sirupsen/logrus"
)

type Deck struct {
	Name    string      `json:"name"`
	Cards   []Flashcard `json:"cards"`
	SRSData []SRSData   `json:"srsData"`
	DirPath string      `json:"-"`
}

func NewDeck(name string) *Deck {
	dir := DeckDIR + "/" + name
	return &Deck{Name: name, DirPath: dir}
}

func EnsureDecksDir() error {
	dirPath := DeckDIR
	if _, err := os.Stat(dirPath); os.IsNotExist(err) {
		err := os.MkdirAll(dirPath, 0755)
		if err != nil {
			return err
		}
	}
	return nil
}

func LoadDeck(deckName string) (*Deck, error) {
	deckPath := filepath.Join(DeckDIR, deckName)
	if _, err := os.Stat(deckPath); os.IsNotExist(err) {
		return nil, err
	}

	deck := &Deck{Name: deckName, Cards: []Flashcard{}}

	srsDataPath := filepath.Join(deckPath, "srs_metadata.json")
	srsDataBytes, err := os.ReadFile(srsDataPath)
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(srsDataBytes, &deck.SRSData)
	if err != nil {
		return nil, err
	}

	err = filepath.Walk(deckPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && filepath.Ext(path) == fileEXT {
			content, err := os.ReadFile(path)
			if err != nil {
				return err
			}
			card := Flashcard{
				DeckID:  deckName,
				ID:      strings.TrimSuffix(info.Name(), fileEXT),
				Title:   strings.Replace(strings.TrimSuffix(info.Name(), fileEXT), "_", " ", -1),
				Content: string(content),
			}
			deck.Cards = append(deck.Cards, card)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return deck, nil
}

func LoadAllDecks() ([]*Deck, error) {
	var decks []*Deck

	entries, err := os.ReadDir(DeckDIR)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		if entry.IsDir() {
			deckName := entry.Name()
			deck, err := LoadDeck(deckName)
			if err != nil {
				logrus.Errorf("Failed to load deck %s: %v", deckName, err)
				continue
			}
			decks = append(decks, deck)
		}
	}

	return decks, nil
}
