import React, { useEffect, useState } from 'react';
import Card from './Card';
import IconButton from './IconButton';
import TextButton from './TextButton';
import { storage } from '../../wailsjs/go/models';
import "./CardViewer.css";
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
    if (cards && cards.length > 0) {
      setReviewCards(cards);
    } else {
      console.error("No cards provided to the viewer.");
    }
  }, [cards]);

  useEffect(() => {
    if (reviewCards.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsFlipped(flip => !flip);
        event.preventDefault();
      }

      ['Digit1', 'Digit2', 'Digit3'].forEach((key, idx) => {
        if (event.code === key) {
          handleReviewConfidence(idx + 1);
          event.preventDefault();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reviewCards, currentIndex, isFlipped]);

  const handleReviewConfidence = (confidenceLevel: number) => {
    setIsFlipped(false);
    if (reviewCards.length > currentIndex) {
      setReviewCards(current => {
        const nextCards = [...current];
        if (confidenceLevel === 1) {
          const cardToEnd = nextCards.splice(currentIndex, 1)[0];
          nextCards.push(cardToEnd);
        } else {
          nextCards.splice(currentIndex, 1);
        }
        return nextCards;
      });

      setCurrentIndex(prev => (confidenceLevel > 1 && currentIndex < reviewCards.length - 1) ? prev + 1 : prev);
      UpdateSRSData(reviewCards[currentIndex].deckId, reviewCards[currentIndex].id, confidenceLevel);
    }
  };

  if (!reviewCards || reviewCards.length === 0 || !reviewCards[currentIndex]) {
    return <p>No cards available for review</p>;
  }

  return (
    <div className="review-container">
      <div className="card-content">
        <Card key={reviewCards[currentIndex].id} id={reviewCards[currentIndex].id}>
          {!isFlipped ? extractCardFront(reviewCards[currentIndex].content) : extractCardBack(reviewCards[currentIndex].content)}
        </Card>
      </div>
      <div className="review-controls">
        <IconButton icon="material-symbols:flip" onClick={() => setIsFlipped(flip => !flip)} />
        <TextButton title={'hard (1)'} onClick={() => handleReviewConfidence(1)} />
        <TextButton title={'iffy (2)'} onClick={() => handleReviewConfidence(2)} />
        <TextButton title={'easy (3)'} onClick={() => handleReviewConfidence(3)} />
        <div style={{ width: '2rem', paddingLeft: 12 }}>
          {reviewCards.length}
        </div>
      </div>
    </div>
  );
};

export default CardViewer;
