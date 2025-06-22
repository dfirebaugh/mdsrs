export default function ModalElement({ SRS }) {
  return class extends HTMLElement {
    constructor() {
      super();
      this.isOpen = false;
      this.resolvePromise = null;
      this.rejectPromise = null;
      this.cleanup = null;
    }

    async escapeHtml(text) {
      if (!text) return "";
      return await SRS.EscapeHtml(text);
    }

    connectedCallback() {
      this.style.display = "none";
      this.style.position = "fixed";
      this.style.top = "0";
      this.style.left = "0";
      this.style.width = "100%";
      this.style.height = "100%";
      this.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      this.style.zIndex = "10000";
      this.style.justifyContent = "center";
      this.style.alignItems = "center";
    }

    async show(options = {}) {
      const {
        title = "Modal",
        message = "",
        type = "info",
        defaultValue = "",
        confirmText = "OK",
        cancelText = "Cancel",
      } = options;

      this.isOpen = true;
      this.style.display = "flex";

      let inputField = "";
      if (type === "prompt") {
        const escapedDefaultValue = await this.escapeHtml(defaultValue);
        inputField = `<input type="text" class="modal-input" value="${escapedDefaultValue}" placeholder="Enter value...">`;
      }

      const showCancel = type === "confirm" || type === "prompt";
      const escapedCancelText = await this.escapeHtml(cancelText);
      const cancelButton = showCancel
        ? `<button class="modal-btn modal-cancel-btn">${escapedCancelText}</button>`
        : "";

      const escapedTitle = await this.escapeHtml(title);
      const escapedMessage = await this.escapeHtml(message);
      const escapedConfirmText = await this.escapeHtml(confirmText);

      this.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">${escapedTitle}</h3>
          </div>
          <div class="modal-message">${escapedMessage}</div>
          ${inputField}
          <div class="modal-actions">
            ${cancelButton}
            <button class="modal-btn modal-confirm-btn">${escapedConfirmText}</button>
          </div>
        </div>
      `;

      const confirmBtn = this.querySelector(".modal-confirm-btn");
      const cancelBtn = this.querySelector(".modal-cancel-btn");
      const input = this.querySelector(".modal-input");

      confirmBtn.addEventListener("click", () => {
        let result = true;
        if (type === "prompt") {
          result = input.value;
        }
        this.hide();
        if (this.resolvePromise) {
          this.resolvePromise(result);
        }
      });

      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          this.hide();
          if (this.rejectPromise) {
            this.rejectPromise(new Error("Cancelled"));
          }
        });
      }

      if (input) {
        input.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            confirmBtn.click();
          }
        });
        input.focus();
        input.select();
      }

      const handleEscape = (e) => {
        if (e.key === "Escape") {
          if (cancelBtn) {
            cancelBtn.click();
          } else {
            confirmBtn.click();
          }
        }
      };
      document.addEventListener("keydown", handleEscape);

      this.cleanup = () => {
        document.removeEventListener("keydown", handleEscape);
      };

      return new Promise((resolve, reject) => {
        this.resolvePromise = resolve;
        this.rejectPromise = reject;
      });
    }

    hide() {
      this.isOpen = false;
      this.style.display = "none";
      if (this.cleanup) {
        this.cleanup();
      }
    }

    async alert(message, title = "Alert") {
      return this.show({ type: "alert", message, title });
    }

    async confirm(message, title = "Confirm") {
      return this.show({ type: "confirm", message, title });
    }

    async prompt(message, defaultValue = "", title = "Input") {
      return this.show({ type: "prompt", message, defaultValue, title });
    }
  };
}

