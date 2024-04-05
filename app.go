package main

import (
	"changeme/internal/storage"
	"context"
	"fmt"
)

// App struct
type App struct {
	decks map[string]*storage.Deck
	ctx   context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	a := &App{
		decks: make(map[string]*storage.Deck),
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
	a.decks[name] = storage.NewDeck(name)
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
		}
	}
	return content
}

func (a *App) UpdateSRSData() {}

func (a *App) GetReviewCards() []storage.Flashcard {
	var cards []storage.Flashcard

	for _, deck := range a.decks {
		cards = append(cards, deck.Cards...)
	}
	return cards
}
