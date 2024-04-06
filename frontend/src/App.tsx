import React, { useEffect, useState } from 'react';
import './App.css';
import IconButton from './components/IconButton';
import MainLayout from './layout/MainLayout';
import About from './components/About';
import DeckList from './components/DeckList';
import { storage } from '../wailsjs/go/models';
import { GetCardContent, GetReviewCards, AddOrUpdateCard } from '../wailsjs/go/main/App';
import CardEditor from './components/CardEditor';
import CardTabs from './components/CardTabs';
import CardViewer from './components/CardViewer';
import ConfigEditor from './components/ConfigEditor';

function App() {
    const [isEditingConfig, setIsEditingConfig] = useState(false);
    const [isExplorerVisible, setIsExplorerVisible] = useState(true);
    const [isInReview, setIsInReview] = useState(false);
    const [openedCards, setOpenedCards] = useState<storage.Flashcard[]>([]);
    const [reviewCards, setReviewCards] = useState<storage.Flashcard[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [currentContent, setCurrentContent] = useState<string>("");

    useEffect(() => {
        setCurrentContent("");
    }, []);

    useEffect(() => {
        updateReviewCards();
    }, [])

    useEffect(() => {
        updateReviewCards();
    }, [openedCards])

    function updateReviewCards() {
        GetReviewCards().then(cards => {
            setReviewCards(cards);
        });
    }

    const handleOpenCard = async (cardToOpen: storage.Flashcard) => {
        let cardIndex = openedCards.findIndex(c => c.id === cardToOpen.id);
        if (cardIndex === -1) {
            try {
                console.log("fetching card content for", cardToOpen);
                const content = await GetCardContent(cardToOpen.deckId, cardToOpen.id);
                const newCard: storage.Flashcard = { ...cardToOpen, content: content };
                setOpenedCards(prev => [...prev, newCard]);
                setActiveTabId(cardToOpen.id);
                setCurrentContent(content);
            } catch (error) {
                console.error("Failed to fetch card content", error);
            }
        } else {
            setActiveTabId(cardToOpen.id);
            setCurrentContent(openedCards[cardIndex].content);
        }
    };

    const closeCard = (cardId: string) => {
        setOpenedCards(openedCards.filter(c => c.id !== cardId));
        setActiveTabId(null);
    };

    const checkIfCardIsSaved = (cardId: string) => {
        console.log("is saved:" , openedCards.find(c => c.id === cardId)?.content === currentContent);
        return openedCards.find(c => c.id === cardId)?.content === currentContent;
    };

    const renderMainAreaContent = () => {
        if (isEditingConfig) {
            return <ConfigEditor />;
        }
        if (isInReview) return <CardViewer cards={reviewCards} />;
        if (!openedCards.length) return <About />;

        return (
            <>
                <CardTabs
                    tabs={openedCards.map(card => ({
                        deckId: card.deckId,
                        id: card.id,
                        title: card.title || 'Untitled',
                        isSaved: checkIfCardIsSaved(card.id),
                        isActive: card.id === activeTabId,
                        onSelectTab: () => handleOpenCard(card),
                        onCloseTab: closeCard,
                    }))}
                    onSelectTab={handleOpenCard}
                    onCloseTab={closeCard}
                    activeTabId={activeTabId || ''}
                />
                {openedCards.map(card => {
                    if (card.id === activeTabId) {
                        return (
                            <CardEditor
                                key={card.id}
                                initialContent={currentContent}
                                onSave={(content) => {
                                    console.log("saving content", content);
                                    AddOrUpdateCard(card.deckId, card.id, card.title, content);
                                    updateReviewCards();
                                }} />
                        );
                    }
                    return null;
                })}
            </>
        );
    };

    return (
        <MainLayout
            sidebarItems={[
                {
                    id: 'home',
                    label: 'Home',
                    icon: <IconButton title="Home" icon="material-symbols:stacks-rounded" />,
                    onClick: () => {
                        setIsInReview(false);
                        setIsExplorerVisible(!isExplorerVisible);
                        setIsEditingConfig(false);
                    },
                },
                {
                    id: 'review',
                    label: 'Review',
                    icon: <IconButton title="Review" icon="mdi:run" />,
                    onClick: () => {
                        updateReviewCards();
                        setIsExplorerVisible(false);
                        setIsEditingConfig(false);
                        setIsInReview(true);
                    },
                },
                {
                    id: 'config',
                    label: 'Config',
                    icon: <IconButton title="Config" icon="material-symbols:settings" />,
                    onClick: () => {
                        setIsExplorerVisible(false);
                        setIsInReview(false);
                        setIsEditingConfig(true);
                    },
                }
            ]}
            isExplorerVisible={isExplorerVisible}
            explorerContent={<DeckList handleOpenCard={handleOpenCard} />}
            mainAreaContent={renderMainAreaContent()}
            gridTemplateColumns={isExplorerVisible ? ".1fr .1fr 10fr" : ".1fr 11fr"}
        />
    );
}

export default App;
