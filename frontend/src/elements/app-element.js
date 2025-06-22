export default function AppElement({ SRS }) {
  return class extends HTMLElement {
    constructor() {
      super();
      this.handleSidebarAction = this.handleSidebarAction.bind(this);

      // if (window.go?.main?.App) {
      this.loadInitialData();
      // } else {
      // window.addEventListener("wails:ready", () => {
      // 	this.loadInitialData();
      // });
      // }
    }

    async loadInitialData() {
      const [decksError] = await this.loadDecks();
      if (decksError) {
        console.error("Error loading decks:", decksError);
        return;
      }

      const [defaultDeckError] = await this.ensureDefaultDeck();
      if (defaultDeckError) {
        console.error("Error ensuring default deck:", defaultDeckError);
        return;
      }

      const [reviewError] = await this.updateReviewCards();
      if (reviewError) {
        console.error("Error updating review cards:", reviewError);
        return;
      }

      await this.render();

      const mainContent = this.querySelector("main-content");
      if (mainContent && typeof mainContent.render === "function") {
        await mainContent.render();
      }
    }

    async loadDecks() {
      const decks = await SRS.GetDecks();
      if (decks) {
        SRS.setDecks(decks);
      }
      return [null];
    }

    async ensureDefaultDeck() {
      const decks = SRS.getDecks();
      if (Object.keys(decks).length === 0) {
        const defaultDeck = await SRS.NewDeck("Getting Started");
        if (!defaultDeck) {
          return [new Error("Failed to create default deck")];
        }

        const card = await SRS.AddOrUpdateCard(
          "Getting Started",
          "",
          "Welcome to MDSRS!",
          "This is your first card. Click the edit button to modify it.",
        );
        if (!card) {
          return [new Error("Failed to create default card")];
        }

        const srsResult = await SRS.UpdateSRSData(
          "Getting Started",
          card.ID,
          0,
        );
        if (!srsResult) {
          return [new Error("Failed to initialize SRS data")];
        }

        const [error] = await this.loadDecks();
        if (error) return [error];
      }
      return [null];
    }

    async updateReviewCards() {
      let cards;
      try {
        cards = await SRS.GetReviewCards();
      } catch (error) {
        return [error];
      }
      SRS.setReviewCards(cards);
      SRS.setViewState({ isReviewingCards: true });
      await this.render();
      return [null];
    }


    getSidebarItems() {
      return [
        {
          icon: "book",
          tooltip: "Deck Explorer",
          action: "openDeckExplorer",
        },
        {
          icon: "calendar",
          tooltip: "Future Reviews",
          action: "showFutureReviews",
        },
        {
          icon: "settings",
          tooltip: "Configuration",
          action: "editConfig",
          bottom: true,
        },
        {
          icon: "info",
          tooltip: "About",
          action: "showAbout",
          bottom: true,
        },
      ];
    }

    async handleSidebarAction(action) {
      const viewState = SRS.getViewState();
      if (viewState.isEditingConfig && action !== "editConfig") {
        const configEditor = this.querySelector("config-editor");
        if (configEditor && typeof configEditor.saveConfig === "function") {
          await configEditor.saveConfig();
        }
      }

      const newViewState = {
        ...SRS.getViewState(),
        isExplorerVisible: action === "openDeckExplorer",
        isEditingConfig: action === "editConfig",
        isReviewingCards: false,
        isAboutVisible: action === "showAbout",
        isCreatingDeck: false,
        isCardListViewVisible: false,
        isEditingCard: false,
        isFutureReviewsVisible: action === "showFutureReviews",
      };
      SRS.setViewState(newViewState);

      if (action === "startReview") {
        await this.updateReviewCards();
      }

      await this.render();
    }

    async loadCardsForDeck(deckName) {
      const cards = await SRS.GetCardsFromDeck(deckName);
      if (cards) {
        SRS.setReviewCards(cards);
      }
    }

    async loadReviewCards(deckName = null) {
      const cards = await SRS.GetReviewCardsForDeck(deckName);
      if (cards && cards.length > 0) {
        SRS.setReviewCards(cards);
      } else {
        SRS.setReviewCards([]);
        this.showToast("No cards available for review", "info");
      }
      await this.render();
      return [null];
    }

    showToast(message, type = "info") {
      const mainContent = this.querySelector("main-content");
      if (mainContent && mainContent.showToast) {
        mainContent.showToast(message, type);
      } else {
        const toast = document.createElement("toast-element");
        document.body.appendChild(toast);
        toast.show(message, type);
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 3000);
      }
    }

    async render() {
      this.innerHTML = `
            <div class="app-container">
                <sidebar-element class="sidebar"></sidebar-element>
                <main-content></main-content>
                <modal-element></modal-element>
            </div>
        `;

      this.querySelector("sidebar-element").addEventListener(
        "sidebar-action",
        (e) => {
          this.handleSidebarAction(e.detail.action);
        },
      );

      if (window.feather) {
        window.feather.replace();
      }
    }
  };
}
