import { marked } from "marked";
import "../styles/markdown.css";

export default function CardViewer({ SRS, ConfigService }) {
	return class extends HTMLElement {
		constructor() {
			super();
			this._cards = [];
			this.currentCardIndex = 0;
			this.isFlipped = false;
			this.isEditing = false;
			this.isShowingSRS = false;
			this.vimMode = false;
			this.reviewStats = {
				totalCards: 0,
				hardCount: 0,
				iffyCount: 0,
				easyCount: 0,
			};
			this.handleKeyPress = this.handleKeyPress.bind(this);

			marked.setOptions({
				gfm: true,
				breaks: true,
				headerIds: true,
				mangle: false,
				sanitize: false,
			});
		}

		async escapeHtmlAttribute(text) {
			if (!text) return "";
			return await SRS.EscapeHtmlAttribute(text);
		}

		get cards() {
			return this._cards;
		}

		set cards(value) {
			this._cards = value || [];
			this.currentCardIndex = 0;
			this.reviewStats = {
				totalCards: (value || []).length,
				hardCount: 0,
				iffyCount: 0,
				easyCount: 0,
			};
			this.render().catch(console.error);
		}

		async connectedCallback() {
			await this.loadConfig();
			await this.render();
			document.addEventListener("keydown", this.handleKeyPress);
		}

		async getCardContent(content) {
			const html = await SRS.ToHTML(content);
			const htmlContent = marked(html);
			return [htmlContent, null];
		}

		async loadConfig() {
			const result = await ConfigService.Load();
			if (!result.error && result.Config) {
				this.vimMode = result.Config.vimMode ?? false;
			}
		}

		disconnectedCallback() {
			document.removeEventListener("keydown", this.handleKeyPress);
		}

		handleKeyPress(event) {
			const active = document.activeElement;
			if (
				active &&
				(active.tagName === "INPUT" ||
					active.tagName === "TEXTAREA" ||
					active.closest("code-editor") ||
					active.closest("card-editor"))
			) {
				return;
			}

			if (this.isEditing) {
				return;
			}

			if (this.isShowingSRS) {
				if (event.key === 's' || event.key === 'S') {
					event.preventDefault();
					this.isShowingSRS = false;
					this.render().catch(console.error);
				}
				return;
			}

			if (!this.cards || !this.cards.length) return;

			const { isDrillMode } = SRS.getViewState();

			switch (event.key) {
				case " ":
					event.preventDefault();
					this.flipCard();
					break;
				case "1":
					if (!isDrillMode) this.rateCard(1);
					break;
				case "2":
					if (!isDrillMode) this.rateCard(2);
					break;
				case "3":
					if (!isDrillMode) this.rateCard(3);
					break;
				case "s":
				case "S":
					event.preventDefault();
					this.showSRSInfo();
					break;
				case "ArrowRight":
					if (isDrillMode) {
						event.preventDefault();
						this.nextCard();
					}
					break;
			}
		}

		flipCard() {
			this.isFlipped = !this.isFlipped;
			this.render().catch(console.error);
		}

		async rateCard(confidence) {
			const currentCard = this.cards[this.currentCardIndex];
			if (currentCard) {
				const error = await this.updateSRSData(
					currentCard.deckID,
					currentCard.id,
					confidence,
				);
				if (error) {
					console.error("Error updating SRS data:", error);
					this.showToast("Error updating card rating", "error");
					return;
				}

				switch (confidence) {
					case 1:
						this.reviewStats.hardCount++;
						break;
					case 2:
						this.reviewStats.iffyCount++;
						break;
					case 3:
						this.reviewStats.easyCount++;
						break;
				}

				this.currentCardIndex++;
				this.isFlipped = false;

				if (this.currentCardIndex >= this.cards.length) {
					this.showReviewDashboard();
				} else {
					await this.render();
				}
			}
		}

		nextCard() {
			this.currentCardIndex++;
			this.isFlipped = false;

			if (this.currentCardIndex >= this.cards.length) {
				const { isDrillMode } = SRS.getViewState();

				if (isDrillMode) {
					window.dispatchEvent(new CustomEvent("cards-reviewed"));
					this.showDrillCompleted();
					return;
				} else {
					this.showReviewDashboard();
					return;
				}
			} else {
				this.render().catch(console.error);
			}
		}

		async updateSRSData(deckID, cardID, confidence) {
			const { isDrillMode } = SRS.getViewState();
			if (isDrillMode) return null;

			await SRS.UpdateSRSData(deckID, cardID, confidence);
			return null;
		}

		showDrillCompleted() {
			this.innerHTML = `<div>drill completed</div>`;
		}

		showReviewDashboard() {
			this.innerHTML = `<review-dashboard stats='${JSON.stringify(this.reviewStats)}'></review-dashboard>`;

			this.querySelector("review-dashboard")?.addEventListener(
				"start-new-review",
				() => {
					window.dispatchEvent(new CustomEvent("cards-reviewed"));
				},
			);
		}

		async showSRSInfo() {
			const currentCard = this.cards[this.currentCardIndex];
			if (!currentCard) return;

			this.isShowingSRS = true;

			try {
				const srsData = await SRS.GetCardSRSData(currentCard.id);

				const lastReview = srsData.last_review ? new Date(srsData.last_review * 1000).toLocaleString() : 'Never';
				const nextReview = srsData.next_review ? new Date(srsData.next_review * 1000).toLocaleString() : 'Not scheduled';
				const reviewCount = srsData.review_count || 0;
				const easeFactor = srsData.ease_factor || 1.0;

				this.innerHTML = `
					<div class="srs-info">
						<div class="srs-header">
							<h2>SRS Information</h2>
							<button class="close-btn" onclick="this.closest('.srs-info').dispatchEvent(new CustomEvent('close-srs'))">×</button>
						</div>
						<div class="srs-content">
							<div class="card-title">${currentCard.title || 'Untitled Card'}</div>
							<div class="srs-stats">
								<div class="stat-item">
									<label>Review Count:</label>
									<span>${reviewCount}</span>
								</div>
								<div class="stat-item">
									<label>Ease Factor:</label>
									<span>${easeFactor.toFixed(2)}</span>
								</div>
								<div class="stat-item">
									<label>Last Review:</label>
									<span>${lastReview}</span>
								</div>
								<div class="stat-item">
									<label>Next Review:</label>
									<span>${nextReview}</span>
								</div>
							</div>
							<div class="srs-actions">
								<button class="btn btn-primary" onclick="this.closest('.srs-info').dispatchEvent(new CustomEvent('back-to-card'))">
									Back to Card
								</button>
							</div>
						</div>
					</div>
				`;

				this.querySelector('.srs-info').addEventListener('close-srs', () => {
					this.isShowingSRS = false;
					this.render().catch(console.error);
				});

				this.querySelector('.srs-info').addEventListener('back-to-card', () => {
					this.isShowingSRS = false;
					this.render().catch(console.error);
				});

			} catch (error) {
				console.error('Error loading SRS data:', error);
				this.showToast('Error loading SRS data', 'error');
				this.isShowingSRS = false;
				this.render().catch(console.error);
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

		async render() {
			this.innerHTML = '<div class="loading">Loading...</div>';
			if (!this.cards || !this.cards.length) {
				this.innerHTML = '<div class="no-cards">No cards to review</div>';
				return;
			}

			if (this.isShowingSRS) {
				return;
			}

			const currentCard = this.cards[this.currentCardIndex];
			const [freshCard, cardError] = await this.getFreshCard(
				currentCard.deckId,
				currentCard.id,
			);
			if (cardError) {
				console.error("Error getting card from backend:", cardError);
				this.innerHTML = '<div class="error">Error loading card</div>';
				return;
			}

			const [content, contentError] = await this.getCardContent(
				freshCard.content || "",
			);
			if (contentError) {
				console.error("Error getting card content:", contentError);
				this.innerHTML = '<div class="error">Error loading card content</div>';
				return;
			}

			const parts = content.split("<card-back>");
			const front = parts[0]?.trim() || "";
			const back = parts[1]?.trim() || "";

			if (this.isEditing) {
				this.innerHTML = `<card-editor></card-editor>`;

				const editor = this.querySelector("card-editor");
				if (editor) {
					editor.card = freshCard;

					editor.addEventListener("save", async (e) => {
						const currentCard = this.cards[this.currentCardIndex];
						const result = await SRS.AddOrUpdateCard(
							currentCard.deckId,
							currentCard.id,
							currentCard.title || "",
							e.detail.content,
						);
						if (!result || result.error) {
							this.showToast("Error saving card content", "error");
						} else {
							this.isEditing = false;
							this.showToast("Card saved successfully", "success");
							await this.render();
						}
					});

					editor.addEventListener("cancel", () => {
						this.isEditing = false;
						this.render().catch(console.error);
					});
				}
				return;
			} else {
				this.innerHTML = `
		<div class="card-viewer">
			<div class="card-container">
				<div class="card">
					<div class="card-front markdown-body${!this.isFlipped ? " active" : ""}">
						${front}
					</div>
					<div class="card-back markdown-body${this.isFlipped ? " active" : ""}">
						${back}
					</div>
				</div>
			</div>
			<div class="card-footer">
				<card-navigation 
					current-index="${this.currentCardIndex}"
					total-cards="${this.cards.length}">
				</card-navigation>
			</div>
		</div>
		`;
			}

			const nav = this.querySelector("card-navigation");
			if (nav) {
				nav.addEventListener("flip", () => this.flipCard());
				nav.addEventListener("edit-card", () => {
					this.isEditing = true;
					this.render().catch(console.error);
				});
				nav.addEventListener("rate-card", (e) => {
					const rating = e.detail.rating;
					if (rating === "hard") this.rateCard(1);
					else if (rating === "iffy") this.rateCard(2);
					else if (rating === "easy") this.rateCard(3);
				});
				nav.addEventListener("next-card", () => {
					this.nextCard();
				});

				if (nav.updateDisplay) {
					nav.updateDisplay();
				}
			}
		}

		async getFreshCard(deckID, cardID) {
			try {
				const deck = await SRS.GetCardsFromDeck(deckID);
				if (!deck || !Array.isArray(deck))
					return [null, new Error("Deck not found")];
				const card = deck.find((c) => c.id === cardID);
				if (!card) return [null, new Error("Card not found")];
				return [card, null];
			} catch (err) {
				return [null, err];
			}
		}
	};
}
