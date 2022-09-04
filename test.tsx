/** @jsx h */
import { h, renderToString } from "./mod.ts";

const a = (
  <a onload="val">
    {Promise.resolve([
      <a foo="val"></a>,
      Promise.resolve("aaaa"),
      1,
      <a-a></a-a>,
    ])}
  </a>
);
// {[<a foo="val">a</a>, Promise.resolve("<hey>")]}
// <div>{Promise.resolve(<h></h>)}</div>
console.log(a);
console.log(await renderToString(a));
