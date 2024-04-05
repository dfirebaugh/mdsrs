import { useState } from 'react';
import { storage } from '../../wailsjs/go/models';
import "./Deck.css";
import IconButton from './IconButton';

function Card({ card, handleOpenCard }: { card: storage.Flashcard, handleOpenCard: (card: storage.Flashcard) => void }) {
  return (<div className="card deck-list-label" onClick={() => handleOpenCard(card)}>
    <li>
      <h1 >{card.title}</h1>
    </li>
  </div>);
}

export default function Deck({ deck, handleOpenCard, handleAddCard }: { deck: storage.Deck, handleOpenCard: (card: storage.Flashcard) => void, handleAddCard: (deckName: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => setIsExpanded(!isExpanded);

  return (
    <div>
      <div className="deck-name">
        <h1 className="deck-list-label" onClick={toggleExpansion}>
          {isExpanded ? '↓' : '>'} {deck.name}
        </h1>
        <IconButton title="delete the deck" icon="mdi:trash-outline" onClick={() => {}} />
        <IconButton title="add a card" icon="material-symbols:add" onClick={function(d: { name: string; }) {
          return function () {
            handleAddCard(d.name);
          };
        }(deck)} />
      </div>
      {isExpanded && (
        <ul>
          {deck.cards?.map(card => (
            <>
            <Card key={card.id} handleOpenCard={handleOpenCard} card={card} />
            </>
          ))}
        </ul>
      )}
    </div>
  );
}
