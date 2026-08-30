// Raphael 等旧插件会覆盖 window.Element；从 HTMLElement 原型保留浏览器原生构造器。
export const DOMElement = Object.getPrototypeOf(HTMLElement) as typeof Element;
