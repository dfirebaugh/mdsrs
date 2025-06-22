class DeckExplorerActionsElement extends HTMLElement {
  connectedCallback() {
    this.render();
    this.addEventListener("click", this.onClick.bind(this));
  }

  onClick(event) {
    if (event.target.matches('[data-action="import"]')) {
      this.dispatchEvent(
        new CustomEvent("import-requested", { bubbles: true }),
      );
    }
    if (event.target.matches('[data-action="review"]')) {
      this.dispatchEvent(
        new CustomEvent("review-requested", { bubbles: true }),
      );
    }
  }

  render() {
    this.innerHTML = `
            <div class="deck-explorer-actions">
                <button data-action="import">Import Deck</button>
                <button data-action="review">Review Cards</button>
            </div>
        `;
  }
}
customElements.define("deck-explorer-actions", DeckExplorerActionsElement);
