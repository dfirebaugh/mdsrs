package store

import (
	"database/sql"
	"fmt"

	"github.com/dfirebaugh/mdsrs/models"
	"github.com/sirupsen/logrus"
)

type Deck = models.Deck

func NewDeck(name string) *Deck {
	deck := &Deck{Name: name, Cards: []models.Flashcard{}}

	_, err := db.Exec(`
		INSERT INTO decks (name)
		VALUES (?)
		ON CONFLICT(name) DO NOTHING;
	`, name)

	if err != nil {
		logrus.Errorf("Failed to create deck in database: %v", err)
		return nil
	}

	return deck
}

func LoadDeck(deckName string) (*Deck, error) {
	var name string
	err := db.QueryRow(`
		SELECT name FROM decks WHERE name = ?
	`, deckName).Scan(&name)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("deck not found: %s", deckName)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to load deck: %w", err)
	}

	deck := &Deck{Name: name, Cards: []models.Flashcard{}}

	rows, err := db.Query(`
		SELECT id, title, content
		FROM cards
		WHERE deck_id = ?
	`, deckName)
	if err != nil {
		return nil, fmt.Errorf("failed to load cards: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var card models.Flashcard
		card.DeckID = deckName
		err := rows.Scan(&card.ID, &card.Title, &card.Content)
		if err != nil {
			logrus.Errorf("Failed to scan card: %v", err)
			continue
		}
		deck.Cards = append(deck.Cards, card)
	}

	return deck, nil
}

func LoadAllDecks() ([]*Deck, error) {
	rows, err := db.Query(`SELECT name FROM decks`)
	if err != nil {
		return nil, fmt.Errorf("failed to query decks: %w", err)
	}
	defer rows.Close()

	var decks []*Deck
	for rows.Next() {
		var deckName string
		if err := rows.Scan(&deckName); err != nil {
			logrus.Errorf("Failed to scan deck name: %v", err)
			continue
		}

		deck, err := LoadDeck(deckName)
		if err != nil {
			logrus.Errorf("Failed to load deck %s: %v", deckName, err)
			continue
		}
		decks = append(decks, deck)
	}

	return decks, nil
}

func SaveDeck(deck *Deck) error {
	_, err := db.Exec(`
		INSERT INTO decks (name)
		VALUES (?)
		ON CONFLICT(name) DO NOTHING; 
	`, deck.Name)

	if err != nil {
		return fmt.Errorf("failed to save deck: %w", err)
	}

	for _, card := range deck.Cards {
		if err := AddOrUpdateCard(deck, card); err != nil {
			return fmt.Errorf("failed to save card %s: %w", card.ID, err)
		}
	}

	return nil
}

func DeleteDeck(deckName string) error {
	_, err := db.Exec(`
		DELETE FROM cards WHERE deck_id = ?
	`, deckName)
	if err != nil {
		return fmt.Errorf("failed to delete cards for deck %s: %w", deckName, err)
	}

	_, err = db.Exec(`
		DELETE FROM decks WHERE name = ?
	`, deckName)
	if err != nil {
		return fmt.Errorf("failed to delete deck %s: %w", deckName, err)
	}

	return nil
}
