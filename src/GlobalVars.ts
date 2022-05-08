import {mergeRegexes} from "./Utils";


export const blacklist = mergeRegexes([
    // Emojis
    /(?:[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/,
    // Ascii Smileys/Punctuation spam
    /\s+((?=[!-~])[\W_]){2,}\s*/,
    // Text-speak
    /\b(?:t(?:y(?:sm|vm)?|hx)|ily(?:sm)?|k)\b/,
    // Glad to help/Happy I could help/Glad to hear
    /(?:happy|glad)\s*(?:\w+\s+)*?(he(?:ar|lp))/,
    // You're/that's awesome!
    /(?:you(r|['’]?re|\s+are)?|that['’]?s?)\s+(?:a(?:\s+rock\s+star|mazing|wesome)|incredible|brilliant|wonderful|rock|perfect)[.!]?/,
    // Any help would be appreciated
    /(?:Any\s+help\s+would\s+be\s+(?:a(?:ppreciated|wesome)|wonderful|great))/,
    // That's what I was looking for/that's it
    /((?:\w+\s+)*?(?:looking\s*for)|that['’]?s?\s*it)[.!]?/,
    // was what I needed
    /(this|that|it)?((['’]s?)|\s+((wa|i)s))\s+(\w+\s+)*?what\s+(\w+\s+)*?need(ed|ing)?/,
    // Happy coding
    /(?:happy\s+coding)/,
    // This solved my issue/This resolved my issue/This fixed my issue
    /(it(['’]?s)?|this)\s*((re)?solved?|fix(ed)?)\s*(((m[ey]|the)\s*(issue|problem))|it)/,
    // TRE('bro', 'dude', 'man', 'bud', 'buddy', 'amigo', 'pal', 'homie', 'friend', 'friendio', 'friendo', 'mate', 'sir', 'fam')
    // bro often an unknown number of o's so should be bro+
    // man often has an unknown number of n's so it should be man+
    // (needs manually re-added whenever the TRE is re-built)
    /\b(?:f(?:riend(?:io|o)?|am)|b(?:ud(?:dy)?|ro+)|ma(?:te|n+)|amigo|homie|dude|pal|sir)\b/,
    /*
     * Following rules modified from https://github.com/kamil-tekiela/commentBot/blob/master/src/Comment.php
     */
    // gratitude
    /(?:(?:big\s+|many\s+)?th?ank(?:s|\s*you|\s*u)?(?:\s+a lot|\s+(?:very|so) much|\s+a mil+ion|\s+)?(?:\s*for (?:your|the)?(?:\s+help)?)?|th?anx|thx|cheers)/,
    // it worked like a charm
    /(?:this\s+|that\s+|it\s+)?(?:solution\s+)?work(?:ed|s)?\s*(?:now|perfectly|great|for me|like a charm)?/,
    // you are welcome
    /(?:(?:you(?:['’]?re?|\s+are)\s+)?welcome)+/,
    // this was very helpful
    /(?:(?:I\s+)?(?:hope\s+)?(?:your\s+|(?:this\s+|that\s+|it\s+)(?:was\s+|is\s+)?)?(?:very\s+)?help(?:ful|ed|s)|useful(?:\s+a lot|\s+(?:very|so) much)?)+/,
    // Excitement
    // TRE('ingenious', 'superb', 'amazing', 'fantastic', 'perfect', 'wonderful', 'brilliant', 'excellent', 'marvelous', 'awesome', 'bravo')
    // wow has any number of wow so should be w+o+w+ (should be added at the end of the OR list)
    /(?:a(?:mazing|wesome)|br(?:illiant|avo)|excellent|fantastic|ingenious|marvelous|wonderful|perfect|superb|w+o+w+)/,
    // saviour
    /(?:You(?:['’]?re?|\s*are|['’]?ve|\s*have)?\s+)?(?:a\s+life\s+saver|saved?\s+(m[ey]|the|it))/,
    // please accept
    /(?:please(?:\s+\w+)*\s+)?accept(?:ed|ing)?\b(?:\s+the\s+answer)?/,
    // please upvote
    /(?:please(?:\s+\w+)\s+)?(?:give an?\s+)?upvot(?:ed?|ing)(?:\s+the answer)?/,
], 'gi');

export const whitelist = mergeRegexes([
    /\b(?:n(?:eed|ot)|unfortunate(ly)?|persists?|require|but|unaccept(ed)?)\b/,
    /*
    bases = ["would", "could", "should",
             "do", "did", "does",
             "have", "has",
             "ca", "ai",
             "are", "is"]
     suffixes = ["n't", "n’t", "n'", "n’", "nt"]
     */
    /(?:d(?:o(?:esn(?:'t?|’t?|t)|n(?:'t?|’t?|t))|idn(?:'t?|’t?|t))|c(?:ouldn(?:'t?|’t?|t)|an(?:'t?|’t?|t))|ha(?:ven(?:'t?|’t?|t)|sn(?:'t?|’t?|t))|a(?:ren(?:'t?|’t?|t)|in(?:'t?|’t?|t))|shouldn(?:'t?|’t?|t)|wouldn(?:'t?|’t?|t)|isn(?:'t?|’t?|t))/,
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