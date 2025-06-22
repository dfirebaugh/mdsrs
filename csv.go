package main

import (
	"github.com/dfirebaugh/mdsrs/models"
	"github.com/dfirebaugh/mdsrs/store"
	"github.com/sirupsen/logrus"
)


type CSVService struct {
	decks map[string]*models.Deck
}

func (a *CSVService) ExportDeck(deckName string) string {
	deck, ok := a.decks[deckName]
	if !ok {
		logrus.Errorf("deck not found: %s", deckName)
		return ""
	}

	csvData, err := store.ExportDeckToCSV(deck)
	if err != nil {
		logrus.Errorf("failed to export deck to CSV: %v", err)
		return ""
	}

	return csvData
}

func (a *CSVService) ImportDeck(deckName string, csvData string) error {
	deck, err := store.ImportCSVDeck(csvData, deckName)
	if err != nil {
		return err
	}

	a.decks[deck.Name] = deck
	return nil
}
