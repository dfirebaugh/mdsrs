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
  const [reviewCards, setReviewCards] = useState<storage.Flashcard[]>([]);
  useEffect(() => {
    setReviewCards(cards)
  }, [])

  useEffect(() => {
    console.log(reviewCards.length)
    if (reviewCards.length === 0) return;
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
  }, [reviewCards, isFlipped])

  const handleReviewConfidence = (confidenceLevel: number) => {
    setIsFlipped(false);

    setReviewCards((currentCards) => {
      let newCards = [...currentCards];

      if (confidenceLevel === 1) {
        const cardToEnd = newCards.splice(currentIndex, 1)[0];
        newCards.push(cardToEnd);
      } else if (confidenceLevel === 2 || confidenceLevel === 3) {
        newCards = newCards.filter((_, index) => index !== currentIndex);
      }

      return newCards;
    });

    setCurrentIndex((prevIndex) => {
      if (confidenceLevel === 1) {
        return prevIndex;
      } else {
        return (prevIndex + 1) % (reviewCards.length - 1);
      }
    });

    const currentCard = reviewCards[currentIndex];
    if (currentCard) {
      UpdateSRSData(currentCard.deckId, currentCard.id, confidenceLevel);
    }
  };

  if (reviewCards.length === 0 || !reviewCards[currentIndex]?.id) {
    return <p>No cards available or review has been finished</p>
  }

  return (
    <div className="review-container">
      <div className="card-content">
        <Card key={reviewCards[currentIndex]?.id} id={reviewCards[currentIndex]?.id}>
          {!isFlipped ? extractCardFront(reviewCards[currentIndex]?.content) : extractCardBack(reviewCards[currentIndex]?.content)}
        </Card>
      </div>
      <div className="review-controls">
        <IconButton icon="material-symbols:flip" onClick={() => setIsFlipped(!isFlipped)} />
        <TextButton title={'hard (1)'} onClick={() => handleReviewConfidence(1)} />
        <TextButton title={'iffy (2)'} onClick={() => handleReviewConfidence(2)} />
        <TextButton title={'easy (3)'} onClick={() => handleReviewConfidence(3)} />

        <div style={{ width: '2rem;', paddingLeft: 12 }}>
          {reviewCards.length}
        </div>
      </div>
    </div>
  );
};

export default CardViewer;
