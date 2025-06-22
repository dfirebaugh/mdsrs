import { EditorState } from "@codemirror/state";
import {
	EditorView,
	keymap,
	lineNumbers,
	highlightSpecialChars,
	drawSelection,
	highlightActiveLine,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { vim } from "@replit/codemirror-vim";
import {
	bracketMatching,
	foldGutter,
	indentOnInput,
} from "@codemirror/language";

export default function CodeEditor({ SRS, ConfigService }) {
	return class extends HTMLElement {
		static get observedAttributes() {
			return [
				"value",
				"theme",
				"language",
			];
		}

		attributeChangedCallback(name, oldValue, newValue) {
			if (name === "value" && this.editor) {
				this.editor.dispatch({
					changes: {
						from: 0,
						to: this.editor.state.doc.length,
						insert: newValue,
					},
				});
			} else if (
				[
					"theme",
					"language",
				].includes(name)
			) {
				if (name === "theme") {
					this.theme = newValue;
				} else if (name === "language") {
					this.language = newValue;
				}
				if (this.editor) {
					const newExtensions = this.getExtensions();
					this.editor.dispatch({
						effects: this.editor.state.reconfigure(newExtensions)
					});
				}
			}
		}

		async connectedCallback() {
			this.value = this.getAttribute("value") || "";
			this.theme = this.getAttribute("theme") || "dark";
			this.language = this.getAttribute("language") || "json";
			this.editor = null;
			const config = await ConfigService.Load()
			this.config = config.Config;
			this.render();
		}

		disconnectedCallback() {
			if (this.editor) {
				this.editor.destroy();
				this.editor = null;
			}
		}

		setupEditor(container) {
			let languageExtension;
			if (this.language === "json") {
				languageExtension = json();
			} else if (this.language === "markdown" || this.language === "md") {
				languageExtension = markdown();
			} else {
				languageExtension = json();
			}

			const extensions = [
				history(),
				drawSelection(),
				indentOnInput(),
				bracketMatching(),
				highlightActiveLine(),
				highlightSpecialChars(),
				foldGutter(),
				languageExtension,
				oneDark,
				EditorView.lineWrapping,
				EditorState.allowMultipleSelections.of(true),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						this.value = update.state.doc.toString();
						this.dispatchEvent(
							new CustomEvent("change", {
								detail: { value: this.value },
							}),
						);
					}
				}),
			];

			if (this.config?.lineNumbers) {
				extensions.push(
					lineNumbers(),
				);
			}

			if (this.config?.vimMode) {
				extensions.push(vim({ status: true }));
				extensions.push(keymap.of([...defaultKeymap, ...historyKeymap]));
			} else {
				extensions.push(keymap.of([...defaultKeymap, ...historyKeymap]));
			}

			const startState = EditorState.create({
				doc: this.value,
				extensions: extensions,
			});

			this.editor = new EditorView({
				state: startState,
				parent: container,
			});
		}

		async render() {
			this.value = this.getAttribute("value") || this.value || "";

			this.innerHTML = `
        <style>
          .code-editor {
            height: 100%;
            overflow: hidden;
            border-radius: 6px;
            background: #282c34;
          }
          .cm-editor {
            height: 100%;
          }
          .cm-editor.cm-focused {
            outline: none;
          }
        </style>
        <div class="code-editor"></div>
      `;

			const container = this.querySelector(".code-editor");
			if (container && !this.editor) {
				this.setupEditor(container);
			}
		}
	};
}
