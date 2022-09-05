```tsx
class MyCounter extends Component {
  static $name = "my-counter";
  static _ = this.define();
  style = new CSSStyleSheet();
  #span;
  #count = 0;
  constructor({ initialValue }: CounterProps) {
    super();
    this.#count = initialValue ?? 0;
    this.render(
      <div>
        <MyButton onClick={this.#increment} m="1">+</MyButton>
        {this.#span = <span>{this.#count}</span>}
      </div>,
    );
  }
  #increment() {
    this.#count++;
    this.#span.setChild(this.#count);
    // this.#span.setChild(<span>{this.#count}</span>);
    // this.#span.setAttribute({ "data-i": this.#count });
  }
}
class MyButton extends Component {
  static $name = "my-button";
  static _ = this.define();
  constructor(props: Props<{ onClick(): void }>) {
    super();
    this.render(<button onClick={props.onClick}>+</button>);
  }
}
```
