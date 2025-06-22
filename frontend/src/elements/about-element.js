export default function AboutElement({ SRS }) {
	return class extends HTMLElement {
		constructor() {
			super();
		}

		connectedCallback() {
			this.render();
		}

		async render() {
			const aboutContent = `
## About MDSRS

MDSRS is a Markdown-based Spaced Repetition System for learning and memorization.

### Features

- Create flashcards using Markdown
- Spaced repetition learning


        `;

			const [htmlContent, error] = await this.convertToHTML(aboutContent);
			if (error) {
				console.error("Error converting markdown to HTML:", error);
				this.innerHTML = '<div class="error">Error loading about content</div>';
				return;
			}

			this.innerHTML = `
            <div class="about-container">
                <div class="about-content">
                    <div class="markdown-body">
                        ${htmlContent}
                    </div>
                </div>
            </div>
        `;
		}

		async convertToHTML(content) {
			const html = await SRS.ToHTML(content);
			if (!html) {
				return [null, new Error("Failed to convert markdown to HTML")];
			}
			return [html, null];
		}
	};
}
