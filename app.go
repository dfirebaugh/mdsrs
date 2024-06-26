package main

import (
	"context"
	"fmt"

	"github.com/dfirebaugh/mdsrs/internal/audio"
	"github.com/dfirebaugh/mdsrs/internal/config"
	"github.com/dfirebaugh/mdsrs/internal/nihongo"
	"github.com/dfirebaugh/mdsrs/internal/srs"
	"github.com/dfirebaugh/mdsrs/internal/storage"

	"github.com/sirupsen/logrus"
)

// App struct
type App struct {
	*config.Config
	*audio.Player
	*nihongo.DictionaryService
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
		Config:            c,
		decks:             make(map[string]*storage.Deck),
		Player:            audio.NewPlayer(),
		DictionaryService: nihongo.NewDictionaryService(),
	}
	storage.EnsureDecksDir()
	decks, err := storage.LoadAllDecks()

	for _, d := range decks {
		d.SRS = srs.NewSRS(d.Name)
		d.SRS.LoadCardsFromMarkdown(d.DirPath)
	}

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
	s := srs.NewSRS(name)
	a.decks[name] = storage.NewDeck(name, s)
	s.LoadCardsFromMarkdown(a.decks[name].DirPath)
	a.decks[name].Save()

	return a.decks[name]
}

func (a *App) AddOrUpdateCard(deckID string, cardID string, title string, content string) storage.Flashcard {
	if cardID == "" {
		cardID = storage.GenerateID()
	}

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
	deck.SRS.LoadCardsFromMarkdown(deck.DirPath)

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

func (a *App) GetReviewCards() ([]storage.Flashcard, error) {
	if a == nil {
		return nil, fmt.Errorf("GetReviewCards called on nil App reference")
	}
	if a.decks == nil {
		return nil, fmt.Errorf("no decks available")
	}

	var cards []storage.Flashcard
	numCards := a.Config.NumberOfCardsInReview

	if numCards <= 0 {
		return nil, fmt.Errorf("invalid number of cards configured: %d", numCards)
	}

	for _, deck := range a.decks {
		if deck == nil {
			continue
		}

		deckReviewCards := deck.GetReviewCards(numCards)
		cards = append(cards, deckReviewCards...)
		numCards -= len(deckReviewCards)

		if numCards <= 0 {
			break
		}
	}

	if len(cards) == 0 {
		return nil, fmt.Errorf("no review cards found")
	}

	return cards, nil
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

func (a *App) Speak(text string, language string) {
	audio.Speak(text, language)
}

func (a *App) LoadConfig() config.Config {
	c, _ := config.LoadConfigFromFile(".mdsrs/config.json")
	a.Config = c
	return *c
}

func (a *App) Tokenize(text string) []nihongo.WordInfo {
	var response []nihongo.WordInfo
	tokens := nihongo.Tokenize(text)

	for _, t := range tokens {
		if t.Surface == "BOS" || t.Surface == "EOS" {
			response = append(response, nihongo.WordInfo{})
			continue
		}
		word, err := a.DictionaryService.Lookup(t.Surface)
		if err != nil {
			logrus.Error(err)
			response = append(response, nihongo.WordInfo{})
			continue
		}
		response = append(response, *word)
	}

	response = response[1:]
	return response[:len(response)-1]
}

func (a *App) Lookup(word string) nihongo.WordInfo {
	result, _ := a.DictionaryService.Lookup(word)
	return *result
}
