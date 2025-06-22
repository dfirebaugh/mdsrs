package srs

import (
	"database/sql"
	"time"

	"github.com/dfirebaugh/mdsrs/models"
	"github.com/sirupsen/logrus"
)

type SRS struct {
	database *sql.DB
}

func NewSRS(deckName string, database *sql.DB) models.SRS {
	return &SRS{database}
}

func (s *SRS) UpdateSRSData(cardID string, outcome models.ReviewConfidence) {
	logrus.Infof("UpdateSRSData called with cardID: %s, outcome: %d", cardID, outcome)

	data := s.GetCardData(cardID)
	now := time.Now().Unix()

	data.LastReview = now
	data.ReviewCount++

	switch outcome {
	case models.EasyReviewConfidence:
		data.EaseFactor = min(data.EaseFactor+0.1, 2.5)
		data.NextReview = now + int64(float64(86400)*data.EaseFactor*float64(data.ReviewCount))
	case models.MediumReviewConfidence:
		data.NextReview = now + 86400
	case models.HardReviewConfidence:
		data.EaseFactor = max(data.EaseFactor-0.2, 0.1)
		data.NextReview = now + 1800
	default:
		data.NextReview = now + 86400
	}

	logrus.Infof("Updating card data: cardID=%s, lastReview=%d, nextReview=%d, reviewCount=%d, easeFactor=%f",
		cardID, data.LastReview, data.NextReview, data.ReviewCount, data.EaseFactor)

	s.UpdateCardData(cardID, data)
}

func (s *SRS) GetReviewCards(numCards int) []models.Flashcard {
	now := time.Now().Unix()
	rows, err := s.database.Query(`
		SELECT c.id, c.deck_id, c.title, c.content
		FROM cards c
		LEFT JOIN srs_data s ON c.id = s.card_id
		WHERE s.next_review IS NULL OR s.next_review <= ?
		ORDER BY 
			CASE 
				WHEN s.next_review IS NULL THEN 0   -- New cards first
				WHEN s.next_review < ? THEN 1       -- Overdue cards second
				ELSE 2                              -- Due cards third
			END,
			s.next_review ASC,
			s.review_count ASC                          -- Lower review count first
		LIMIT ?
	`, now, now, numCards)
	if err != nil {
		logrus.Errorf("Failed to get review cards: %v", err)
		return []models.Flashcard{}
	}
	defer rows.Close()

	var cards []models.Flashcard
	for rows.Next() {
		var card models.Flashcard
		err := rows.Scan(&card.ID, &card.DeckID, &card.Title, &card.Content)
		if err != nil {
			logrus.Errorf("Failed to scan card: %v", err)
			continue
		}
		cards = append(cards, card)
	}

	return cards
}

// GetReviewCardsForDecks gets review cards from specific decks
func (s *SRS) GetReviewCardsForDecks(deckNames []string, numCards int) []models.Flashcard {
	if len(deckNames) == 0 {
		return s.GetReviewCards(numCards)
	}

	now := time.Now().Unix()

	placeholders := ""
	for i := range deckNames {
		if i > 0 {
			placeholders += ","
		}
		placeholders += "?"
	}

	args := make([]any, 0, len(deckNames)+3)
	for _, deckName := range deckNames {
		args = append(args, deckName)
	}
	args = append(args, now, now, numCards)

	query := `
		SELECT c.id, c.deck_id, c.title, c.content
		FROM cards c
		LEFT JOIN srs_data s ON c.id = s.card_id
		WHERE c.deck_id IN (` + placeholders + `) AND (s.next_review IS NULL OR s.next_review <= ?)
		ORDER BY 
			CASE 
				WHEN s.next_review IS NULL THEN 0
				WHEN s.next_review < ? THEN 1
				ELSE 2
			END,
			s.next_review ASC,
			s.review_count ASC
		LIMIT ?
	`

	rows, err := s.database.Query(query, args...)
	if err != nil {
		logrus.Errorf("Failed to get review cards for decks: %v", err)
		return []models.Flashcard{}
	}
	defer rows.Close()

	var cards []models.Flashcard
	for rows.Next() {
		var card models.Flashcard
		err := rows.Scan(&card.ID, &card.DeckID, &card.Title, &card.Content)
		if err != nil {
			logrus.Errorf("Failed to scan card: %v", err)
			continue
		}
		cards = append(cards, card)
	}

	return cards
}

func (s *SRS) GetCardData(cardID string) models.CardData {
	var data models.CardData
	err := s.database.QueryRow(`
		SELECT last_review, next_review, review_count, ease_factor
		FROM srs_data
		WHERE card_id = ?
	`, cardID).Scan(&data.LastReview, &data.NextReview, &data.ReviewCount, &data.EaseFactor)

	if err == sql.ErrNoRows {
		return models.CardData{
			EaseFactor: 1.0,
		}
	}
	if err != nil {
		logrus.Errorf("Failed to get card data: %v", err)
		return models.CardData{
			EaseFactor: 1.0,
		}
	}

	return data
}

func (s *SRS) UpdateCardData(cardID string, data models.CardData) {
	logrus.Infof("UpdateCardData called with cardID: %s", cardID)

	_, err := s.database.Exec(`
		INSERT INTO srs_data (card_id, last_review, next_review, review_count, ease_factor)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(card_id) DO UPDATE SET
			last_review = excluded.last_review,
			next_review = excluded.next_review,
			review_count = excluded.review_count,
			ease_factor = excluded.ease_factor
	`, cardID, data.LastReview, data.NextReview, data.ReviewCount, data.EaseFactor)
	if err != nil {
		logrus.Errorf("Failed to update card data: %v", err)
	} else {
		logrus.Infof("Successfully updated SRS data for card: %s", cardID)
	}
}

func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func max(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

func (s *SRS) GetFutureReviewCards() []models.Flashcard {
	now := time.Now().Unix()
	logrus.Infof("GetFutureReviewCards called, current time: %d", now)

	rows, err := s.database.Query(`
SELECT c.id, c.deck_id, c.title, c.content, s.next_review, s.review_count, s.ease_factor, d.name as deck_name
FROM cards c
INNER JOIN srs_data s ON c.id = s.card_id
LEFT JOIN decks d ON c.deck_id = d.name
WHERE s.next_review > (SELECT strftime('%s', 'now'))
ORDER BY s.next_review ASC;
	`, now)
	if err != nil {
		logrus.Errorf("Failed to get future review cards: %v", err)
		return []models.Flashcard{}
	}
	defer rows.Close()

	var cards []models.Flashcard
	for rows.Next() {
		var card models.Flashcard
		var nextReview, reviewCount int64
		var easeFactor float64
		var deckName sql.NullString
		err := rows.Scan(&card.ID, &card.DeckID, &card.Title, &card.Content, &nextReview, &reviewCount, &easeFactor, &deckName)
		if err != nil {
			logrus.Errorf("Failed to scan future review card: %v", err)
			continue
		}
		card.NextReview = nextReview
		card.ReviewCount = reviewCount
		card.EaseFactor = easeFactor
		if deckName.Valid && deckName.String != "" {
			card.DeckID = deckName.String
		}
		cards = append(cards, card)
		logrus.Infof("Found future review card: %s, next_review: %d", card.Title, nextReview)
	}

	logrus.Infof("GetFutureReviewCards returning %d cards", len(cards))
	return cards
}
