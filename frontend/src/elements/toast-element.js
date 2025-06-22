class ToastElement extends HTMLElement {
  constructor() {
    super();
    this.timeout = null;
  }

  show(message, type = "info") {
    this.innerHTML = `
            <style>
                .toast {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    transform: translateX(-100%);
                    opacity: 0;
                    transition: all 0.3s ease;
                    z-index: 1000;
                    max-width: 300px;
                    word-wrap: break-word;
                }

                .toast.show {
                    transform: translateX(0);
                    opacity: 1;
                }

                .toast.success {
                    background: #48bb78;
                }

                .toast.error {
                    background: #f56565;
                }

                .toast.info {
                    background: #4299e1;
                }
            </style>
            <div class="toast ${type}">
                ${message}
            </div>
        `;

    const toast = this.querySelector(".toast");
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        this.innerHTML = "";
      }, 300);
    }, 3000);
  }
}

customElements.define("toast-element", ToastElement);
