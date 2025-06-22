export default function CardListView({ SRS }) {
  return class extends HTMLElement {
    constructor() {
      super();
      this.cards = [];
      this.deckName = "";
      this.loading = false;
      this.bindMethods();
    }

    bindMethods() {
      this.handleTableClick = this.handleTableClick.bind(this);
      this.handleAddCard = this.handleAddCard.bind(this);
      this.handleEditCard = this.handleEditCard.bind(this);
      this.handleDeleteCard = this.handleDeleteCard.bind(this);
      this.handleRenameCard = this.handleRenameCard.bind(this);
    }

    async connectedCallback() {
      this.addEventListener("click", this.handleTableClick);
      this.render();
    }

    disconnectedCallback() {
      this.removeEventListener("click", this.handleTableClick);
    }

    set data({ cards, deckName }) {
      this.cards = cards || [];
      this.deckName = deckName || "";
      this.render();
    }

    setLoading(loading) {
      this.loading = loading;
      if (this.querySelector(".card-list-view")) {
        this.querySelector(".card-list-view").classList.toggle(
          "loading",
          loading,
        );
      }
    }

    async loadCards() {
      if (!this.deckName) return;

      try {
        this.setLoading(true);
        const cards = await SRS.GetCardsFromDeck(this.deckName);
        this.cards = cards || [];
        this.render();
      } catch (error) {
        console.error("Error loading cards:", error);
        this.showToast("Error loading cards", "error");
      } finally {
        this.setLoading(false);
      }
    }

    handleTableClick(event) {
      const target = event.target;
      const action = target.getAttribute("data-action");
      const cardId = target.closest("tr")?.getAttribute("data-card-id");

      if (!action || !cardId) return;

      switch (action) {
        case "edit":
          this.handleEditCard(cardId);
          break;
        case "delete":
          this.handleDeleteCard(cardId);
          break;
        case "rename":
          this.handleRenameCard(cardId);
          break;
      }
    }

    async handleAddCard() {
      const newCardId = await SRS.GenerateID();
      const newCard = {
        deckId: this.deckName,
        id: newCardId,
        title: "New Card",
        content: "# New Card\n\n<card-back>\n\nAnswer here\n\n</card-back>",
      };

      try {
        this.setLoading(true);
        const result = await SRS.AddOrUpdateCard(
          this.deckName,
          newCardId,
          newCard.title,
          newCard.content,
        );

        if (result && result.id) {
          await this.loadCards();
          this.showToast("Card added successfully", "success");
          this.handleEditCard(newCardId);
        }
      } catch (error) {
        console.error("Error adding card:", error);
        this.showToast("Error adding card", "error");
      } finally {
        this.setLoading(false);
      }
    }

    async handleEditCard(cardId) {
      const card = this.cards.find((c) => c.id === cardId);
      if (!card) return;

      this.dispatchEvent(
        new CustomEvent("edit-card", {
          detail: {
            deckName: this.deckName,
            cardId: cardId,
            content: card.content,
            title: card.title,
          },
          bubbles: true,
          composed: true,
        }),
      );
    }

    async handleDeleteCard(cardId) {
      try {
        const confirmed = await SRS.showConfirm(
          "Are you sure you want to delete this card?",
          "Delete Card",
        );
        if (!confirmed) return;

        this.setLoading(true);
        await SRS.DeleteCardFromDeck(this.deckName, cardId);
        await this.loadCards();
        this.showToast("Card deleted successfully", "success");
      } catch (error) {
        if (error.message !== "Cancelled") {
          console.error("Error deleting card:", error);
          this.showToast("Error deleting card", "error");
        }
      } finally {
        this.setLoading(false);
      }
    }

    async handleRenameCard(cardId) {
      const card = this.cards.find((c) => c.id === cardId);
      if (!card) return;

      try {
        const newTitle = await SRS.showPrompt(
          "Enter new title for the card:",
          card.title,
          "Rename Card",
        );
        if (!newTitle || newTitle.trim() === "") return;

        this.setLoading(true);
        const result = await SRS.AddOrUpdateCard(
          this.deckName,
          cardId,
          newTitle.trim(),
          card.content,
        );

        if (result && result.id) {
          await this.loadCards();
          this.showToast("Card renamed successfully", "success");
        }
      } catch (error) {
        if (error.message !== "Cancelled") {
          console.error("Error renaming card:", error);
          this.showToast("Error renaming card", "error");
        }
      } finally {
        this.setLoading(false);
      }
    }

    showToast(message, type = "info") {
      const mainContent = this.closest("main-content");
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

    async getCardPreview(content) {
      if (!content) return "";
      try {
        return await SRS.GetCardPreview(content);
      } catch (error) {
        console.error("Error getting card preview:", error);
        const textContent = content
          .replace(/<card-back>.*/s, "")
          .replace(/[#*`]/g, "")
          .replace(/<[^>]*>/g, "")
          .trim();

        return textContent.length > 100
          ? textContent.substring(0, 100) + "..."
          : textContent;
      }
    }

    async escapeHtml(text) {
      if (!text) return "";
      try {
        return await SRS.EscapeHtml(text);
      } catch (error) {
        console.error("Error escaping HTML:", error);
        return text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }
    }

    async render() {
      if (!this.deckName) {
        this.innerHTML = `
        <div class="card-list-view">
          <div class="card-list-view-empty">
            <p>No deck selected</p>
          </div>
        </div>
      `;
        return;
      }

      const escapedCards = await Promise.all(
        this.cards.map(async (card) => ({
          ...card,
          escapedTitle: await this.escapeHtml(card.title)
        }))
      );

      this.innerHTML = `
      <div class="card-list-view ${this.loading ? "loading" : ""}">
        <div class="card-list-view-header">
          <h2>Cards in "${this.deckName}"</h2>
          <button class="add-card-btn" data-action="add">
            <i data-feather="plus"></i> Add Card
          </button>
        </div>
        
        ${
          this.cards.length === 0
            ? `
          <div class="card-list-view-empty">
            <p>No cards in this deck. Click "Add Card" to create your first card.</p>
          </div>
        `
            : `
          <div class="card-list-view-table-container">
            <table class="card-list-view-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${escapedCards
                  .map(
                    (card) => `
                  <tr data-card-id="${card.id}">
                    <td class="card-title">${card.escapedTitle || "Untitled"}</td>
                    <td class="card-actions">
                      <button class="action-btn delete-btn" data-action="delete" title="Delete Card">
                        <i data-feather="trash"></i>
                      </button>
                      <button class="action-btn rename-btn" data-action="rename" title="Rename Card">
                        <i data-feather="type"></i>
                      </button>
                      <button class="action-btn edit-btn" data-action="edit" title="Edit Card">
                        <i data-feather="edit-2"></i>
                      </button>
                    </td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
        }
      </div>
    `;

      const addCardBtn = this.querySelector(".add-card-btn");
      if (addCardBtn) {
        addCardBtn.addEventListener("click", this.handleAddCard);
      }

      if (window.feather) window.feather.replace();
    }
  };
}
