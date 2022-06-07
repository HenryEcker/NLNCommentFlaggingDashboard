import {mergeRegexes} from './Utils';


export const blacklist = mergeRegexes([
    // Emojis
    /(?:[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/,
    // Ascii Smileys/Punctuation spam
    /\s+((?=[!-~])[\W_]){2,}\s*/,
    // Text-speak
    /*
from trieregex import TrieRegEx as TRE

TRE(
    'ty', 'tysm', 'tyvm', 'thx',
    'ily', 'ilysm',
    'k',
    'omg', 'omfg',
    'lmao', 'lmfao'
).regex()
     */
    /\b(?:t(?:y(?:sm|vm)?|hx)|lm(?:fao|ao)|ily(?:sm)?|om(?:fg|g)|k)\b/,
    // Glad to help/Happy I could help/Glad to hear
    /(?:happy|glad)\s*(?:\w+\s+)*?(he(?:ar|lp))/,
    // You're/that's awesome!
    /(?:you(r|['’]?re|\s+are)?|that['’]?s?)\s+(?:(a\s+)?(\s+rock\s+star|amazing|awesome|incredible|brilliant|wonderful|rock|perfect|genius))[.!]?/,
    // OMG
    /(oh\s+)?(my\s+)?(god|goodness)[.!]?|(holy\s+\w+)/,
    // Any help would be appreciated
    /(?:Any\s+help\s+would\s+be\s+(?:a(?:ppreciated|wesome)|wonderful|great))/,
    // That's what I was looking for/that's it
    /((?:\w+\s+)*?(?:looking\s*for)|that['’]?s?\s*it)[.!]?/,
    // was what I needed
    /(?:(this|that|it)?((['’]s?)|\s+((wa|i)s)\s+)?(\w+\s+)*?)what\s+(\w+\s+)*?need(?:ed|ing)?/,
    // Happy coding
    /(?:happy\s+coding)/,
    // Have a great day
    /(have a\s+(\w+\s+)*?(day|evening|night)([.!]*)?)/,
    // This solved my issue/This resolved my issue/This fixed my issue
    /(it(['’]?s)?|this)\s*((re)?solved?|fix(ed)?)\s*(((m[ey]|the)\s*(issue|problem))|it)/,
    /*
from trieregex import TrieRegEx as TRE

TRE('broo', 'boss', 'dude', 'man', 'bud', 'buddy', 'amigo', 'pal', 'homie',
    'friend', 'friendio', 'friendo', 'fella', 'mate', 'sir', 'fam', 'brother',
    'soldier', 'daddy', 'senpai').regex()
     */
    // bro often an unknown number of o's so should be bro+ (broo* so it can be added with brother)
    // man often has an unknown number of n's so it should be man+
    // (needs manually re-added whenever the TRE is re-built)
    /\b(?:b(?:ro(?:ther|o+)|ud(?:dy)?|oss)|f(?:riend(?:io|o)?|ella|am)|s(?:oldier|enpai|ir)|d(?:addy|ude)|ma(?:te|n+)|amigo|homie|pal)\b/,
    // thanks
    /(?:(?:big\s+|many\s+)?th?ank(?:s|\s*you|\s*u)?(?:\s+a lot|\s+(?:very|so) much|\s+a mil+ion|\s+)?(?:\s*for (?:(your|the)\s+)?(?:help(ing)?)?)?|th?anx|thx|cheers)/,
    // Your [very excellent] solution [also] worked like a charm
    /((this|that|it(['’]?s)?|your)\s+)?(?:\s+(\w+\s+)*?(solution|answer|code)\s+(\w+\s+)*?)?work(?:ed|s|ing)?\s*(?:now|perfectly|great|for\s+me|((like|as)\s+)?(a\s+)?charm|again|[!.])?/,
    // you are welcome/my pleasure
    /(?:(?:you(?:['’]?re?|\s+are)\s+)?welcome|my pleasure)+/,
    // this was very helpful
    /(?:(?:I\s+)?(?:hope\s+)?(?:your\s+|(?:this\s+|that\s+|it\s+)(?:was\s+|is\s+)?)?(?:very\s+)?help(?:ful|ed|s)|useful(?:\s+a lot|\s+(?:very|so) much)?)+/,
    // TRE('ingenious', 'superb', 'amazing', 'fantastic', 'perfect', 'wonderful', 'brilliant', 'excellent', 'marvelous', 'awesome', 'bravo')
    // wow has any number of wow so should be w+o+w+ (should be added at the end of the OR list)
    /(?:a(?:mazing|wesome)|br(?:illiant|avo)|excellent|fantastic|ingenious|marvelous|wonderful|perfect|superb|w+o+w+)/,
    // saviour
    /(?:you(['’]?re?|\s+are|['’]?ve|\s+have)?|this(\s+(wa|i|['’])s)?\s+)?(?:a\s+life(-|\s+)saver|sav(e|ed|ing)\s+(m[ey]|the|it))/,
    // please accept
    /(?:please(?:\s+\w+)*\s+)?accept(?:ed|ing)?\b(?:\s+the\s+answer)?/,
    // please upvote
    /(?:please(?:\s+\w+)\s+)?(?:give an?\s+)?upvot(?:ed?|ing)(?:\s+the answer)?/,
    // is/should be the correct/accepted/right answer
    /(?:is|should be)(?:\s+\w+)*\s+(?:right|correct|accepted)(?:\s+\w+)*\s+(?:answer|solution)/,
    // /help/someone-answer or /help/accepted-answer
    /(?:(https:\/\/stackoverflow.com)?\/help\/(someone-answers|accepted-answer))/
], 'gi');

export const whitelist = mergeRegexes([
    /\b(?:n(?:eed|ot)|unfortunate(ly)?|persists?|require|but|unaccept(ed)?)\b/,
    /*
from itertools import product

from trieregex import TrieRegEx as TRE

bases = ["would", "could", "should",
         "wo",
         "do", "did", "does",
         "have", "has",
         "ca", "ai",
         "are", "is"]
suffixes = ["n't", "n’t", "n'", "n’", "nt"]

TRE(*[f'{b}{s}' for b, s in product(bases, suffixes)]).regex()
     */
    /\b(?:d(?:o(?:esn(?:'t?|’t?|t)|n(?:'t?|’t?|t))|idn(?:'t?|’t?|t))|c(?:ouldn(?:'t?|’t?|t)|an(?:'t?|’t?|t))|ha(?:ven(?:'t?|’t?|t)|sn(?:'t?|’t?|t))|wo(?:uldn(?:'t?|’t?|t)|n(?:'t?|’t?|t))|a(?:ren(?:'t?|’t?|t)|in(?:'t?|’t?|t))|shouldn(?:'t?|’t?|t)|isn(?:'t?|’t?|t))\b/,
    /\b(will|I'?ll)\s*try\b/,
    /[?]/
], 'gi');


/**
 * Base Class of Errors which share the name with their class name
 */
class SelfNamedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

/**
 * Errors used to differentiate the various failure modes
 */
export class FlagAttemptFailed extends SelfNamedError {
}

export class RatedLimitedError extends SelfNamedError {
}