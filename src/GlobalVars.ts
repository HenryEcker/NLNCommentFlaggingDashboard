import {mergeRegexes} from './Utils';


export const blacklist = mergeRegexes([
    // Emojis
    /(?:[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/,
    // Ascii Smileys/Punctuation spam
    /\b\s+((?=[!-~])[\W_]){2,}\s*\b/,
    // Text-speak
    /*
from trieregex import TrieRegEx as TRE

TRE(
    'ty', 'tysm', 'tyvm', 'thx', 'tks', 'thks',
    'ily', 'ilysm',
    'k',
    'omg', 'omfg',
    'lmao', 'lmfao'
).regex()
     */
    /\b(?:t(?:y(?:sm|vm)?|h(?:ks|x)|ks)|lm(?:fao|ao)|ily(?:sm)?|om(?:fg|g)|k)\b/,
    // Glad to help/Happy I could help/Glad to hear
    /\b(?:happy|glad)\s*(?:\w+\s+)*?(he(?:ar|lp))\b/,
    // You're/that's awesome!
    /\b(?:you(r|['’]?re|\s+are)?|that['’]?s?)\s+(?:(a\s+)?(\s+rock\s+star|amazing|awesome|incredible|brilliant|wonderful|rock|perfect|genius))\b(?:[.!]*)/,
    // OMG
    /\b(oh\s+)?(my\s+)?(god|goodness)|(holy\s+\w+)\b(?:[.!])*/,
    // Any help would be appreciated
    /\b(?:Any\s+help\s+would\s+be\s+(?:a(?:ppreciated|wesome)|wonderful|great))\b/,
    // was [very much] what I needed/was what I was looking for/that's it
    /\b(?:(this|that|it)?(((['’]s?)|\s+((wa|i)s))\s+)(?:\w+\s+){0,2}?(what\s+(\w+\s+)*?((want|need)(?:ed|ing)?|looking\s*for)))\b(?:[.!]*)/,
    // Happy coding
    /\b(?:happy\s+coding)\b/,
    // Have a great day
    /\b(have a\s+(\w+\s+)*?(day|evening|night))\b(?:[.!]*)/,
    // This solved my issue/This resolved my issue/This fixed my issue
    /\b(it(['’]?s)?|this)\s*((re)?solved?|fix(ed)?)\s*(((m[ey]|the)\s*(issue|problem))|it)\b/,
    /*
from trieregex import TrieRegEx as TRE

TRE('broo', 'boss', 'dude', 'man', 'bud', 'buddy', 'amigo', 'pal', 'homie',
    'friend', 'friendio', 'friendo', 'fella', 'mate', 'sir', 'fam', 'brother',
    'soldier', 'daddy', 'senpai', 'champ').regex()
     */
    // bro often an unknown number of o's so should be bro+ (broo* so it can be added with brother)
    // man often has an unknown number of n's so it should be man+
    // (needs manually re-added whenever the TRE is re-built)
    /\b(?:b(?:ro(?:ther|o*)|ud(?:dy)?|oss)|f(?:riend(?:io|o)?|ella|am)|s(?:oldier|enpai|ir)|d(?:addy|ude)|ma(?:te|n+)|amigo|champ|homie|pal)\b/,
    // thanks
    /\b(?:(?:big\s+|many\s+)?th?ank(?:s|\s*you|\s*u)?(?:\s+a lot|\s+(?:very|so) much|\s+a mil+ion|\s+)?(?:\s*for (?:(your|the)\s+)?(?:help(ing)?)?)?|th?anx|thx|cheers)\b/,
    // Your [very excellent] solution [also] worked like a charm
    /\b((this|that|it(['’]?s)?|your)\s+)?(?:(excellent|wonderful|awesome)\s+)?((solution|answer|code)\s+)?(((doe|i)s|also)\s+)?work(?:ed|s|ing)?(?:\s+(now|perfectly|great|for\s+me|((like|as)\s+)?(a\s+)?charm|again))?\b(?:[!.]*)/,
    // you are welcome/my pleasure
    /\b(?:(?:you(?:['’]?re?|\s+are)\s+)?welcome|my pleasure)+\b/,
    // this was very helpful
    /\b(?:(?:I\s+)?(?:hope\s+)?(?:your\s+|(?:this\s+|that\s+|it\s+)(?:was\s+|is\s+)?)?(?:very\s+)?help(?:ful|ed|s)|useful(?:\s+a lot|\s+(?:very|so) much)?)+\b/,
    // TRE('ingenious', 'superb', 'amazing', 'fantastic', 'perfect', 'wonderful', 'brilliant', 'excellent', 'marvelous', 'awesome', 'bravo')
    // wow has any number of wow so should be w+o+w+ (should be added at the end of the OR list)
    /\b(?:a(?:mazing|wesome)|br(?:illiant|avo)|excellent|fantastic|ingenious|marvelous|wonderful|perfect|superb|w+o+w+)\b/,
    // saviour
    /\b(?:(you(['’]?re?|\s+are|['’]?ve|\s+have)?|this(\s+(wa|i|['’])s)?)\s+)?(?:a\s+life(-|\s+)saver|sav(e|ed|ing)\s+(m[ey]|the|it))(\s+\w+)?\b/,
    // please accept
    /\b(?:please(?:\s+\w+)*\s+)?accept(?:ed|ing)?\b(?:\s+th(e|is)\s+answer)?\b/,
    // hit the checkmark
    /\b(click(ing)?|hit(t?ing)?)\s+(the\s+)?(gr[ae](en|y)\s+)?check(mark)?(\s+to\s+the\s+left|(((?:\s+\w+)*\s+)?answer))?\b/,
    // mark this answer as correct
    /\b(?:please(?:\s+\w+)*\s+)?mark\s+th(?:e|is)(\s+answer)?((\s+as)?(\s+the)?(\s+(correct|right))?(\s+answer)?)?\b/,
    // please upvote
    /\b(?:please(?:\s+\w+)*\s+)?(?:give an?\s+)?upvot(?:ed?|ing)(?:\s+the answer)?\b/,
    // is/should be the correct/accepted/right answer
    /\b(?:is|should be)(?:\s+\w+)*\s+(?:right|correct|accepted)(?:\s+\w+)*\s+(?:answer|solution)\b/,
    // /help/someone-answer or /help/accepted-answer
    /\b(?:(https:\/\/stackoverflow.com)?\/help\/(someone-answers|accepted-answer))\b/,
    /\b(?:b+u+m+p+)\b(?:[!.?~@#$^%]*)/
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
    /\b(will|I['’]?ll)\s*try\b/
], 'gi');