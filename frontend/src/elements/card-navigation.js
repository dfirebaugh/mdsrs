export default function CardNavigation({ SRS }) {
	return class extends HTMLElement {
		constructor() {
			super();
			this.handleFlip = this.handleFlip.bind(this);
			this.handleRate = this.handleRate.bind(this);
			this.handleEdit = this.handleEdit.bind(this);
			this.handleNext = this.handleNext.bind(this);
		}

		static get observedAttributes() {
			return ["current-index", "total-cards"];
		}

		attributeChangedCallback() {
			this.render();
		}

		connectedCallback() {
			this.render();
		}

		updateDisplay() {
			this.render();
		}

		handleFlip() {
			this.dispatchEvent(
				new CustomEvent("flip", { bubbles: true, composed: true }),
			);
		}

		handleRate(e) {
			const rating = e.target.getAttribute("data-rating");
			this.dispatchEvent(
				new CustomEvent("rate-card", {
					detail: { rating },
					bubbles: true,
					composed: true,
				}),
			);
		}

		handleNext() {
			this.dispatchEvent(
				new CustomEvent("next-card", { bubbles: true, composed: true }),
			);
		}

		handleEdit() {
			this.dispatchEvent(
				new CustomEvent("edit-card", { bubbles: true, composed: true }),
			);
		}

		render() {
			const current = Number(this.getAttribute("current-index")) + 1;
			const total = this.getAttribute("total-cards");
			const { isDrillMode } = SRS.getViewState();

			if (isDrillMode) {
				this.innerHTML = `
        <div class="nav-bar">
          <button id="next" class="next-btn">Next</button>
          <span class="right-group">
            <button id="edit">Edit</button>
            <button id="flip">Flip</button>
            <span class="progress">${current} / ${total}</span>
          </span>
        </div>
      `;
			} else {
				this.innerHTML = `
        <div class="nav-bar">
          <button data-rating="hard">Hard</button>
          <button data-rating="iffy">Iffy</button>
          <button data-rating="easy">Easy</button>
          <span class="right-group">
            <button id="edit">Edit</button>
            <button id="flip">Flip</button>
            <span class="progress">${current} / ${total}</span>
          </span>
        </div>
      `;
			}

			this.querySelector("#flip").onclick = this.handleFlip;
			this.querySelector("#edit").onclick = this.handleEdit;

			if (isDrillMode) {
				this.querySelector("#next").onclick = this.handleNext;
			} else {
				this.querySelectorAll("button[data-rating]").forEach((btn) => {
					btn.onclick = this.handleRate;
				});
			}
		}
	}
}

