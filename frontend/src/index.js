import SRS from "./services/srs.js";
import ConfigService from "./services/config.js";

import feather from 'feather-icons';
window.feather = feather;

import AboutElement from "./elements/about-element.js"
import AppElement from "./elements/app-element.js"
import "./elements/sidebar-element.js"
import MainContent from "./elements/main-content.js"
import CardViewer from "./elements/card-viewer.js"
import CardEditor from "./elements/card-editor.js"
import CardNavigation from "./elements/card-navigation.js"
import CodeEditor from "./elements/code-editor.js"
import ConfigEditor from "./elements/config-editor.js"
import "./elements/icon-button.js"
import "./elements/main-layout.js"
import "./elements/review-dashboard.js"
import "./elements/toast-element.js"
import ModalElement from "./elements/modal-element.js"
import DeckExplorer from "./elements/deck-explorer.js"
import "./elements/deck-explorer-actions.js"
import "./elements/deck-table.js"
import CardListView from "./elements/card-list-view.js"
import FutureReviews from "./elements/future-reviews.js"

import "./styles/card-list-view.css"
import "./styles/card-editor.css"
import "./styles/future-reviews.css"

customElements.define("app-element", AppElement({ SRS }));
customElements.define("main-content", MainContent({ SRS, ConfigService }));
customElements.define("deck-explorer", DeckExplorer({ SRS, ConfigService }));
customElements.define("code-editor", CodeEditor({ SRS, ConfigService }));
customElements.define("card-viewer", CardViewer({ SRS, ConfigService }));
customElements.define("card-editor", CardEditor({ SRS }));
customElements.define("card-list-view", CardListView({ SRS }));
customElements.define("config-editor", ConfigEditor({ ConfigService }));
customElements.define("about-element", AboutElement({ SRS }));
customElements.define("modal-element", ModalElement({ SRS }));
customElements.define("card-navigation", CardNavigation({ SRS }));
customElements.define("future-reviews", FutureReviews({ SRS }));
