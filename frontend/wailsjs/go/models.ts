export namespace config {
	
	export class Config {
	    numberOfCardsInReview: number;
	    decksExcludedFromReview: string[];
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.numberOfCardsInReview = source["numberOfCardsInReview"];
	        this.decksExcludedFromReview = source["decksExcludedFromReview"];
	    }
	}

}

export namespace nihongo {
	
	export class WordInfo {
	    definitions: string[];
	    partsOfSpeech: string[];
	    notes: string[];
	    surface: string;
	
	    static createFrom(source: any = {}) {
	        return new WordInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.definitions = source["definitions"];
	        this.partsOfSpeech = source["partsOfSpeech"];
	        this.notes = source["notes"];
	        this.surface = source["surface"];
	    }
	}

}

export namespace storage {
	
	export class Flashcard {
	    deckId: string;
	    id: string;
	    title: string;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new Flashcard(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.deckId = source["deckId"];
	        this.id = source["id"];
	        this.title = source["title"];
	        this.content = source["content"];
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
		    if (a.slice) {
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

