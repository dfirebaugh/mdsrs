export default function MainContent({ SRS, ConfigService }) {
  return class extends HTMLElement {
    constructor() {
      super();
      this.style.position = "relative";
    }

    connectedCallback() {
      this.render().catch(console.error);
    }

    async escapeHtmlAttribute(text) {
      if (!text) return "";
      return await SRS.EscapeHtmlAttribute(text);
    }

    showToast(message, type = "info") {
      const toast = document.createElement("toast-element");
      this.appendChild(toast);
      toast.show(message, type);
      setTimeout(() => {
        if (this.contains(toast)) {
          this.removeChild(toast);
        }
      }, 3000);
    }

    async render() {
      let config = {};
      try {
        config = await ConfigService.Load();
      } catch (error) {
        console.error("Error loading config:", error);
      }

      const viewState = SRS.getViewState();
      const reviewCards = SRS.getReviewCards();
      // const currentDeck = SRS.getCurrentDeck();
      const cardEditState = SRS.getCardEditState();

      if (!viewState.isExplorerVisible && 
          !viewState.isEditingConfig && 
          !viewState.isReviewingCards && 
          !viewState.isAboutVisible && 
          !viewState.isCreatingDeck && 
          !viewState.isCardListViewVisible && 
          !viewState.isEditingCard &&
          !viewState.isFutureReviewsVisible) {
        this.innerHTML = `
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        `;
        return;
      }

      let content = "";
      if (viewState.isExplorerVisible) {
        content = `<deck-explorer></deck-explorer>`;
      } else if (viewState.isEditingConfig) {
        content = `<config-editor></config-editor>`;
      } else if (viewState.isReviewingCards) {
        content = `<card-viewer cards='${JSON.stringify(reviewCards)}'></card-viewer>`;
      } else if (viewState.isAboutVisible) {
        content = `<about-element></about-element>`;
      } else if (viewState.isFutureReviewsVisible) {
        content = `<future-reviews></future-reviews>`;
      } else if (viewState.isCardListViewVisible) {
        content = `<card-list-view></card-list-view>`;
      } else if (viewState.isEditingCard) {
        const escapedTitle = await this.escapeHtmlAttribute(cardEditState.currentCardTitle || "Untitled");
        const escapedContent = await this.escapeHtmlAttribute(cardEditState.currentCardContent || "");
        content = `
        <div class="card-editor-container">
          <div class="card-editor-header">
            <h2>Editing Card: ${escapedTitle}</h2>
            <div class="card-editor-actions">
              <button class="save-card-btn">Save</button>
              <button class="cancel-card-btn">Cancel</button>
            </div>
          </div>
          <code-editor 
            value="${escapedContent}" 
            language="markdown" 
            theme="dark">
          </code-editor>
        </div>
      `;
      } else {
        content = `<card-viewer></card-viewer>`;
      }
      this.innerHTML = content;

      const deckExplorer = this.querySelector("deck-explorer");
      if (deckExplorer) {
        deckExplorer.addEventListener("deck-selected", async (e) => {
          const { deckName } = e.detail;
          SRS.setCurrentDeck(deckName);
          SRS.setViewState({
            isExplorerVisible: false,
            isReviewingCards: true,
            isCardListViewVisible: false,
            isEditingCard: false,
            isDrillMode: true,
          });
          await this.loadCardsForDeck(deckName).catch(console.error);
          await this.render();
        });

        deckExplorer.addEventListener("deck-list-view", async (e) => {
          const { deckId } = e.detail;
          SRS.setCurrentDeck(deckId);
          SRS.setViewState({
            isExplorerVisible: false,
            isReviewingCards: false,
            isCardListViewVisible: true,
            isEditingCard: false,
          });
          await this.render();
        });

        deckExplorer.addEventListener("review-selected-decks-complete", async () => {
          await this.render();
        });
      }

      const cardListView = this.querySelector("card-list-view");
      if (cardListView) {
        this.loadCardsForListView();

        cardListView.addEventListener("edit-card", async (e) => {
          const { deckName, cardId, content, title } = e.detail;
          SRS.setCurrentDeck(deckName);
          SRS.setViewState({
            isCardListViewVisible: false,
            isEditingCard: true,
          });
          SRS.setCardEditState({
            currentCardId: cardId,
            currentCardContent: content,
            currentCardTitle: title,
          });
          await this.render();
        });
      }

      const cardEditor = this.querySelector(".card-editor-container");
      if (cardEditor) {
        const saveBtn = cardEditor.querySelector(".save-card-btn");
        const cancelBtn = cardEditor.querySelector(".cancel-card-btn");
        const codeEditor = cardEditor.querySelector("code-editor");

        saveBtn.addEventListener("click", async () => {
          const currentDeck = SRS.getCurrentDeck();
          const cardEditState = SRS.getCardEditState();
          if (codeEditor && currentDeck && cardEditState.currentCardId) {
            const content = codeEditor.value;
            try {
              await SRS.AddOrUpdateCard(
                currentDeck,
                cardEditState.currentCardId,
                cardEditState.currentCardTitle,
                content,
              );
              const decks = await SRS.GetDecks();
              if (decks) {
                SRS.setDecks(decks);
              }
              SRS.setViewState({
                isEditingCard: false,
                isCardListViewVisible: true,
              });
              await this.render();
            } catch (error) {
              console.error("Error saving card:", error);
            }
          }
        });

        cancelBtn.addEventListener("click", async () => {
          SRS.setViewState({
            isEditingCard: false,
            isCardListViewVisible: true,
          });
          await this.render();
        });
      }

      const cardViewer = this.querySelector("card-viewer");
      if (cardViewer) {
        cardViewer.cards = reviewCards;
      }
    }

    async loadCardsForDeck(deckName) {
      try {
        const cards = await SRS.GetCardsFromDeck(deckName);
        if (cards) {
          SRS.setReviewCards(cards);
        }
      } catch (error) {
        console.error("Error loading cards for deck:", error);
      }
    }

    async loadCardsForListView() {
      const currentDeck = SRS.getCurrentDeck();
      if (!currentDeck) return;

      try {
        const cards = await SRS.GetCardsFromDeck(currentDeck);
        const cardListView = this.querySelector("card-list-view");
        if (cardListView) {
          cardListView.data = {
            cards: cards || [],
            deckName: currentDeck,
          };
        }
      } catch (error) {
        console.error("Error loading cards for list view:", error);
      }
    }
  };
}
