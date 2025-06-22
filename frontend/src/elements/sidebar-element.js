class SidebarElement extends HTMLElement {
  connectedCallback() {
    this.render();
  }
  render() {
    const app = document.querySelector("app-element");
    const items = app ? app.getSidebarItems() : [];
    this.innerHTML = `
			<div class="sidebar-grid">
				<div class="sidebar-top">
					${items
            .filter((item) => !item.bottom)
            .map(
              (item) => `
		<icon-button
			icon="${item.icon}"
			tooltip="${item.tooltip}"
			data-action="${item.action}">
		</icon-button>
		`,
            )
            .join("")}
		</div>
		<div class="sidebar-spacer"></div>
		<div class="sidebar-bottom">
			${items
				.filter((item) => item.bottom)
				.map((item) => `
					<icon-button
						icon="${item.icon}"
						tooltip="${item.tooltip}"
						data-action="${item.action}">
					</icon-button>
					`)
				.join("")}
			</div>
		</div>
		`;
    this.querySelectorAll("icon-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        const action = e.currentTarget.dataset.action;
        this.dispatchEvent(
          new CustomEvent("sidebar-action", {
            bubbles: true,
            detail: { action },
          }),
        );
      });
    });
  }
}
customElements.define("sidebar-element", SidebarElement);
