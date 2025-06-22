import "../styles/markdown.css";
import "../styles/card-editor.css";

export default function CardEditor({ SRS }) {
  return class CardEditorElement extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.handleSave = this.handleSave.bind(this);
      this.handleCancel = this.handleCancel.bind(this);
      this._card = null;
      this._editedContent = undefined;
    }

    connectedCallback() {
      this.render();
    }

    set card(card) {
      this._card = card;
      this.render();
    }

    get card() {
      return this._card;
    }

    handleSave() {
      if (this._editedContent !== undefined) {
        const parts = this._editedContent.split("<card-back>");
        const front = parts[0]?.trim() || "";
        const back = parts[1]?.trim() || "";
        this.dispatchEvent(new CustomEvent("save", {
          detail: { front, back, content: this._editedContent },
          bubbles: true,
          composed: true
        }));
      }
    }

    handleCancel() {
      this.dispatchEvent(new CustomEvent("cancel", { bubbles: true, composed: true }));
    }

    async render() {
      const content = this._card?.content || "";
      let escapedContent = content;
      if (SRS && SRS.EscapeHtmlAttribute) {
        try {
          escapedContent = await SRS.EscapeHtmlAttribute(content);
        } catch {
          escapedContent = content.replace(/"/g, "&quot;");
        }
      } else {
        escapedContent = content.replace(/"/g, "&quot;");
      }

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            height: 100%;
            width: 100%;
            overflow: hidden;
          }
          
          /* Card Editor Styles */
          .card-editor {
            height: 100%;
            width: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            position: relative;
            background: var(--background, #181818);
            overflow: hidden;
          }

          code-editor {
            flex: 1 1 auto;
            min-height: 0;
            min-width: 0;
            overflow: hidden;
          }

          .editor-actions.floating {
            position: absolute;
            top: 16px;
            right: 16px;
            z-index: 10;
            background: rgba(30,30,30,0.95);
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            padding: 8px 16px;
            display: flex;
            gap: 8px;
          }

          .editor-actions button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
            white-space: nowrap;
          }

          .editor-actions button:first-child {
            background: #007acc;
            color: white;
          }

          .editor-actions button:first-child:hover {
            background: #005a9e;
          }

          .editor-actions button:last-child {
            background: #333;
            color: white;
          }

          .editor-actions button:last-child:hover {
            background: #555;
          }

          @media (max-width: 640px) {
            .editor-actions.floating {
              position: fixed;
              bottom: 16px;
              right: 16px;
              top: auto;
            }
          }
        </style>
        <div class="card-editor">
          <code-editor 
            value="${escapedContent}"
            language="markdown"
            theme="dark">
          </code-editor>
          <div class="editor-actions floating">
            <button id="save-edit">Save</button>
            <button id="cancel-edit">Cancel</button>
          </div>
        </div>
      `;

      const editor = this.shadowRoot.querySelector("code-editor");
      editor?.addEventListener("change", (e) => {
        this._editedContent = e.detail.value;
      });

      this.shadowRoot.querySelector("#save-edit")?.addEventListener("click", this.handleSave);
      this.shadowRoot.querySelector("#cancel-edit")?.addEventListener("click", this.handleCancel);
    }
  };
}

