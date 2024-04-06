package srs

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/dfirebaugh/mdsrs/internal/config"
	"github.com/dfirebaugh/mdsrs/internal/storage"
	"github.com/sirupsen/logrus"
)

type ReviewConfidence int

const (
	EasyReviewConfidence ReviewConfidence = iota
	MediumReviewConfidence
	HardReviewConfidence
)

type SRS struct {
	fileName string `json:"-"`
	Cards    []*SRSCard
}

type SRSCard struct {
	Card           *storage.Flashcard
	ReviewInterval int       `json:"reviewInterval"`
	LastReviewed   time.Time `json:"lastReviewed"`
}

func NewSRS(deckDir string) *SRS {
	srsDirectory := ".mdsrs"
	srsFile := srsDirectory + "/" + deckDir + "srs_data.json"

	if err := os.MkdirAll(srsDirectory, os.ModePerm); err != nil {
		logrus.Fatalf("failed to create directory for SRS data: %v", err)
	}

	srsData := &SRS{fileName: srsFile}

	if err := srsData.LoadSRSFromFile(); err != nil {
		if os.IsNotExist(err) {
			logrus.Info("SRS data file does not exist; a new one will be created upon saving.")
		} else {
			logrus.Error(err)
		}
	}
	return srsData
}

func (s *SRS) CheckOrCreateCard(cardID string, deck *storage.Deck) *SRSCard {
	for _, card := range s.Cards {
		if card.Card.ID == cardID {
			return card
		}
	}

	newCard := &SRSCard{
		Card:           storage.FindCardByID(deck, cardID),
		ReviewInterval: 1,
		LastReviewed:   time.Now(),
	}
	s.Cards = append(s.Cards, newCard)
	return newCard
}

func (s *SRS) updateConfidence(card *SRSCard, outcome int) {
	switch ReviewConfidence(outcome) {
	case HardReviewConfidence:
		card.ReviewInterval = max(1, card.ReviewInterval/2)
	case MediumReviewConfidence:
		card.ReviewInterval = max(1, card.ReviewInterval)
	case EasyReviewConfidence:
		card.ReviewInterval *= 2
	}
	card.LastReviewed = time.Now()
}

func (s *SRS) UpdateSRSData(deck *storage.Deck, cardID string, outcome int) {
	card := s.CheckOrCreateCard(cardID, deck)
	s.updateConfidence(card, outcome)
}

func (s *SRS) GetReviewCards() []storage.Flashcard {
	conf, err := config.LoadConfigFromFile(".mdsrs/config.json")
	if err != nil {
		logrus.Error(err)
	}

	var reviewCards []storage.Flashcard
	now := time.Now()
	for _, srsCard := range s.Cards {
		nextReviewDate := srsCard.LastReviewed.AddDate(0, 0, srsCard.ReviewInterval)
		if now.After(nextReviewDate) {
			reviewCards = append(reviewCards, *srsCard.Card)
		}

		if len(reviewCards) == conf.NumberOfCardsInReview {
			return reviewCards
		}
	}
	return reviewCards
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func (s *SRS) SaveSRSToFile() error {
	if s == nil {
		return errors.New("cannot save SRS data from a nil SRS object")
	}

	file, err := os.Create(s.fileName)
	if err != nil {
		return fmt.Errorf("failed to create SRS data file: %w", err)
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(s); err != nil {
		return fmt.Errorf("failed to encode SRS data to file: %w", err)
	}

	return nil
}

func (s *SRS) LoadSRSFromFile() error {
	file, err := os.Open(s.fileName)
	if err != nil {
		return err
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	err = decoder.Decode(s)
	if err != nil {
		return err
	}

	return nil
}
