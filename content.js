// Tags don't wanna touch
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'INPUT', 'SELECT', 'BUTTON', 'HEAD', 'TITLE']);

const ATTR = 'data-bionic'; // Marker attribute don't process same node twice
let enabled = false;
let observer = null;

// Function to bold the first half of a word
function bionicWord(word) {
    
}