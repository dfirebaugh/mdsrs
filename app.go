package main

import (
	"context"
	"fmt"

	"github.com/dfirebaugh/mdsrs/internal/audio"
	"github.com/dfirebaugh/mdsrs/internal/config"
	"github.com/dfirebaugh/mdsrs/internal/srs"
	"github.com/dfirebaugh/mdsrs/internal/storage"

	"github.com/sirupsen/logrus"
)

// App struct
type App struct {
	*config.Config
	*audio.Player
	decks map[string]*storage.Deck
	ctx   context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	c, err := config.LoadConfigFromFile(".mdsrs/config.json")
	if err != nil {
		logrus.Error(err)
		c = config.NewConfig()
	}
	a := &App{
		Config: c,
		decks:  make(map[string]*storage.Deck),
		Player: audio.NewPlayer(),
	}
	storage.EnsureDecksDir()
	decks, err := storage.LoadAllDecks()

	if err != nil {
		panic(err)
	}

	for _, deck := range decks {
		a.decks[deck.Name] = deck
	}

	return a
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) GetDecks() map[string]*storage.Deck {
	return a.decks
}

func (a *App) NewDeck(name string) *storage.Deck {
	a.decks[name] = storage.NewDeck(name, srs.NewSRS(name))
	a.decks[name].Save()

	return a.decks[name]
}

func (a *App) AddOrUpdateCard(deckID string, cardID string, title string, content string) storage.Flashcard {
	if cardID == "" {
		cardID = storage.GenerateID()
	}
	println("adding or updating card in deck: ", deckID)
	println("cardID: ", cardID)
	println("content: ", content)
	d := a.decks[deckID]
	if d == nil {
		fmt.Println("Deck not found, cannot add or update card")
		return storage.Flashcard{}
	}
	card := storage.Flashcard{
		DeckID:  deckID,
		ID:      cardID,
		Title:   title,
		Content: content,
	}
	d.AddOrUpdateCard(card)

	return card
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

func (a *App) UpdateSRSData(deckID string, cardID string, reviewConfidence int) {
	// Check if the deck exists and is not nil
	deck, ok := a.decks[deckID]
	if !ok || deck == nil {
		logrus.Error("Deck not found or is nil")
		return
	}

	deck.SRS = srs.NewSRS(deck.DirPath)

	// Check if SRS data in the deck is not nil
	if deck.SRS == nil {
		logrus.Error("SRS data in deck is nil")
		return
	}

	// Proceed to update SRS data
	deck.SRS.UpdateSRSData(deck, cardID, reviewConfidence)

	// Safely attempt to save SRS data to file
	if err := deck.SaveSRSToFile(); err != nil {
		logrus.Errorf("Failed to save SRS data: %v", err)
	}
}

func (a *App) GetReviewCards() []storage.Flashcard {
	var cards []storage.Flashcard

	for _, deck := range a.decks {
		cards = append(cards, deck.Cards...)
	}
	return cards
}

func (a *App) SaveConfig(configJSON string) {
	if err := a.Config.UpdateConfigFromJSON(configJSON); err != nil {
		logrus.Error(err)
	}

	if err := a.Config.SaveConfig(".mdsrs/config.json"); err != nil {
		logrus.Error(err)
	}
}

func (a *App) PlayAudioFile(content string) {
	a.Player.PlayAudioFile(content, audio.TypeMP3)
}
