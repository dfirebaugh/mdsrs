import React, { useEffect, useState } from 'react';
import './App.css';
import IconButton from './components/IconButton';
import MainLayout from './layout/MainLayout';
import About from './components/About';
import { storage } from '../wailsjs/go/models';
import { GetReviewCards, LoadConfig } from '../wailsjs/go/main/App';
import CardViewer from './components/CardViewer';
import ConfigEditor from './components/ConfigEditor';

function App() {
    const [isEditingConfig, setIsEditingConfig] = useState(false);
    const [isExplorerVisible, setIsExplorerVisible] = useState(false);
    const [isInReview, setIsInReview] = useState(true);
    const [reviewCards, setReviewCards] = useState<storage.Flashcard[]>([]);
    const [currentContent, setCurrentContent] = useState<React.ReactNode>();
    const [explorerContent, setExplorerContent] = useState<React.ReactNode>();
    const [renderKey, setRenderKey] = useState(0);
    const [configVersion, setConfigVersion] = useState(0);

    useEffect(() => {
        updateReviewCards();
        LoadConfig().then(console.log);
    }, [isEditingConfig, isInReview, reviewCards?.length]);

    const updateConfigVersion = () => {
        setConfigVersion(v => v + 1);
    };

    useEffect(() => {
        updateReviewCards();
        LoadConfig().then(console.log)
        if (isEditingConfig) {
            setCurrentContent(<ConfigEditor />);
            return;
        }
        if (isInReview && reviewCards.length > 0) {
            setCurrentContent(<CardViewer key={renderKey} cards={reviewCards} />);
            return;
        }
        setCurrentContent(<About />);
    }, []);

    function updateReviewCards() {
        GetReviewCards().then(cards => {
            setReviewCards(cards);
        }).catch(error => {
            console.error("Error fetching review cards:", error);
        });
    }

    let sideBarItems = [
        {
            id: 'open',
            label: 'Open',
            icon: <IconButton title="Open" icon="mdi:folder" />,
            onClick: () => {
                // updateReviewCards();
                // setIsExplorerVisible(false);
                // setIsEditingConfig(false);
                // setIsInReview(true);
                // setRenderKey(prevKey => prevKey + 1);
                alert("should open a deck")
                setCurrentContent(<About />);
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
                setRenderKey(prevKey => prevKey + 1);
                setCurrentContent(<CardViewer key={renderKey} cards={reviewCards} />)
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
                updateConfigVersion();
                setCurrentContent(<ConfigEditor key={configVersion} />);
            },
        },
    ]

    return (
        <MainLayout
            sidebarItems={sideBarItems}
            isExplorerVisible={isExplorerVisible}
            explorerContent={explorerContent}
            mainAreaContent={currentContent}
            gridTemplateColumns={isExplorerVisible ? ".1fr .1fr 10fr" : ".1fr 11fr"}
        />
    );
}

export default App;
