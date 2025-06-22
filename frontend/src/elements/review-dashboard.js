class ReviewDashboardElement extends HTMLElement {
  constructor() {
    super();
    this.reviewStats = {
      hardCount: 0,
      iffyCount: 0,
      easyCount: 0,
    };
  }

  static get observedAttributes() {
    return ["stats"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "stats") {
      this.reviewStats = JSON.parse(newValue);
      this.render();
    }
  }

  connectedCallback() {
    this.render();
    const actionButton = this.querySelector("#startNewReview");

    if (!actionButton) return;

    actionButton.addEventListener("click", () => this.startNewReview());
  }

  startNewReview() {
    this.dispatchEvent(
      new CustomEvent("start-review", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    const totalReviews =
      this.reviewStats.hardCount +
      this.reviewStats.iffyCount +
      this.reviewStats.easyCount;
    const hardPercentage =
      totalReviews > 0
        ? Math.round((this.reviewStats.hardCount / totalReviews) * 100)
        : 0;
    const iffyPercentage =
      totalReviews > 0
        ? Math.round((this.reviewStats.iffyCount / totalReviews) * 100)
        : 0;
    const easyPercentage =
      totalReviews > 0
        ? Math.round((this.reviewStats.easyCount / totalReviews) * 100)
        : 0;

    this.innerHTML = `
            <div class="review-dashboard">
                <h2>Review Summary</h2>
                <div class="stats-grid">
                    <div class="stat-card hard">
                        <div class="stat-label">Hard</div>
                        <div class="stat-value">${this.reviewStats.hardCount}</div>
                        <div class="stat-percentage">${hardPercentage}%</div>
                    </div>
                    <div class="stat-card iffy">
                        <div class="stat-label">Iffy</div>
                        <div class="stat-value">${this.reviewStats.iffyCount}</div>
                        <div class="stat-percentage">${iffyPercentage}%</div>
                    </div>
                    <div class="stat-card easy">
                        <div class="stat-label">Easy</div>
                        <div class="stat-value">${this.reviewStats.easyCount}</div>
                        <div class="stat-percentage">${easyPercentage}%</div>
                    </div>
                </div>
                <!-- <div class="actions"> -->
                <!--     <button class="action-button" id="startNewReview">Start New Review</button> -->
                <!-- </div> -->
            </div>
        `;
  }
}

customElements.define("review-dashboard", ReviewDashboardElement);
