package store

import (
	"encoding/csv"
	"fmt"
	"io"

	"github.com/dfirebaugh/mdsrs/models"
	"github.com/sirupsen/logrus"
)

const (
	CSVHeaderID          = "id"
	CSVHeaderTitle       = "title"
	CSVHeaderContent     = "content"
	CSVHeaderLastReview  = "last_review"
	CSVHeaderNextReview  = "next_review"
	CSVHeaderReviewCount = "review_count"
	CSVHeaderEaseFactor  = "ease_factor"
)

func ExportDeckToCSV(deck *models.Deck) (string, error) {
	var csvData string
	writer := csv.NewWriter(&csvBuffer{&csvData})

	if err := writer.Write([]string{"ID", "Title", "Content"}); err != nil {
		return "", fmt.Errorf("failed to write CSV header: %w", err)
	}

	for _, card := range deck.Cards {
		if err := writer.Write([]string{card.ID, card.Title, card.Content}); err != nil {
			return "", fmt.Errorf("failed to write card to CSV: %w", err)
		}
	}
	writer.Flush()
	return csvData, nil
}

type csvBuffer struct {
	data *string
}

func (b *csvBuffer) Write(p []byte) (n int, err error) {
	*b.data += string(p)
	return len(p), nil
}

func ImportCSVDeck(csvString string, deckName string) (*models.Deck, error) {
	reader := csv.NewReader(&csvBufferReader{data: []byte(csvString)})
	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV data: %w", err)
	}

	if len(records) < 2 {
		return nil, fmt.Errorf("CSV data is empty or missing data")
	}

	if deckName == "" {
		deckName = "ImportedDeck"
	}

	deck := NewDeck(deckName)

	for _, record := range records[1:] {
		if len(record) < 3 {
			logrus.Warnf("Skipping invalid CSV record: %v", record)
			continue
		}

		card := models.Flashcard{
			ID:      record[0],
			Title:   record[1],
			Content: record[2],
			DeckID:  deckName,
		}

		if err := AddOrUpdateCard(deck, card); err != nil {
			logrus.Errorf("Failed to add card from CSV: %v", err)
			continue
		}
	}

	if err := SaveDeck(deck); err != nil {
		return nil, fmt.Errorf("failed to save imported deck: %w", err)
	}

	return deck, nil
}

type csvBufferReader struct {
	data []byte
	pos  int
}

func (r *csvBufferReader) Read(p []byte) (n int, err error) {
	if r.pos >= len(r.data) {
		return 0, io.EOF
	}
	n = copy(p, r.data[r.pos:])
	r.pos += n
	return n, nil
}
