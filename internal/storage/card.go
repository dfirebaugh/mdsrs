package storage

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

const DeckDIR = ".mdsrs/decks"
const fileEXT = ".md"

type Flashcard struct {
	DeckID  string `json:"deckId"`
	ID      string `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

func GenerateID() string {
	return uuid.New().String()
}

func (d *Deck) AddOrUpdateCard(card Flashcard) {
	deckPath := filepath.Join(DeckDIR, d.Name)
	cardFilePath := filepath.Join(deckPath, sanitizeTitle(card.Title)+fileEXT)

	if card.ID == "" {
		card.ID = GenerateID()
		cardExists := false

		for _, c := range d.Cards {
			if c.Title == card.Title {
				cardExists = true
				cardFilePath = filepath.Join(deckPath, sanitizeTitle(c.Title)+fileEXT)
				break
			}
		}

		if !cardExists {
			d.Cards = append(d.Cards, card)
		}
	} else {
		updated := false
		for i, c := range d.Cards {
			if c.ID == card.ID {
				d.Cards[i] = card
				cardFilePath = filepath.Join(deckPath, sanitizeTitle(card.Title)+fileEXT)
				updated = true
				break
			}
		}
		if !updated {
			d.Cards = append(d.Cards, card)
		}
	}

	err := os.WriteFile(cardFilePath, []byte(card.Content), 0644)
	if err != nil {
		logrus.Errorf("error saving the card: %s", err)
		return
	}
}

func sanitizeTitle(title string) string {
	return strings.Replace(title, " ", "_", -1)
}

func (d *Deck) Save() error {
	deckPath := filepath.Join(DeckDIR, d.Name)
	if err := os.MkdirAll(deckPath, 0755); err != nil {
		return err
	}

	for _, card := range d.Cards {
		cardFileName := strings.Replace(card.Title, " ", "_", -1) + fileEXT
		cardPath := filepath.Join(deckPath, cardFileName)
		file, err := os.Create(cardPath)
		if err != nil {
			return err
		}
		defer file.Close()

		if _, err := file.WriteString(card.Content); err != nil {
			return err
		}
	}

	return nil
}

func FindCardByID(deck *Deck, cardID string) *Flashcard {
	for _, card := range deck.Cards {
		if card.ID == cardID {
			return &card
		}
	}
	return nil
}
