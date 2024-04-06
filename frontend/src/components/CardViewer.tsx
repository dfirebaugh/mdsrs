import React, { useEffect, useState } from 'react';
import Card from './Card';
import IconButton from './IconButton';
import { storage } from '../../wailsjs/go/models';

import "./CardViewer.css";
import TextButton from './TextButton';
import { UpdateSRSData } from '../../wailsjs/go/main/App';

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
        handleReviewConfidence(1);
        event.preventDefault();
      }
      if (event.code === 'Digit2') {
        handleReviewConfidence(2);
        event.preventDefault();
      }
      if (event.code === 'Digit3') {
        handleReviewConfidence(3);
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFlipped]);

  const handleReviewConfidence = (confidenceLevel: number) => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
    setIsFlipped(false);

    const currentCard = cards[currentIndex];
    UpdateSRSData(currentCard.deckId, currentCard.id, confidenceLevel)
  };

  if (cards.length === 0) {
    return <p>No cards available.</p>
  }
  return (
    <div className="review-container">
      <div className="card-content">
          <Card key={cards[currentIndex].id} id={cards[currentIndex].id}>
            {!isFlipped ? extractCardFront(cards[currentIndex].content) : extractCardBack(cards[currentIndex].content)}
          </Card>
      </div>
      <div className="review-controls">
        <IconButton icon="material-symbols:flip" onClick={() => setIsFlipped(!isFlipped)} />
        <TextButton title={'hard (1)'} onClick={() => handleReviewConfidence(1)}/>
        <TextButton title={'iffy (2)'} onClick={() => handleReviewConfidence(2)}/>
        <TextButton title={'easy (3)'} onClick={() => handleReviewConfidence(3)}/>
      </div>
    </div>
  );
};

export default CardViewer;
