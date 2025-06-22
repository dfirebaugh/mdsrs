class MainLayoutElement extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const currentContent = this.innerHTML;

    this.innerHTML = `
	<div class="app-container">
		<div class="sidebar">
			${currentContent}
		</div>
		<div class="main-content">
			<div id="main-content"></div>
		</div>
	</div>
			`;
  }
}

customElements.define("main-layout", MainLayoutElement);
