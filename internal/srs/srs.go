package srs

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

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

func (s *SRS) LoadCardsFromMarkdown(deckDir string) error {
	deckPath := filepath.Join(".mdsrs", "decks", deckDir)
	files, err := os.ReadDir(deckPath)
	if err != nil {
		return fmt.Errorf("failed to read deck directory: %v", err)
	}

	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".md") {
			continue
		}

		cardPath := filepath.Join(deckPath, file.Name())
		content, err := os.ReadFile(cardPath)
		if err != nil {
			logrus.Errorf("Failed to read markdown file %s: %v", file.Name(), err)
			continue
		}

		card := &storage.Flashcard{
			DeckID:  deckDir,
			ID:      strings.TrimSuffix(file.Name(), ".md"),
			Title:   strings.Replace(strings.TrimSuffix(file.Name(), ".md"), "_", " ", -1),
			Content: string(content),
		}

		s.Cards = append(s.Cards, &SRSCard{
			Card:           card,
			ReviewInterval: 1,
			LastReviewed:   time.Time{},
		})
	}

	return nil
}

func NewSRS(deckDir string) *SRS {
	srsDirectory := ".mdsrs"
	srsFile := filepath.Join(srsDirectory, deckDir, "srs_data.json")

	if err := os.MkdirAll(srsDirectory, os.ModePerm); err != nil {
		logrus.Fatalf("failed to create directory for SRS data: %v", err)
	}

	srsData := &SRS{fileName: srsFile}
	if err := srsData.LoadSRSFromFile(); err != nil && errors.Is(err, os.ErrNotExist) {
		logrus.Info("SRS data file does not exist; attempting to load cards from markdown files.")
		if err := srsData.LoadCardsFromMarkdown(deckDir); err != nil {
			logrus.Errorf("Failed to load cards from markdown: %v", err)
		}
	} else if err != nil {
		logrus.Error(err)
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

func (s *SRS) GetReviewCards(numCards int) []storage.Flashcard {
	if s == nil {
		logrus.Error("GetReviewCards called on a nil SRS instance")
		return nil
	}

	if numCards <= 0 {
		logrus.Warn("Requested number of review cards is non-positive")
		return nil
	}

	var reviewCards []storage.Flashcard
	var neverReviewedCards []storage.Flashcard
	now := time.Now()

	for _, srsCard := range s.Cards {
		if srsCard == nil || srsCard.Card == nil {
			continue // Skip nil cards or cards with nil Flashcard
		}

		if srsCard.LastReviewed.IsZero() {
			neverReviewedCards = append(neverReviewedCards, *srsCard.Card)
			continue
		}

		nextReviewDate := srsCard.LastReviewed.AddDate(0, 0, srsCard.ReviewInterval)
		if now.After(nextReviewDate) {
			reviewCards = append(reviewCards, *srsCard.Card)
			if len(reviewCards) >= numCards {
				break
			}
		}
	}

	// If there aren't enough due cards, review the most recent ones
	if len(reviewCards) < numCards {
		sort.Slice(s.Cards, func(i, j int) bool {
			return s.Cards[i].LastReviewed.After(s.Cards[j].LastReviewed)
		})
		for _, srsCard := range s.Cards {
			if !containsCard(reviewCards, *srsCard.Card) && !srsCard.LastReviewed.IsZero() {
				reviewCards = append(reviewCards, *srsCard.Card)
				if len(reviewCards) >= numCards {
					break
				}
			}
		}
	}

	// Attempt to add three never-reviewed cards
	additionalCardsNeeded := numCards + 3 - len(reviewCards)
	if additionalCardsNeeded > 0 {
		for _, card := range neverReviewedCards {
			if !containsCard(reviewCards, card) {
				reviewCards = append(reviewCards, card)
				if len(reviewCards) >= numCards+3 {
					break
				}
			}
		}
	}

	return reviewCards
}

func containsCard(cards []storage.Flashcard, card storage.Flashcard) bool {
	for _, c := range cards {
		if c.ID == card.ID {
			return true
		}
	}
	return false
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
	return encoder.Encode(s)
}

func (s *SRS) LoadSRSFromFile() error {
	file, err := os.Open(s.fileName)
	if err != nil {
		return err
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	return decoder.Decode(s)
}
