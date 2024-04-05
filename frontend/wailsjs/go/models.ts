export namespace storage {
	
	export class SRSData {
	    filename: string;
	    reviewDate: string;
	
	    static createFrom(source: any = {}) {
	        return new SRSData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.filename = source["filename"];
	        this.reviewDate = source["reviewDate"];
	    }
	}
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
	    srsData: SRSData[];
	
	    static createFrom(source: any = {}) {
	        return new Deck(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.cards = this.convertValues(source["cards"], Flashcard);
	        this.srsData = this.convertValues(source["srsData"], SRSData);
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

