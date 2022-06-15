declare global {
  namespace JSX {
    interface Element {
      nodeKey: typeof nodeKey;
      type: string;
      props?: { [prop: string]: string } | null;
      children?: ChildNode[];
    }
    interface IntrinsicElements {
      [elemName: string]: unknown;
    }
    // interface ElementChildrenAttribute {
    //   children: {};
    // }
  }
}

type Node =
  | JSX.Element
  | string
  | number
  | null
  | false;
type ChildNode =
  | Node
  | Promise<Node>
  | Node[]
  | Promise<Node[]>
  | Promise<Promise<Node>[]>;

const nodeKey = Symbol("[nodeKey]");
// deno-lint-ignore no-explicit-any
function isJSXElement(arg: any): arg is JSX.Element {
  return arg.nodeKey === nodeKey;
}

/** JSX factry */
export function h(
  type: string,
  props?: { [prop: string]: string } | null,
  ...children: ChildNode[]
): JSX.Element {
  return { nodeKey, type, props, children };
}

const escape: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&#39;",
  '"': "&#34;",
};
function escapeHTML(text: string): string {
  return text.replaceAll(/[&<>"']/g, (char) => {
    return escape[char];
  });
}

async function renderChildren(children: ChildNode): Promise<string> {
  const awaitedChildren = await children;
  if (Array.isArray(awaitedChildren)) {
    const rendered = await Promise.all(awaitedChildren.map(renderChildren));
    return rendered.join("");
  }
  if (!awaitedChildren) {
    return "";
  }
  if (isJSXElement(awaitedChildren)) {
    return await renderToString(awaitedChildren);
  }
  return escapeHTML(`${awaitedChildren}`);
}

const singleTag = new Set([
  "area",
  "base",
  "basefont",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "spacer",
  "track",
  "wbr",
]);

/** Render JSX to string */
export async function renderToString(
  { type, props, children }: JSX.Element,
): Promise<string> {
  // render props
  const _props = props
    ? Object.entries(props)
      .map(([key, value]) => ` ${key}="${value.replace(/\"/g, '\\"')}"`)
      .join("")
    : "";

  let innerHTML = "";
  if (children) {
    for (const child of children) {
      innerHTML += await renderChildren(child);
    }
  }

  if (singleTag.has(type)) {
    return `<${type}${_props} />`;
  } else {
    return `<${type}${_props}>${innerHTML}</${type}>`;
  }
}
