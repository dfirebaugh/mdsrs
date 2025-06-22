package store

import (
	"database/sql"
	"fmt"
	"slices"

	"github.com/dfirebaugh/mdsrs/models"
	"github.com/google/uuid"
)

type Flashcard = models.Flashcard

func GenerateID() string {
	// TODO: should probably move this to the db now
	return uuid.New().String()
}

func FindCardByID(deck *Deck, cardID string) *models.Flashcard {
	var card models.Flashcard
	err := db.QueryRow(`
		SELECT id, deck_id, title, content
		FROM cards
		WHERE id = ? AND deck_id = ?
	`, cardID, deck.Name).Scan(&card.ID, &card.DeckID, &card.Title, &card.Content)

	if err == sql.ErrNoRows {
		return nil
	}
	if err != nil {
		fmt.Printf("Error finding card: %v\n", err)
		return nil
	}
	return &card
}

func AddCard(deck *Deck, card models.Flashcard) error {
	if card.ID == "" {
		card.ID = GenerateID()
	}
	_, err := db.Exec(`
		INSERT INTO cards (id, deck_id, title, content)
		VALUES (?, ?, ?, ?)
	`, card.ID, deck.Name, card.Title, card.Content)
	if err != nil {
		return fmt.Errorf("failed to add card: %w", err)
	}
	deck.Cards = append(deck.Cards, card)
	return nil
}

func DeleteCard(deck *Deck, cardID string) error {
	_, err := db.Exec(`DELETE FROM cards WHERE id = ? AND deck_id = ?`, cardID, deck.Name)
	if err != nil {
		return fmt.Errorf("failed to delete card: %w", err)
	}
	for i, c := range deck.Cards {
		if c.ID == cardID {
			deck.Cards = slices.Delete(deck.Cards, i, i+1)
			break
		}
	}
	return nil
}

func AddOrUpdateCard(deck *Deck, card models.Flashcard) error {
	if card.ID == "" {
		card.ID = GenerateID()
	}

	_, err := db.Exec(`
		INSERT INTO cards (id, deck_id, title, content)
		VALUES (?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			title = excluded.title,
			content = excluded.content
	`, card.ID, deck.Name, card.Title, card.Content)

	if err != nil {
		return fmt.Errorf("failed to add/update card: %w", err)
	}

	found := false
	for i, c := range deck.Cards {
		if c.ID == card.ID {
			deck.Cards[i] = card
			found = true
			break
		}
	}
	if !found {
		deck.Cards = append(deck.Cards, card)
	}

	return nil
}
