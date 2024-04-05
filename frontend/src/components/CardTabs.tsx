import { storage } from "../../wailsjs/go/models";
import "./CardTabs.css"
import IconButton from "./IconButton";

interface Tab {
  deckId: string;
  id: string;
  title: string;
  isSaved: boolean;
  isActive: boolean;
  onSelectTab: (card: storage.Flashcard) => void;
  onCloseTab: (tabId: string) => void;
}

const CardTab: React.FC<Tab> = ({ deckId, id, title, isSaved, isActive, onSelectTab, onCloseTab }) => {
  return (
    <div key={id} className={`tab ${isActive ? 'active' : ''}`}>
      <span className="tab-title" onClick={() => onSelectTab({
        deckId: deckId, id: id,
        title: title,
        content: ""
      })}>
        {title}
      </span>
      <div className="tab-actions">
        {!!isSaved ?
          <>
            <IconButton title="deck list" hoverIcon="material-symbols:close" icon="material-symbols:circle" onClick={() => onCloseTab(id)} />
          </>
          : <>
            <IconButton title="deck list" icon="material-symbols:close" onClick={() => onCloseTab(id)} />
          </>
        }
      </div>
    </div>
  );
};

interface CardTabsProps {
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (card: storage.Flashcard) => void;
  onCloseTab: (tabId: string) => void;
}

const CardTabs: React.FC<CardTabsProps> = ({ tabs, activeTabId, onSelectTab, onCloseTab }) => {
  return (
    <div className="card-tabs">
      {tabs.map(tab => <CardTab
        deckId={tab.deckId}
        id={tab.id}
        title={tab.title}
        isSaved={false}
        isActive={activeTabId === tab.id}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab} />)}
    </div>
  );
};

export default CardTabs;
