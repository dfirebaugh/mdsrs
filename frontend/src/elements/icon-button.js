class IconButtonElement extends HTMLElement {
  constructor() {
    super();
  }

  static get observedAttributes() {
    return ["icon", "tooltip"];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const button = this.querySelector("button");
    if (button) {
      button.onclick = (event) => {
        event.preventDefault();
        this.dispatchEvent(
          new CustomEvent("icon-click", {
            bubbles: true,
            composed: true,
          }),
        );
      };
    }
  }

  render() {
    const icon = this.getAttribute("icon") || "";
    const tooltip = this.getAttribute("tooltip") || "";
    const iconSvg = window.feather.icons[icon].toSvg({ width: 24, height: 24 });

    this.innerHTML = `
            <button class="icon-button" title="${tooltip}">
                ${iconSvg}
            </button>
        `;
  }
}

customElements.define("icon-button", IconButtonElement);
