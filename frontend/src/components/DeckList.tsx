import React, { useState, useEffect } from 'react';
import IconButton from './IconButton';
import { storage } from '../../wailsjs/go/models';
import { AddOrUpdateCard, GetDecks, NewDeck } from '../../wailsjs/go/main/App';
import './DeckList.css';
import Deck from './Deck';

interface DeckListProps {
  handleOpenCard: (card: storage.Flashcard) => void;
}

const DeckList: React.FC<DeckListProps> = ({ handleOpenCard }) => {
  const [decks, setDecks] = useState<storage.Deck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    updateDecks()
  }, []);

  function updateDecks() {
    setLoading(true);
    GetDecks()
      .then(d => {
        setDecks(Object.values(d));
        console.log(decks)
      })
      .catch(() => setError('Failed to load decks'))
      .finally(() => setLoading(false));
  }

  const handleAddDeck = () => {
    const deckName = prompt("Enter the name of the new deck:");
    if (deckName) {
      const newDeck = new storage.Deck();
      newDeck.name = deckName;
      NewDeck(deckName);
      updateDecks();
    }
  };

  function handleAddCard(deckName: string) {
    const cardName = prompt("Enter the name of the new deck:");
    console.log("adding a card to deck: ", deckName);
    if (cardName) {
      const card = new storage.Flashcard();
      card.deckId = deckName;
      card.title = cardName;
      card.content = `
# Front of Card

<card-back>
# Back of Card

</card-back>
`
      AddOrUpdateCard(deckName, card.id, card.title, card.content);
      updateDecks();
    }
  }

  if (loading) return <div className="deckList-loading">Loading...</div>;
  if (error) return <div className="deckList-error">Error: {error}</div>;

  return (
    <div className="deckList-container">
      <h2>Decks</h2>
      <IconButton title="Add a deck" icon="material-symbols:add" onClick={handleAddDeck} />
      <ul className="deckList">
        {decks.map(deck => (
          <li key={deck.name} className="deckListItem">
            <Deck deck={deck} handleOpenCard={handleOpenCard} handleAddCard={handleAddCard} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DeckList;
