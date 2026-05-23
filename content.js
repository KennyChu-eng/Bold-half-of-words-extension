// Tags don't wanna touch
const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE',
  'INPUT', 'SELECT', 'BUTTON', 'HEAD', 'TITLE'
]);

const ATTR = 'data-bionic'; 
let enabled = false;
let observer = null; 

// Bold the first half of a single word
function bionicWord(word) {
  const half = Math.ceil(word.length / 2);
  return `<b>${word.slice(0, half)}</b>${word.slice(half)}`;
}

// Replace a text node with a <span> containing bionic-bolded HTML
function processNode(node) {
  const text = node.nodeValue;
  if (!text?.trim() || !/\p{L}/u.test(text)) return; // skip empty or symbol-only nodes
  const parent = node.parentNode;
  if (!parent || SKIP_TAGS.has(parent.tagName) || parent.hasAttribute?.(ATTR)) return; // skip already-processed or forbidden parents
  if (parent.tagName === 'B' || parent.tagName === 'STRONG') return; // skip already-bold text

  const span = document.createElement('span');
  span.setAttribute(ATTR, '1'); // mark as processed
  span.innerHTML = text.replace(/(\p{L}+)/gu, (m) => bionicWord(m));
  parent.replaceChild(span, node);
}

// Walk every text node 
function walkTree(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentNode;
      // Reject nodes inside skip tags or already-processed spans
      if (!p || SKIP_TAGS.has(p.tagName) || p.hasAttribute?.(ATTR)) return NodeFilter.FILTER_REJECT;
      if (p.tagName === 'B' || p.tagName === 'STRONG') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(processNode);
}

// Bold the first half of word
function enable() {
  walkTree(document.body);
  // Watch for dynamically added content (infinite scroll, SPAs, etc.)
  observer = new MutationObserver((mutations) => {
    mutations.forEach(({ addedNodes }) => {
      addedNodes.forEach(n => {
        if (n.nodeType === Node.TEXT_NODE) processNode(n);
        else if (n.nodeType === Node.ELEMENT_NODE && !SKIP_TAGS.has(n.tagName)) walkTree(n);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Restore original text
function disable() {
  observer?.disconnect(); observer = null;
  document.querySelectorAll(`[${ATTR}]`).forEach(span => {
    span.parentNode.replaceChild(document.createTextNode(span.textContent), span);
  });
}

// Listen for toggle messages sent from popup.js
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'toggle') {
    enabled = msg.enabled;
    enabled ? enable() : disable();
  }
});

// Check storage and auto-enable if the user had it turned on
chrome.storage.local.get(['bionicEnabled'], ({ bionicEnabled }) => {
  if (bionicEnabled) {
    enabled = true;
    window.addEventListener('load', enable);
    }
  });