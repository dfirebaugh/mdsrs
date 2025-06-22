import * as App from '../../wailsjs/go/main/App.js';

/**
 * SRS service class for interacting with spaced repetition system backend.
 * Each static method corresponds to a Go backend function in App.go.
 */
export default class SRS {
	static _state = {
		currentDeck: null,
		reviewCards: [],
		decks: {},
		isExplorerVisible: false,
		isEditingConfig: false,
		isReviewingCards: true,
		isDrillMode: false,
		isAboutVisible: false,
		isCreatingDeck: false,
		isCardListViewVisible: false,
		isFutureReviewsVisible: false,
		isEditingCard: false,
		currentCardId: null,
		currentCardContent: "",
		currentCardTitle: "",
	};

	static getState() {
		return { ...this._state };
	}

	static setState(newState) {
		this._state = { ...this._state, ...newState };
	}

	static updateState(updates) {
		this._state = { ...this._state, ...updates };
	}

	static getCurrentDeck() {
		return this._state.currentDeck;
	}

	static setCurrentDeck(deckName) {
		this._state.currentDeck = deckName;
	}

	static getReviewCards() {
		return this._state.reviewCards;
	}

	static setReviewCards(cards) {
		this._state.reviewCards = cards;
	}

	static getDecks() {
		return this._state.decks;
	}

	static setDecks(decks) {
		this._state.decks = decks;
	}

	static getViewState() {
		return {
			isExplorerVisible: this._state.isExplorerVisible,
			isEditingConfig: this._state.isEditingConfig,
			isReviewingCards: this._state.isReviewingCards,
			isAboutVisible: this._state.isAboutVisible,
			isCreatingDeck: this._state.isCreatingDeck,
			isCardListViewVisible: this._state.isCardListViewVisible,
			isEditingCard: this._state.isEditingCard,
			isDrillMode: this._state.isDrillMode,
			isFutureReviewsVisible: this._state.isFutureReviewsVisible,
		};
	}

	static setViewState(viewState) {
		this._state = { ...this._state, ...viewState };
	}

	static getCardEditState() {
		return {
			currentCardId: this._state.currentCardId,
			currentCardContent: this._state.currentCardContent,
			currentCardTitle: this._state.currentCardTitle,
		};
	}

	static setCardEditState(cardState) {
		this._state = { ...this._state, ...cardState };
	}

	/**
	 * Add a new card or update an existing card in a deck.
	 * @param {string} deckID - The deck identifier.
	 * @param {string} cardID - The card identifier (empty for new cards).
	 * @param {string} title - The card title.
	 * @param {string} content - The card content.
	 * @returns {Promise<Object>} The added or updated card.
	 */
	static AddOrUpdateCard(arg1, arg2, arg3, arg4) {
		return App.AddOrUpdateCard(arg1, arg2, arg3, arg4);
	}

	/**
	 * Delete a card from a deck.
	 * @param {string} deckID - The deck identifier.
	 * @param {string} cardID - The card identifier.
	 * @returns {Promise<void>}
	 */
	static DeleteCardFromDeck(arg1, arg2) {
		return App.DeleteCardFromDeck(arg1, arg2);
	}

	/**
	 * Delete a deck and all its cards.
	 * @param {string} deckID - The deck identifier.
	 * @returns {Promise<void>}
	 */
	static DeleteDeck(arg1) {
		return App.DeleteDeck(arg1);
	}

	/**
	 * Export a deck to a CSV file.
	 * @param {string} deckID - The deck identifier.
	 * @returns {Promise<string>} The CSV data as a string, or empty string if error.
	 */
	static ExportDeckToCSV(arg1) {
		return App.ExportDeckToCSV(arg1);
	}

	/**
	 * Get the content of a specific card in a deck.
	 * @param {string} deckID - The deck identifier.
	 * @param {string} cardID - The card identifier.
	 * @returns {Promise<string>} The card content.
	 */
	static GetCardContent(arg1, arg2) {
		return App.GetCardContent(arg1, arg2);
	}

	/**
	 * Get all cards in a deck.
	 * @param {string} deckName - The deck name.
	 * @returns {Promise<Array>} Array of flashcards.
	 */
	static GetCardsFromDeck(arg1) {
		return App.GetCardsFromDeck(arg1);
	}

	/**
	 * Get a set of cards (limited by count) from multiple decks
	 */
	static GetCards(decknames, count) {
		return App.GetCards(decknames, count);
	}

	/**
	 * Get all decks.
	 * @returns {Promise<Object>} Map of deck names to deck objects.
	 */
	static GetDecks() {
		return App.GetDecks();
	}

	/**
	 * Get review cards across all decks.
	 * @returns {Promise<Array>} Array of flashcards for review.
	 */
	static GetReviewCards() {
		return App.GetReviewCards();
	}

	/**
	 * Get review cards for a specific deck.
	 * @param {string} deckName - The deck name.
	 * @returns {Promise<Array>} Array of flashcards for review.
	 */
	static GetReviewCardsForDeck(arg1) {
		return App.GetReviewCardsForDeck(arg1);
	}

	/**
	 * Import a deck from CSV data.
	 * @param {string} deckName - The name for the new deck.
	 * @param {string} csvData - The CSV data as a string.
	 * @returns {Promise<void>}
	 */
	static ImportDeckFromCSV(arg1, arg2) {
		return App.ImportDeckFromCSV(arg1, arg2);
	}

	/**
	 * Create a new deck.
	 * @param {string} name - The deck name.
	 * @returns {Promise<Object>} The new deck object.
	 */
	static NewDeck(arg1) {
		return App.NewDeck(arg1);
	}

	/**
	 * Convert markdown content to HTML.
	 * @param {string} content - The markdown content.
	 * @returns {Promise<string>} The HTML string.
	 */
	static ToHTML(arg1) {
		return App.ToHTML(arg1);
	}

	/**
	 * Update the configuration from a JSON string.
	 * @param {string} configJSON - The configuration as a JSON string.
	 * @returns {Promise<void>}
	 */
	static UpdateConfigFromJSON(arg1) {
		return App.UpdateConfigFromJSON(arg1);
	}

	/**
	 * Update SRS data for a card after a review.
	 * @param {string} deckID - The deck identifier.
	 * @param {string} cardID - The card identifier.
	 * @param {number} reviewConfidence - The review confidence score.
	 * @returns {Promise<void>}
	 */
	static UpdateSRSData(arg1, arg2, arg3) {
		return App.UpdateSRSData(arg1, arg2, arg3);
	}

	/**
	 * Get SRS data for a specific card.
	 * @param {string} cardID - The card identifier.
	 * @returns {Promise<Object>} The SRS data for the card.
	 */
	static GetCardSRSData(arg1) {
		return App.GetCardSRSData(arg1);
	}

	/**
	 * Escape HTML content for safe display.
	 * @param {string} text - The text to escape.
	 * @returns {Promise<string>} The escaped HTML string.
	 */
	static EscapeHtml(arg1) {
		return App.EscapeHtml(arg1);
	}

	/**
	 * Escape HTML attributes for safe use in HTML attributes.
	 * @param {string} text - The text to escape.
	 * @returns {Promise<string>} The escaped HTML string.
	 */
	static EscapeHtmlAttribute(arg1) {
		return App.EscapeHtmlAttribute(arg1);
	}

	/**
	 * Generate a unique identifier.
	 * @returns {Promise<string>} A unique ID string.
	 */
	static GenerateID() {
		return App.GenerateID();
	}

	/**
	 * Get all cards scheduled for future review.
	 * @returns {Promise<Array>} Array of flashcards with future review dates.
	 */
	static GetFutureReviewCards() {
		return App.GetFutureReviewCards();
	}

	// Modal service methods
	static async showModal(options) {
		const modal = document.querySelector("modal-element");
		if (modal) {
			return modal.show(options);
		}
		throw new Error("Modal element not found");
	}

	static async showAlert(message, title = "Alert") {
		return this.showModal({ type: "alert", message, title });
	}

	static async showConfirm(message, title = "Confirm") {
		return this.showModal({ type: "confirm", message, title });
	}

	static async showPrompt(message, defaultValue = "", title = "Input") {
		return this.showModal({ type: "prompt", message, defaultValue, title });
	}
}
