import { ImportDeck, ExportDeck } from "../../wailsjs/go/main/CSVService.js";

export default class CSVService {
	/**
	 * Import a deck from CSV data.
	 * @param {string} deckName - The name for the new deck.
	 * @param {string} csvData - The CSV data as a string.
	 * @returns {Promise<void>}
	 */
	static Import(deckName, csvData) {
		return ImportDeck(deckName, csvData)
	}

	/**
	 * Export a deck to a CSV file.
	 * @param {string} deckName - The deck identifier.
	 * @returns {Promise<string>} The CSV data as a string, or empty string if error.
	 */
	static Export(deckName) {
		return ExportDeck(deckName)
	}
}
