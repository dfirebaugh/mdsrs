package main

import (
	"context"
	"crypto/rand"
	"fmt"
	"html"

	"github.com/dfirebaugh/mdsrs/config"
	"github.com/dfirebaugh/mdsrs/md"
	"github.com/dfirebaugh/mdsrs/models"
	"github.com/dfirebaugh/mdsrs/srs"
	"github.com/dfirebaugh/mdsrs/store"

	"github.com/sirupsen/logrus"
)

type App struct {
	*config.Config
	decks map[string]*models.Deck
	srs   models.SRS
	ctx   context.Context
}

func NewApp() *App {
	a := &App{
		Config: config.NewConfig(),
		decks:  make(map[string]*models.Deck),
	}

	if c, err := config.LoadConfigFromFile(".mdsrs/config.json"); err != nil {
		logrus.Warnf("Failed to load config file: %v, using default config", err)
	} else {
		a.Config = c
	}
	store.SetDBPath(a.Config.DBFile)

	if err := store.InitDB(); err != nil {
		logrus.Fatalf("Failed to initialize database: %v", err)
	}

	a.srs = srs.NewSRS("", store.GetDB())

	decks, err := store.LoadAllDecks()
	if err != nil {
		logrus.Fatalf("Failed to load decks: %v", err)
	}

	for _, deck := range decks {
		a.decks[deck.Name] = deck
	}

	return a
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) GetDecks() map[string]*models.Deck {
	for _, deck := range a.decks {
		if deck != nil && deck.Cards == nil {
			deck.Cards = []models.Flashcard{}
		}
	}
	return a.decks
}

func (a *App) NewDeck(name string) *models.Deck {
	deck := store.NewDeck(name)
	if deck == nil {
		logrus.Errorf("Failed to create deck: %s", name)
		return nil
	}
	a.decks[name] = deck
	return deck
}

func (a *App) AddOrUpdateCard(deckID string, cardID string, title string, content string) models.Flashcard {
	if cardID == "" {
		cardID = store.GenerateID()
	}

	d := a.decks[deckID]
	if d == nil {
		fmt.Println("Deck not found, cannot add or update card")
		return models.Flashcard{}
	}
	card := models.Flashcard{
		DeckID:  deckID,
		ID:      cardID,
		Title:   title,
		Content: content,
	}
	found := false
	for _, c := range d.Cards {
		if c.ID == cardID {
			found = true
			break
		}
	}
	var err error
	if found {
		err = store.AddOrUpdateCard(d, card)
	} else {
		err = store.AddCard(d, card)
	}
	if err != nil {
		logrus.Errorf("Failed to add/update card: %v", err)
		return models.Flashcard{}
	}

	return card
}

func (a *App) DeleteCardFromDeck(deckID string, cardID string) error {
	deck := a.decks[deckID]
	if deck == nil {
		return fmt.Errorf("deck not found: %s", deckID)
	}
	return store.DeleteCard(deck, cardID)
}

func (a *App) DeleteDeck(deckID string) error {
	if deckID == "" {
		return fmt.Errorf("deck ID cannot be empty")
	}

	if _, exists := a.decks[deckID]; !exists {
		return fmt.Errorf("deck not found: %s", deckID)
	}

	if err := store.DeleteDeck(deckID); err != nil {
		return fmt.Errorf("failed to delete deck from store: %w", err)
	}

	// Remove from memory
	delete(a.decks, deckID)

	return nil
}

func (a *App) GetCardContent(deckID string, cardID string) string {
	if deckID == "" {
		println("deckID is empty, cannot get card content")
		return ""
	}
	println("attempting to get card content for deckID: ", deckID)
	println("cardID: ", cardID)
	deck := a.decks[deckID]
	var content string
	for _, card := range deck.Cards {
		if card.ID == cardID {
			content = card.Content
			break
		}
	}
	return content
}

func (a *App) UpdateSRSData(deckID string, cardID string, reviewConfidence models.ReviewConfidence) {
	logrus.Infof("App.UpdateSRSData called with deckID: %s, cardID: %s, reviewConfidence: %d", deckID, cardID, reviewConfidence)

	if a.srs == nil {
		logrus.Error("SRS is nil in App")
		return
	}

	logrus.Infof("Calling App.srs.UpdateSRSData for card: %s", cardID)
	a.srs.UpdateSRSData(cardID, reviewConfidence)
}

func (a *App) GetCardSRSData(cardID string) models.CardData {
	if a.srs == nil {
		logrus.Error("SRS is nil in App")
		return models.CardData{}
	}

	return a.srs.GetCardData(cardID)
}

func (a *App) GetFutureReviewCards() []models.Flashcard {
	if a.srs == nil {
		logrus.Error("SRS is nil in App")
		return []models.Flashcard{}
	}

	return a.srs.GetFutureReviewCards()
}

func (a *App) GetReviewCards() []models.Flashcard {
	return a.GetReviewCardsForDeck("")
}

func (a *App) GetReviewCardsForDeck(deckName string) []models.Flashcard {
	if a == nil {
		logrus.Error("GetReviewCards called on nil App reference")
		return []models.Flashcard{}
	}
	if a.decks == nil {
		logrus.Error("no decks available")
		return []models.Flashcard{}
	}

	numCards := a.Config.NumberOfCardsInReview

	if numCards <= 0 {
		logrus.Errorf("invalid number of cards configured: %d", numCards)
		return []models.Flashcard{}
	}

	if a.srs == nil {
		logrus.Error("SRS is nil in App")
		return []models.Flashcard{}
	}

	if deckName != "" {
		// Get review cards for a specific deck
		return a.srs.GetReviewCardsForDecks([]string{deckName}, numCards)
	}

	var deckNames []string
	for deckName := range a.decks {
		deckNames = append(deckNames, deckName)
	}

	return a.srs.GetReviewCardsForDecks(deckNames, numCards)
}

func (a *App) ToHTML(content string) string {
	println(content)
	return string(md.ToHTML([]byte(content)))
}

func (a *App) GetCardsFromDeck(deckName string) []models.Flashcard {
	deck, ok := a.decks[deckName]
	if !ok || deck == nil {
		println(ok, deck.Name)
		return nil
	}

	return deck.Cards
}

func (a *App) GetCards(deckNames []string, num int) []models.Flashcard {
	if a == nil {
		logrus.Error("GetCards called on nil App reference")
		return []models.Flashcard{}
	}
	if a.decks == nil {
		logrus.Error("no decks available")
		return []models.Flashcard{}
	}

	if a.srs == nil {
		logrus.Error("SRS is nil in App")
		return []models.Flashcard{}
	}

	if len(deckNames) == 0 {
		var allDeckNames []string
		for deckName := range a.decks {
			allDeckNames = append(allDeckNames, deckName)
		}
		return a.srs.GetReviewCardsForDecks(allDeckNames, num)
	}

	return a.srs.GetReviewCardsForDecks(deckNames, num)
}

func (a *App) EscapeHtml(text string) string {
	if text == "" {
		return ""
	}
	return html.EscapeString(text)
}

func (a *App) EscapeHtmlAttribute(text string) string {
	if text == "" {
		return ""
	}
	return html.EscapeString(text)
}

func (a *App) GenerateID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("%x", b)
}
