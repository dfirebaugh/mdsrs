package models

type Flashcard struct {
	DeckID      string  `json:"deckId"`
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Content     string  `json:"content"`
	HTML        string  `json:"html"`
	NextReview  int64   `json:"next_review,omitempty"`
	ReviewCount int64   `json:"review_count,omitempty"`
	EaseFactor  float64 `json:"ease_factor,omitempty"`
}

type CardData struct {
	LastReview  int64   `json:"last_review"`
	NextReview  int64   `json:"next_review"`
	ReviewCount int64   `json:"review_count"`
	EaseFactor  float64 `json:"ease_factor"`
}

type Deck struct {
	Name    string      `json:"name"`
	Cards   []Flashcard `json:"cards"`
	DirPath string      `json:"-"`
}

type ReviewConfidence int

const (
	HardReviewConfidence ReviewConfidence = iota
	MediumReviewConfidence
	EasyReviewConfidence
)

type SRS interface {
	UpdateSRSData(cardID string, outcome ReviewConfidence)
	GetReviewCards(numCards int) []Flashcard
	GetReviewCardsForDecks(deckNames []string, numCards int) []Flashcard
	GetFutureReviewCards() []Flashcard
	GetCardData(cardID string) CardData
	UpdateCardData(cardID string, data CardData)
}
