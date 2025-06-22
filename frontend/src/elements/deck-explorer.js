export default function DeckExplorer({ SRS, ConfigService }) {
	return class extends HTMLElement {
		constructor() {
			super();
			this.loading = false;
			this.bindMethods();
		}

		bindMethods() {
			this.handleExport = this.handleExport.bind(this);
			this.handleDeckSelect = this.handleDeckSelect.bind(this);
			this.handleTableClick = this.handleTableClick.bind(this);
			this.handleAddDeck = this.handleAddDeck.bind(this);
			this.handleDeleteDeck = this.handleDeleteDeck.bind(this);
			this.handleReviewSelectedDecks = this.handleReviewSelectedDecks.bind(this);
			this.handleImportDeck = this.handleImportDeck.bind(this);
		}

		async connectedCallback() {
			this.setLoading(true);

			const existingDecks = SRS.getDecks();
			if (Object.keys(existingDecks).length === 0) {
				await this.loadDecks();
			} else {
				// console.warn("Decks already available in SRS state:", existingDecks);
			}

			this.setLoading(false);
			this.render();
			this.addEventListener("click", this.handleTableClick);
			this.querySelector(".add-deck-btn")?.addEventListener("click", this.handleAddDeck);
			this.querySelector(".import-deck-btn")?.addEventListener("click", this.handleImportDeck);
		}

		disconnectedCallback() {
			this.removeEventListener("click", this.handleTableClick);
		}

		setLoading(loading) {
			this.loading = loading;
			if (this.querySelector(".deck-explorer")) {
				this.querySelector(".deck-explorer").classList.toggle(
					"loading",
					loading,
				);
			}
		}

		handleTableClick(event) {
			const target = event.target;

			if (target.classList.contains("open-deck-btn")) {
				SRS.setViewState({
					isExplorerVisible: false,
					isReviewingCards: true,
					isCardListViewVisible: false,
					isEditingCard: false,
					isDrillMode: false,
				});
				const deckName = target.dataset.deckName;
				this.dispatchEvent(
					new CustomEvent("deck-selected", {
						detail: { deckName },
						bubbles: true,
						composed: true,
					}),
				);
			} else if (target.classList.contains("import-btn")) {
				this.handleImport();
			} else if (target.classList.contains("export-btn")) {
				const deckName = target.closest("tr").querySelector("td").textContent;
				this.handleExport(deckName);
			} else if (target.classList.contains("review-btn")) {
				this.dispatchEvent(
					new CustomEvent("start-review", {
						bubbles: true,
						composed: true,
					}),
				);
			} else if (target.classList.contains("delete-deck-btn")) {
				const deckId = target.closest("tr")?.getAttribute("data-deck-id");
				if (deckId) {
					this.handleDeleteDeck(deckId);
				}
			}
		}

		async loadDecks() {
			try {
				const decks = await SRS.GetDecks();
				if (decks) {
					SRS.setDecks(decks);
				}
			} catch (error) {
				SRS.setDecks({});
			}
		}

		async handleAddDeck() {
			try {
				const deckName = await SRS.showPrompt(
					"Enter deck name:",
					"",
					"Create New Deck",
				);
				if (!deckName || deckName.trim() === "") return;

				const trimmedName = deckName.trim();
				const decks = SRS.getDecks();

				if (decks[trimmedName]) {
					await SRS.showAlert(
						"A deck with this name already exists.",
						"Deck Already Exists",
					);
					return;
				}

				this.setLoading(true);
				const newDeck = await SRS.NewDeck(trimmedName);
				if (newDeck) {
					await this.loadDecks();
					this.render();
					this.showToast("Deck created successfully", "success");
				}
			} catch (error) {
				if (error.message !== "Cancelled") {
					console.error("Error creating deck:", error);
					this.showToast("Error creating deck", "error");
				}
			} finally {
				this.setLoading(false);
			}
		}

		async handleDeleteDeck(deckId) {
			try {
				const confirmed = await SRS.showConfirm(
					`Are you sure you want to delete the deck "${deckId}"? This will also delete all cards in the deck.`,
					"Delete Deck",
				);

				if (!confirmed) return;

				this.setLoading(true);
				await SRS.DeleteDeck(deckId);
				await this.loadDecks();
				this.render();
				this.showToast("Deck deleted successfully", "success");
			} catch (error) {
				if (error.message !== "Cancelled") {
					console.error("Error deleting deck:", error);
					this.showToast("Error deleting deck", "error");
				}
			} finally {
				this.setLoading(false);
			}
		}

		async handleExport(deckName) {
			try {
				const csvData = await SRS.ExportDeckToCSV(deckName);

				if (!csvData || csvData.trim() === '') {
					// this.showToast(`Error exporting deck "${deckName}" - deck not found or export failed`, "error");
					return;
				}

				const blob = new Blob([csvData], { type: 'text/csv' });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${deckName}.csv`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);

				this.showToast(`Deck "${deckName}" exported successfully`, "success");
			} catch (error) {
				console.error("Error exporting deck:", error);
				this.showToast(`Error exporting deck "${deckName}"`, "error");
			}
		}

		async handleReviewSelectedDecks(deckIds) {
			try {
				this.setLoading(true);

				const config = await ConfigService.Load();
				console.log(config)
				const cardLimit = config.Config.numberOfCardsInReview || 20;
				const cards = await SRS.GetCards(deckIds, cardLimit);

				if (cards && cards.length > 0) {
					SRS.setReviewCards(cards);
					SRS.setViewState({
						isExplorerVisible: false,
						isReviewingCards: true,
						isCardListViewVisible: false,
						isEditingCard: false,
						isDrillMode: false,
					});

					this.dispatchEvent(
						new CustomEvent("review-selected-decks-complete", {
							bubbles: true,
							composed: true,
						}),
					);

					this.showToast(`Loaded ${cards.length} cards from selected decks`, "success");
				} else {
					this.showToast("No cards available for review in selected decks", "info");
				}
			} catch (error) {
				console.error("Error loading cards from selected decks:", error);
				this.showToast("Error loading cards from selected decks", "error");
			} finally {
				this.setLoading(false);
			}
		}

		async handleDeckSelect(deckName) {
			this.dispatchEvent(
				new CustomEvent("deck-selected", {
					detail: { deckName },
				}),
			);
		}

		async handleImportDeck() {
			try {
				const modal = document.createElement('div');
				modal.className = 'import-modal';
				modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 10000;
          display: flex;
          justify-content: center;
          align-items: center;
        `;

				modal.innerHTML = `
          <div class="import-modal-content" style="
            background: #2d3748;
            border-radius: 12px;
            padding: 2rem;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            border: 1px solid rgba(66, 153, 225, 0.3);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          ">
            <div class="import-modal-header" style="margin-bottom: 1.5rem;">
              <h3 style="margin: 0; color: #fff; font-size: 1.5rem; font-weight: 600;">Import Deck from CSV</h3>
            </div>
            <div class="import-modal-body">
              <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: #e2e8f0; font-weight: 500;">Deck Name:</label>
                <input type="text" id="deck-name-input" placeholder="Enter deck name..." style="
                  width: 100%;
                  padding: 0.75rem;
                  border: 1px solid rgba(66, 153, 225, 0.3);
                  border-radius: 6px;
                  background: rgba(45, 55, 72, 0.8);
                  color: #e2e8f0;
                  font-size: 1rem;
                ">
              </div>
              <div style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: #e2e8f0; font-weight: 500;">CSV Data:</label>
                <textarea id="csv-data-input" placeholder="Paste your CSV data here...&#10;Format: ID,Title,Content&#10;Example:&#10;card1,My First Card,This is the content of my first card&#10;card2,My Second Card,This is the content of my second card" style="
                  width: 100%;
                  min-height: 200px;
                  padding: 0.75rem;
                  border: 1px solid rgba(66, 153, 225, 0.3);
                  border-radius: 6px;
                  background: rgba(45, 55, 72, 0.8);
                  color: #e2e8f0;
                  font-size: 1rem;
                  font-family: monospace;
                  resize: vertical;
                "></textarea>
              </div>
            </div>
            <div class="import-modal-actions" style="
              display: flex;
              gap: 0.75rem;
              justify-content: flex-end;
            ">
              <button id="cancel-import" style="
                padding: 0.75rem 1.5rem;
                border: 1px solid rgba(160, 174, 192, 0.3);
                border-radius: 6px;
                background: rgba(160, 174, 192, 0.2);
                color: #e2e8f0;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 500;
              ">Cancel</button>
              <button id="confirm-import" style="
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 6px;
                background: linear-gradient(135deg, #48bb78, #38a169);
                color: white;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 500;
              ">Import Deck</button>
            </div>
          </div>
        `;

				document.body.appendChild(modal);

				const deckNameInput = modal.querySelector('#deck-name-input');
				const csvDataInput = modal.querySelector('#csv-data-input');
				const cancelBtn = modal.querySelector('#cancel-import');
				const confirmBtn = modal.querySelector('#confirm-import');

				deckNameInput.focus();

				const handleCancel = () => {
					document.body.removeChild(modal);
				};

				const handleConfirm = async () => {
					const deckName = deckNameInput.value.trim();
					const csvData = csvDataInput.value.trim();

					if (!deckName) {
						this.showToast('Please enter a deck name', 'error');
						return;
					}

					if (!csvData) {
						this.showToast('Please enter CSV data', 'error');
						return;
					}

					try {
						this.setLoading(true);
						await SRS.ImportDeckFromCSV(deckName, csvData);
						await this.loadDecks();
						this.render();
						this.showToast(`Deck "${deckName}" imported successfully`, 'success');
						document.body.removeChild(modal);
					} catch (error) {
						console.error('Error importing deck:', error);
						this.showToast(`Error importing deck: ${error.message}`, 'error');
					} finally {
						this.setLoading(false);
					}
				};

				cancelBtn.addEventListener('click', handleCancel);
				confirmBtn.addEventListener('click', handleConfirm);

				deckNameInput.addEventListener('keypress', (e) => {
					if (e.key === 'Enter') {
						csvDataInput.focus();
					}
				});

				csvDataInput.addEventListener('keypress', (e) => {
					if (e.key === 'Enter' && e.ctrlKey) {
						handleConfirm();
					}
				});

				const handleEscape = (e) => {
					if (e.key === 'Escape') {
						handleCancel();
					}
				};
				document.addEventListener('keydown', handleEscape);

				const cleanup = () => {
					document.removeEventListener('keydown', handleEscape);
				};

				const originalRemoveChild = document.body.removeChild.bind(document.body);
				document.body.removeChild = (element) => {
					if (element === modal) {
						cleanup();
					}
					return originalRemoveChild(element);
				};

			} catch (error) {
				console.error('Error showing import modal:', error);
				this.showToast('Error showing import modal', 'error');
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

		render() {
			this.innerHTML = `
<div class="deck-explorer ${this.loading ? "loading" : ""}">
    <div class="deck-explorer-header">
        <h2>Decks</h2>
        <div class="deck-explorer-actions">
            <button class="import-deck-btn"><i data-feather="upload"></i> Import Deck</button>
            <button class="add-deck-btn"><i data-feather="plus"></i> Add Deck</button>
        </div>
    </div>
    <div>
        <deck-table></deck-table>
    </div>
</div>
        `;

			const deckTable = this.querySelector("deck-table");
			if (deckTable) {
				const decksArr = Object.entries(SRS.getDecks()).map(([name, deck]) => ({
					id: name,
					name,
					cardCount: deck && deck.cards ? Object.keys(deck.cards).length : 0,
				}));
				deckTable.data = decksArr;
				deckTable.addEventListener("deck-selected", (e) => {
					this.handleDeckSelect(e.detail.deckId);
				});
				deckTable.addEventListener("deck-export", (e) => {
					this.handleExport(e.detail.deckId);
				});
				deckTable.addEventListener("deck-list-view", (e) => {
					this.dispatchEvent(
						new CustomEvent("deck-list-view", {
							detail: { deckId: e.detail.deckId },
							bubbles: true,
							composed: true,
						}),
					);
				});
				deckTable.addEventListener("deck-delete", (e) => {
					this.handleDeleteDeck(e.detail.deckId);
				});
				deckTable.addEventListener("review-selected-decks", async (e) => {
					await this.handleReviewSelectedDecks(e.detail.deckIds);
				});
			}

			this.querySelector(".add-deck-btn")?.addEventListener("click", this.handleAddDeck);
			this.querySelector(".import-deck-btn")?.addEventListener("click", this.handleImportDeck);

			const actions = this.querySelector("deck-explorer-actions");
			if (actions) {
				actions.addEventListener("import-requested", () => this.handleImport());
				actions.addEventListener("review-requested", () => {
					this.dispatchEvent(
						new CustomEvent("start-review", {
							bubbles: true,
							composed: true,
						}),
					);
				});
			}

			if (window.feather) window.feather.replace();
		}
	};
}
