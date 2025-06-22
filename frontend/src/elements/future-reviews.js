export default function FutureReviews({ SRS }) {
	return class extends HTMLElement {
		constructor() {
			super();
			this.futureCards = [];
			this.loading = false;
		}

		async connectedCallback() {
			await this.loadFutureCards();
			this.render();
		}

		async loadFutureCards() {
			this.loading = true;
			try {
				const cards = await SRS.GetFutureReviewCards();
				console.log(cards)
				this.futureCards = cards || [];
			} catch (error) {
				console.error('Error loading future review cards:', error);
				this.futureCards = [];
			} finally {
				this.loading = false;
			}
		}

		formatDate(timestamp) {
			if (!timestamp) return 'Not scheduled';
			const date = new Date(timestamp * 1000);
			const now = new Date();
			const diffTime = date - now;
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			if (diffDays < 0) {
				return `${Math.abs(diffDays)} days overdue`;
			} else if (diffDays === 0) {
				return 'Today';
			} else if (diffDays === 1) {
				return 'Tomorrow';
			} else if (diffDays < 7) {
				return `In ${diffDays} days`;
			} else {
				return date.toLocaleDateString();
			}
		}

		render() {
			if (this.loading) {
				this.innerHTML = '<div class="loading">Loading future reviews...</div>';
				return;
			}

			if (!this.futureCards.length) {
				this.innerHTML = `
					<div class="future-reviews">
						<div class="header">
							<h2>Future Reviews</h2>
						</div>
						<div class="no-cards">
							<p>No cards scheduled for future review.</p>
							<p>All cards are either due for review now or have never been reviewed.</p>
						</div>
					</div>
				`;
				return;
			}

			// Sort cards by next review date
			const sortedCards = [...this.futureCards].sort((a, b) => {
				const aDate = a.next_review || 0;
				const bDate = b.next_review || 0;
				return aDate - bDate;
			});

			const tableRows = sortedCards.map(card => `
				<tr>
					<td>${card.title || 'Untitled'}</td>
					<td>${card.deckId || 'No Deck'}</td>
					<td>${this.formatDate(card.next_review)}</td>
					<td>${card.review_count || 0}</td>
					<td>${(card.ease_factor || 1.0).toFixed(2)}</td>
					<td>
						<button class="btn-small" onclick="this.closest('future-reviews').dispatchEvent(new CustomEvent('view-card', { detail: { cardId: '${card.id}', deckId: '${card.deck_id}' } }))">
							View
						</button>
					</td>
				</tr>
			`).join('');

			this.innerHTML = `
				<div class="future-reviews">
					<div class="header">
						<h2>Future Reviews</h2>
					</div>
					<div class="table-container">
						<table class="future-reviews-table">
							<thead>
								<tr>
									<th>Card Title</th>
									<th>Deck</th>
									<th>Next Review</th>
									<th>Review Count</th>
									<th>Ease Factor</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								${tableRows}
							</tbody>
						</table>
					</div>
					<div class="summary">
						<p>Total cards scheduled: ${this.futureCards.length}</p>
					</div>
				</div>
			`;

			this.querySelector('.future-reviews').addEventListener('refresh', async () => {
				await this.loadFutureCards();
				this.render();
			});

			this.querySelector('.future-reviews').addEventListener('view-card', (e) => {
				const { cardId, deckId } = e.detail;
				window.dispatchEvent(new CustomEvent('view-specific-card', {
					detail: { cardId, deckId }
				}));
			});
		}
	};
} 
