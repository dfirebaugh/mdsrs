export default function ConfigEditor({ ConfigService }) {
	return class extends HTMLElement {
		async connectedCallback() {
			this.hasUnsavedChanges = false;
			this.render();
		}


		async saveConfig() {
			if (!this.hasUnsavedChanges) {
				return [null];
			}

			const configJson = JSON.stringify(this.currentConfig, null, 2);
			await ConfigService.Save(configJson);

			this.hasUnsavedChanges = false;
			this.showToast("Configuration saved successfully", "success");
			return [null];
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
			const config = await ConfigService.Load()
			const configJson = JSON.stringify(config.Config, null, 2)
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&apos;");

			this.innerHTML = `
            <style>
                .config-editor {
                    height: 100%;
                    background: rgba(35, 46, 64, 0.8);
                }

				.editor-container {
                    margin-bottom: 1.5rem;
                    height: 100%;
                }

                .unsaved-changes {
                    color: #ecc94b;
                    margin-right: auto;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
				.save-btn {
					position: fixed;
					bottom: 2rem;
					right: 2rem;
					z-index: 1000;
					background: #3182ce;
					color: #fff;
					border: none;
					padding: 0.75rem 2rem;
					box-shadow: 0 4px 16px rgba(0,0,0,0.18);
					font-size: 1.1rem;
					cursor: pointer;
					transition: background 0.2s;
				}
				.floating-save-btn:disabled {
					background: #718096;
					cursor: not-allowed;
				}
            </style>
            <div class="config-editor">
                <div class="editor-container">
                    <code-editor 
                        value="${configJson}"
                        language="json"
                        theme="dark">
                    </code-editor>
                </div>
				<div style="display: flex; align-items: center; gap: 1rem;">
					${this.hasUnsavedChanges ? `<span class="unsaved-changes">Unsaved changes</span>` : ""}
				</div>
				<button class="save-btn" ${!this.hasUnsavedChanges ? "disabled" : ""}>Save</button>
            </div>
        `;

			const codeEditor = this.querySelector("code-editor");
			const saveBtn = this.querySelector(".save-btn");
			if (codeEditor) {
				codeEditor.addEventListener("change", (e) => {
					try {
						this.hasUnsavedChanges = true;
						this.currentConfig = JSON.parse(e.detail.value);
						if (saveBtn) saveBtn.disabled = !this.hasUnsavedChanges;
						const unsaved = this.querySelector(".unsaved-changes");
						if (unsaved) unsaved.style.display = "flex";
					} catch (error) {
						console.error("Invalid JSON:", error);
					}
				});
			}

			if (saveBtn) {
				saveBtn.addEventListener("click", async () => {
					const [err] = await this.saveConfig();
					if (err) {
						console.error(err)
					}
					this.hasUnsavedChanges = false;
					if (saveBtn) saveBtn.disabled = true;
				});
			}
		}
	};
}
