package store

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	"github.com/dfirebaugh/mdsrs/models"
	_ "modernc.org/sqlite"
)

var (
	db     *sql.DB
	dbPath string
)

func GetDB() *sql.DB {
	return db
}

func SetDBPath(path string) {
	dbPath = path
}

func InitDB() error {
	if dbPath == "" {
		return fmt.Errorf("database path not set")
	}

	var isNewDB bool
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		isNewDB = true
	}

	if err := os.MkdirAll(filepath.Dir(dbPath), 0755); err != nil {
		return fmt.Errorf("failed to create database directory: %w", err)
	}

	var err error
	db, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	if err := createTables(); err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	if isNewDB {
		if err := initializeSampleData(); err != nil {
			return fmt.Errorf("failed to initialize sample data: %w", err)
		}
	}

	return nil
}

func initializeSampleData() error {
	deck := &models.Deck{
		Name: "Getting Started",
	}

	if err := SaveDeck(deck); err != nil {
		return fmt.Errorf("failed to save sample deck: %w", err)
	}

	// Create sample cards
	cards := []models.Flashcard{
		{
			DeckID:  deck.Name,
			ID:      GenerateID(),
			Title:   "Welcome to MDSRS!",
			Content: "# Welcome to MDSRS!\n\nThis is your first card. MDSRS is a markdown-based spaced repetition system.\n\n## Key Features:\n- Write cards in Markdown\n- Spaced repetition learning\n- Organize cards into decks\n- Code syntax highlighting\n\n## Getting Started:\n1. Click 'New Deck' to create a deck\n2. Click 'New Card' to add cards\n3. Use markdown to format your cards\n4. Review cards regularly \n<card-back>\n# back of card\n\nsome info\n\n</card-back>",
		},
		{
			DeckID:  deck.Name,
			ID:      GenerateID(),
			Title:   "Markdown Basics",
			Content: "# Markdown Basics\n\n## Headers\n# H1\n## H2\n### H3\n\n## Lists\n- Bullet point\n- Another point\n\n1. Numbered list\n2. Second item\n\n## Code\n```python\nprint('Hello, World!')\n```\n\n## Links and Images\n[Link text](URL)\n![Image alt text](image URL) \n<card-back>\n# back of card\n\nsome info\n\n</card-back>",
		},
		{
			DeckID:  deck.Name,
			ID:      GenerateID(),
			Title:   "Spaced Repetition",
			Content: "# Spaced Repetition\n\nSpaced repetition is a learning technique that incorporates increasing intervals of time between subsequent review of previously learned material.\n\n## How it works:\n1. Review a card\n2. Rate your confidence\n3. The card will reappear based on:\n   - Your confidence rating\n   - Previous review history\n   - Optimal spacing algorithm\n\nThis helps move information from short-term to long-term memory efficiently. \n<card-back>\n# back of card\n\nsome info\n\n</card-back>",
		},
	}

	for _, card := range cards {
		if err := AddOrUpdateCard(deck, card); err != nil {
			return fmt.Errorf("failed to add sample card: %w", err)
		}
	}

	return nil
}

func CloseDB(ctx context.Context) {
	if db != nil {
		if err := db.Close(); err != nil {
			fmt.Printf("Error closing database: %v\n", err)
		}
	}
}

func createTables() error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS decks (
			name TEXT PRIMARY KEY,
			dir_path TEXT
		)
	`)
	if err != nil {
		return err
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS cards (
			id TEXT PRIMARY KEY,
			deck_id TEXT,
			title TEXT,
			content TEXT,
			FOREIGN KEY(deck_id) REFERENCES decks(name)
		)
	`)
	if err != nil {
		return err
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS srs_data (
			card_id TEXT PRIMARY KEY,
			last_review INTEGER,
			next_review INTEGER,
			review_count INTEGER,
			ease_factor REAL,
			FOREIGN KEY(card_id) REFERENCES cards(id)
		)
	`)
	if err != nil {
		return err
	}

	return nil
}
