/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

/** @jsx h */

const componentRegistry = new Map<typeof Component, CustomElementConstructor>();

export type Props<T = { [key: string]: unknown }> =
  & { children?: ComponentChildren }
  & T;

class Component {
  static get $name(): string {
    throw new Error("plese define name");
  }
  static define() {
    const TargetClass = (() => this)();
    class ElementClass extends HTMLElement {
      #shadow: ShadowRoot;
      #props: { [key: string]: unknown } & { children: ComponentChildren };
      constructor(
        props?: { [key: string]: unknown } & { children: ComponentChildren },
      ) {
        super();
        this.#props = props ?? { children: [] };
        this.#shadow = this.attachShadow({ mode: "closed" });
      }
      connectedCallback() {
        const shadowRoot = this.#shadow;
        const instance = new TargetClass(this.#props);
        if (instance.#vNode) {
          shadowRoot.appendChild(instance.#vNode.ref);
        } else {
          throw new Error("prease call this.render()");
        }
      }
    }
    componentRegistry.set(TargetClass, ElementClass);
    customElements.define(
      TargetClass.$name,
      ElementClass,
    );
    return this;
  }
  #vNode: JSX.Element | undefined;
  constructor(_?: Props) {
  }
  render(vNode: JSX.Element) {
    this.#vNode = vNode;
  }
  static isComponent(target: unknown): target is typeof Component {
    try {
      (target as Component).#vNode;
      return true;
    } catch {
      return false;
    }
  }
}

type CounterProps = Props<{ initialValue: number }>;
(class extends Component {
  static $name = "my-counter";
  style = new CSSStyleSheet();
  #span;
  #count = 0;
  constructor({ initialValue }: CounterProps) {
    super();
    this.#count = initialValue ?? 0;
    this.render(
      <div>
        <MyButton onClick={this.#increment} m="1">+</MyButton>
        <MyButton onClick={this.#increment}></MyButton>
        {this.#span = <span>{this.#count}</span>}
      </div>,
    );
  }
  #increment() {
    this.#count++;
    this.#span.setChild(this.#count);
    this.#span.setChild(<span>{this.#count}</span>);
    this.#span.setAttribute({ "data-i": this.#count });
  }
}).define();
class MyButton extends Component {
  static $name = "my-button";
  static _ = this.define();
  constructor(props: Props<{ onClick(): void }>) {
    super();
    this.render(<button onClick={props.onClick}>+</button>);
  }
}

export type ComponentChildren = unknown;
export type FunctionalComponent<T = { [key: string]: unknown }> = (
  props: { children?: ComponentChildren } & T,
) => VNode;

declare global {
  namespace JSX {
    type Element = VNode;
    type ElementClass = Component;
    type IntrinsicElements = {
      [elemName in keyof HTMLElementTagNameMap]: {
        children?: ComponentChildren;
        [key: string]: unknown;
      };
    };
    interface ElementChildrenAttribute {
      children: unknown;
    }
  }
}

function h(
  type: keyof HTMLElementTagNameMap | typeof Component | (() => VNode),
  props: Record<string, unknown>,
  ...children: ComponentChildren[]
) {
  return new VNode(type, props, children);
}

class VNode {
  #ref: HTMLElement;
  constructor(
    type: keyof HTMLElementTagNameMap | typeof Component | FunctionalComponent,
    props: Record<string, unknown>,
    children: ComponentChildren[],
  ) {
    let ref: HTMLElement;
    if (typeof type === "string") {
      const component = customElements.get(type);
      if (component) {
        ref = new component({ ...props, children });
      } else {
        ref = document.createElement(type);
      }
    } else {
      if (Component.isComponent(type)) {
        const component = componentRegistry.get(type);
        ref = new component!({ ...props, children });
      } else {
        ref = type({ ...props, children }).ref;
      }
    }
    for (const [key, val] of Object.entries(props)) {
      ref.setAttribute(key, `${val}`);
    }
    const node = nodeFromChildren(children);
    if (node) {
      ref.appendChild(node);
    }
    this.#ref = ref;
  }
  setChild(children: ComponentChildren) {
    this.#ref.innerHTML = "";
    const node = nodeFromChildren([children]);
    if (node) {
      this.#ref.appendChild(node);
    }
  }
  setAttribute(props: Record<string, unknown>) {
    for (const [key, val] of Object.entries(props)) {
      this.#ref.setAttribute(key, `${val}`);
    }
  }
  get ref() {
    return this.#ref;
  }
}

function nodeFromChildren(children: ComponentChildren[]): Node | undefined {
  if (!children.length) {
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const child of children) {
    if (Array.isArray(child)) {
      const node = nodeFromChildren(child);
      if (node) {
        fragment.appendChild(node);
      }
    } else if (child instanceof VNode) {
      fragment.appendChild(child.ref);
    } else if (typeof child === "object" && child !== null) {
      fragment.appendChild(document.createTextNode(JSON.stringify(child)));
    } else {
      fragment.appendChild(document.createTextNode(`${child}`));
    }
  }
  return fragment;
}

const a = <a>{[["a"]]}</a>;
const a = <a>{["a"]}</a>;
const a = <a>{"a"}</a>;
const a = <a>a</a>;
