class DeckTableElement extends HTMLElement {
	constructor() {
		super();
		this.decks = [];
		this.selectedDecks = new Set();
	}

	set data(decks) {
		this.decks = decks || [];
		this.render();
	}

	connectedCallback() {
		this.render();
		this.addEventListener("click", this.onClick.bind(this));
		this.addEventListener("change", this.onChange.bind(this));
	}

	onChange(event) {
		if (event.target.type === "checkbox") {
			const deckId = event.target.value;
			if (event.target.checked) {
				this.selectedDecks.add(deckId);
			} else {
				this.selectedDecks.delete(deckId);
			}
			this.updateReviewButton();
		}
	}

	updateReviewButton() {
		const reviewBtn = this.querySelector(".review-selected-btn");
		if (reviewBtn) {
			reviewBtn.disabled = this.selectedDecks.size === 0;
		}
	}

	onClick(event) {
		const button = event.target.closest("button[data-action]");
		if (!button) return;

		const action = button.getAttribute("data-action");

		if (action === "review-selected") {
			this.dispatchEvent(
				new CustomEvent("review-selected-decks", {
					detail: { deckIds: Array.from(this.selectedDecks) },
					bubbles: true,
				}),
			);
			return;
		}

		const row = button.closest("[data-deck-id]");
		if (!row) return;

		const deckId = row.getAttribute("data-deck-id");

		if (action === "open") {
			this.dispatchEvent(
				new CustomEvent("deck-selected", {
					detail: { deckId },
					bubbles: true,
				}),
			);
		} else if (action === "export") {
			this.dispatchEvent(
				new CustomEvent("deck-export", {
					detail: { deckId },
					bubbles: true,
				}),
			);
		} else if (action === "list-view") {
			this.dispatchEvent(
				new CustomEvent("deck-list-view", {
					detail: { deckId },
					bubbles: true,
				}),
			);
		} else if (action === "delete") {
			this.dispatchEvent(
				new CustomEvent("deck-delete", {
					detail: { deckId },
					bubbles: true,
				}),
			);
		}
	}

	render() {
		if (this.decks.length === 0) {
			this.innerHTML = `
				<div class="deck-table-empty">
					<p>No decks available. Import a deck to get started.</p>
				</div>
			`;
			return;
		}

		this.innerHTML = `
            <div class="deck-table-container">
                <div class="deck-table-actions">
                    <button data-action="review-selected" class="review-selected-btn" disabled>
                        Review Selected Decks
                    </button>
                </div>
                <table class="deck-table">
                    <thead>
                        <tr>
                            <th style="width: 40px;">
                                <input type="checkbox" id="select-all" title="Select All">
                            </th>
                            <th>Name</th>
                            <th>Cards</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.decks
				.map(
					(deck) => `
                            <tr data-deck-id="${deck.id}">
                                <td>
                                    <input type="checkbox" value="${deck.id}" ${this.selectedDecks.has(deck.id) ? 'checked' : ''}>
                                </td>
                                <td>${deck.name}</td>
                                <td>${deck.cardCount}</td>
                                <td style="display: flex; justify-content: center; gap: 0.5rem;">
                                <button data-action="delete" class="action-btn delete-btn delete-deck-btn" title="Delete Deck"><i data-feather="trash"></i></button>
                                <button data-action="list-view" class="action-btn list-view-btn" title="List View"><i data-feather="list"></i></button>
                                <button data-action="export" class="action-btn export-btn" title="Export Deck"><i data-feather="download"></i></button>
                                <button data-action="open" class="action-btn open-btn" title="Drill Deck"><i data-feather="book-open"></i></button>
                                </td>
                            </tr>
                        `,
				)
				.join("")}
                    </tbody>
                </table>
            </div>
        `;

		const selectAllCheckbox = this.querySelector("#select-all");
		if (selectAllCheckbox) {
			selectAllCheckbox.addEventListener("change", (e) => {
				const checkboxes = this.querySelectorAll("tbody input[type='checkbox']");
				checkboxes.forEach(checkbox => {
					checkbox.checked = e.target.checked;
					if (e.target.checked) {
						this.selectedDecks.add(checkbox.value);
					} else {
						this.selectedDecks.delete(checkbox.value);
					}
				});
				this.updateReviewButton();
			});
		}

		this.updateReviewButton();
		if (window.feather) window.feather.replace();
	}
}
customElements.define("deck-table", DeckTableElement);
