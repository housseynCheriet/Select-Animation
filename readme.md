
# 🚀 Select-Animation

[![npm version](https://img.shields.io/npm/v/select-animation.svg)](https://www.npmjs.com/package/select-animation)
[![GitHub license](https://img.shields.io/github/license/housseynCheriet/Select-Animation.svg)](https://github.com/housseynCheriet/Select-Animation)

A high-performance, lightweight JavaScript animation engine.

**Support our project:** [selectjs.vercel.app](https://selectjs.vercel.app)
**NPM Package:** [npmjs.com/package/select-animation](https://www.npmjs.com/package/select-animation)
**Source Code:** [github.com/housseynCheriet/Select-Animation](https://github.com/housseynCheriet/Select-Animation)

---

## **High‑Performance JavaScript Engine for Organic & Fluid Motion**

**Select-Animation** is a lightweight yet powerful JavaScript animation engine built in pure JavaScript, with zero dependencies. Designed for developers who require **full control over timing, easing, looping, and DOM interactions**, it emphasizes **performance, mathematical precision, and flexibility**.

This library is ideal for:

- Web UI animations
- SVG animations
- Interactive interfaces
- Advanced motion systems

It leverages `requestAnimationFrame` for smooth, high-performance rendering.

---

# ✨ Features

- ⚡ **High Performance** — Utilizes `requestAnimationFrame` to ensure smooth animations
- 🧠 **Advanced Looping System** — Supports multiple cycle modes like repeat, ping-pong, and reverse
- 🎛 **Event-Controlled Pause/Resume** — Pause or resume animations via DOM events
- 🎨 **Color & Transform Animation Support** — Animate CSS properties like color and transforms
- 📈 **Rich Easing Library** — Includes various easing functions for natural motion
- 🧩 **SVG Compatibility** — Supports animation of SVG elements
- 🧹 **Automatic Memory Cleanup** — Prevents memory leaks
- 🪶 **Pure JavaScript, Zero Dependencies**

---

# 📦 Installation

### Using npm:

```bash
npm install select-animation
```

### Usage in the browser:

Include the script directly:

```html
<script src="https://unpkg.com/select-animation/select-animation.js"></script>
```

or via CDN if available.

### Usage with ES Modules:

```javascript
import { animate, selectDom } from 'select-animation';
```

---

# 🚀 Basic Example

```javascript
const element = document.querySelectorAll(".box");
//or const element = selectDom(".box","div",......);

animate(element,{
    property: ["left", "opacity"], // Properties to animate
    from: 0,                        // Starting values
    to: 300,                        // Ending values
    duration: 1000,                 // Duration in milliseconds
    typeAnimation: "bounceout"      // Easing type
})();
```

---

# 🧠 Core Concepts

## Animation Configuration

Animations are defined using a configuration object:

```javascript
{
  from: 0,
  to: 200,
  duration: 1000,
  property: ["left"],
  typeAnimation: "cubicout"
}
```

### Properties Description

| Property          | Description                                               |
|-------------------|-----------------------------------------------------------|
| `from`            | Starting value of the property                            |
| `to`              | Final value of the property                               |
| `duration`        | Duration of the animation in milliseconds                 |
| `property`        | CSS property to animate                                    |
| `typeAnimation`   | Easing function for the animation                          |
| `timeline`        | Delay offset for multiple elements or properties           |
| `startafter`      | Delay before the animation begins                          |
| `callback`        | Custom function called on each frame                        |

---

# 🔁 Loop System

Supports advanced loop modes:

| Mode             | Description                                              |
|------------------|----------------------------------------------------------|
| `repeat`        | Repeats indefinitely                                    |
| `return`        | Plays forward then backward                              |
| `returnRepeat`  | Infinite ping-ponging                                   |
| `repeatReturn`  | Repeats then reverses direction                         |

Example:

```javascript
{
  boucle: true,
  boucleType: "returnRepeat"
}
```

---

# ⏸ Pause / Resume with Events

Enable pausing or resuming animations via DOM events:

```javascript
{
  pause: [".button", "e:click|false"]
}
```

**Meaning:**

- Pause the animation when `.button` is clicked.

---

# 🎨 Animating Colors

Supports color transitions for:

- `color`
- `backgroundColor`
- `borderColor`

Example:

```javascript
{
  property: [{ backgroundColor: ["rgbR", "rgbG", "rgbB"] }],
  from: { backgroundColor: [0, 0, 0] },
  to: { backgroundColor: [255, 0, 0] },
  duration: 1000
}
```

This allows smooth color transitions using RGB components.

---

# 🌀 Transform Animations

Supports animating CSS transform properties:

- `translateX`, `translateY`, `translateZ`
- `rotateX`, `rotateY`, `rotateZ`
- `scale`
- `skewX`, `skewY`

Example:

```javascript
{
  property: [{ transform: ["translateX"] }],
  from: 0,
  to: 300,
  duration: 800
}
```

---

# 📈 Easing Functions

Includes a comprehensive set of easing algorithms, such as:

- **Quad**, **Cubic**, **Quart**, **Quint**
- **Sine**, **Expo**, **Circ**
- **Elastic**, **Back**, **Bounce**

Each easing supports:

- `in`
- `out`
- `inout`
- `outin`

Example:

```javascript
typeAnimation: "bounceout"
```

---

# 🧩 Special Animation Types

| Type             | Description                                    |
|------------------|------------------------------------------------|
| `linear`         | Constant speed                                |
| `vibration`      | Oscillation effect                            |
| `cubicbezier`    | Custom cubic bezier curve                     |

Example:

```javascript
typeAnimation: "vibration"
```

---

# 🌐 Try It Online

Experiment with **Select-Animation** and explore various examples in your browser:

[🎬 Try Select-Animation Examples Online](https://selectjs.vercel.app/)

This interactive playground allows you to tweak properties, easing types, and sequences in real-time.



---

# ⚙ Internal Architecture

The engine includes:

- **RequestAnimationFrame Polyfill** — ensures cross-browser support
- **Mathematical Easing Functions** — for smooth motion
- **Color & Transform State Caching** — for performance
- **Deep Object Copy Utility** — for safe data handling
- **Automatic Frame Cancellation** — to optimize resource use

Ensuring **performance efficiency and memory safety**.

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Submit a pull request

---

# 📜 License

MIT License

© Housseyn Cheriet

---
