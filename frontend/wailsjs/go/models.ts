export namespace config {
	
	export class Config {
	    dbFile: string;
	    numberOfCardsInReview: number;
	    vimMode: boolean;
	    lineNumbers: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dbFile = source["dbFile"];
	        this.numberOfCardsInReview = source["numberOfCardsInReview"];
	        this.vimMode = source["vimMode"];
	        this.lineNumbers = source["lineNumbers"];
	    }
	}

}

export namespace main {
	
	export class ConfigResult {
	    Config: config.Config;
	    Error: string;
	
	    static createFrom(source: any = {}) {
	        return new ConfigResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Config = this.convertValues(source["Config"], config.Config);
	        this.Error = source["Error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace models {
	
	export class CardData {
	    last_review: number;
	    next_review: number;
	    review_count: number;
	    ease_factor: number;
	
	    static createFrom(source: any = {}) {
	        return new CardData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.last_review = source["last_review"];
	        this.next_review = source["next_review"];
	        this.review_count = source["review_count"];
	        this.ease_factor = source["ease_factor"];
	    }
	}
	export class Flashcard {
	    deckId: string;
	    id: string;
	    title: string;
	    content: string;
	    html: string;
	    next_review?: number;
	    review_count?: number;
	    ease_factor?: number;
	
	    static createFrom(source: any = {}) {
	        return new Flashcard(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.deckId = source["deckId"];
	        this.id = source["id"];
	        this.title = source["title"];
	        this.content = source["content"];
	        this.html = source["html"];
	        this.next_review = source["next_review"];
	        this.review_count = source["review_count"];
	        this.ease_factor = source["ease_factor"];
	    }
	}
	export class Deck {
	    name: string;
	    cards: Flashcard[];
	
	    static createFrom(source: any = {}) {
	        return new Deck(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.cards = this.convertValues(source["cards"], Flashcard);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

