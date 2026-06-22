export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function clear(node) {
  if (node) node.replaceChildren();
}

export function el(tag, options = {}) {
  const node = document.createElement(tag);
  const { className, text, attrs = {}, children = [] } = options;

  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;

  Object.entries(attrs).forEach(([key, value]) => {
    if (value === false || value === null || value === undefined) return;
    if (value === true) {
      node.setAttribute(key, "");
      return;
    }
    node.setAttribute(key, String(value));
  });

  children.filter(Boolean).forEach((child) => {
    node.append(child);
  });

  return node;
}

export function setText(selector, value, root = document) {
  const node = qs(selector, root);
  if (node) node.textContent = value;
}
