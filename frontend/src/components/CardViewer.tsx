import React, { useEffect, useState } from 'react';
import Card from './Card';
import IconButton from './IconButton';
import { storage } from '../../wailsjs/go/models';

import "./CardViewer.css";

interface CardViewerProps {
  cards: storage.Flashcard[];
}

function extractCardBack(inputText: string): string | null {
  const regex = /<card-back>(.*?)<\/card-back>/s;
  const matches = inputText.match(regex);
  return matches ? matches[1] : null;
}

function extractCardFront(inputText: string): string {
  const regex = /<card-back>.*?<\/card-back>/gs;
  return inputText.replace(regex, '');
}

const CardViewer: React.FC<CardViewerProps> = ({ cards }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsFlipped(!isFlipped);
        event.preventDefault();
      }
      if (event.code === 'Digit1') {
        handleNext();
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFlipped]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
    setIsFlipped(false);
  };

  return (
    <div className="review-container">
      <div className="card-content">
        {cards.length > 0 ? (
          <>
            <Card key={cards[currentIndex].id} id={cards[currentIndex].id}>
              {!isFlipped ? extractCardFront(cards[currentIndex].content) : extractCardBack(cards[currentIndex].content)}
            </Card>
          </>
        ) : (
          <p>No cards available.</p>
        )}
      </div>
      <div className="review-controls">
        <IconButton icon="material-symbols:flip" onClick={() => setIsFlipped(!isFlipped)} />
        <IconButton icon="material-symbols:arrow-forward" onClick={handleNext} />
      </div>
    </div>
  );
};

export default CardViewer;
