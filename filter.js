const enList = require("./lib/enList.json").words;
const jpList = require("./lib/jpList.json").words;

class Filter {
    constructor() {
        this.words = [];
        this.sentence = "";
        this.filteringList = {
            jp: jpList,
            en: enList,
        }
    }

    /**
     * 
     * @param {string} sentence 
     * @returns
     */
    clean(sentence) {
        this.sentence = sentence.toLowerCase();
        let tmp = this.sentence;
        for (let word of this.words) {
            tmp = tmp.replaceAll(word, "*".repeat(word.length));
        }
        return tmp;
    }

    /**
     * 
     * @param {string} sentence 
     * @returns 
     */
    detect(sentence) {
        this.sentence = sentence;
        let detectedWords = [];
        for (let word of this.words) {
            if (this.sentence.includes(word)) {
                detectedWords.push(word);
            }
        }
        return detectedWords;
    }

    /**
     * 
     * @param {[]} list 
     */
    addWords(list) {
        this.words = this.words.concat(list);
    }

    /**
     * 
     * @param {string} language 
     */
    useFilteringList(language) {
        this.addWords(this.filteringList[language]);
    }
}

module.exports.Filter = Filter;