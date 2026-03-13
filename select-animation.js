/* -------------------------------------------------------------------------
 * Select-Animation: A High-Performance JavaScript Animation Engine
 * Designed for fluid motion and organic UI transitions.
 * Version: v1
 * Author: Housseyn Cheriet
 * Copyright: ©2026 Housseyn Cheriet
 * License: MIT
 * ------------------------------------------------------------------------- */

(function (global) {
  "use strict"; // Enable strict mode for safer JavaScript execution

  /* -------------------------------------------------
     RequestAnimationFrame Polyfill for cross-browser support
     ------------------------------------------------- */
  let lastFrameTime = 0;
  const vendorPrefixes = ["ms", "moz", "webkit", "o"];

  // Polyfill requestAnimationFrame
  for (let i = 0; i < vendorPrefixes.length && !window.requestAnimationFrame; ++i) {
    window.requestAnimationFrame = window[vendorPrefixes[i] + "RequestAnimationFrame"];
    window.cancelAnimationFrame =
      window[vendorPrefixes[i] + "CancelAnimationFrame"] ||
      window[vendorPrefixes[i] + "CancelRequestAnimationFrame"];
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback) {
      const currentTime = Date.now();
      const timeToCall = Math.max(0, 16 - (currentTime - lastFrameTime));
      const id = window.setTimeout(() => {
        callback(currentTime + timeToCall);
      }, timeToCall);
      lastFrameTime = currentTime + timeToCall;
      return id;
    };
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
  }

  /* -------------------------------------------------
     Default color properties used for color transformations
     ------------------------------------------------- */
  const defaultColorProps = {
    red: 255,
    green: 255,
    blue: 255,
    alpha: 1
  };

  const colorProperties = {
    color: defaultColorProps,
    background: defaultColorProps,
    backgroundColor: defaultColorProps,
    borderColor: defaultColorProps
  };

  /* -------------------------------------------------
     Map of CSS property placeholders for transformations
     ------------------------------------------------- */
  const styleMap = {
    zIndex: "*",
    left: "*px",
    top: "*px",
    bottom: "*px",
    right: "*px",
    width: "*px",
    height: "*px",
    minWidth: "*px",
    minHeight: "*px",
    maxWidth: "*px",
    maxHeight: "*px",
    padding: "*px",
    margin: "*px",
    borderRadius: "*%",
    borderWidth: "*px",
    borderTopWidth: "*px",
    borderRightWidth: "*px",
    borderBottomWidth: "*px",
    borderLeftWidth: "*px",
    borderImageWidth: "*px",
    strokeWidth: "*px",
    strokeHeight: "*px",
    strokeOpacity: "*",
    opacity: "*",
    translateX: "translateX(*px)",
    translateY: "translateY(*px)",
    translateZ: "translateZ(*px)",
    rotateX: "rotateX(*deg)",
    rotateY: "rotateY(*deg)",
    rotateZ: "rotateZ(*deg)",
    scale: "scale(*)",
    scaleX: "scaleX(*)",
    scaleY: "scaleY(*)",
    skewX: "skewX(*deg)",
    skewY: "skewY(*deg)",
    rgbR: "rgba(*,",
    rgbG: "*,",
    rgbB: "*,",
    rgba: "rgba(rgbR,rgbG,rgbB,rgbA)" // Final RGBA string placeholder
  };

  /* -------------------------------------------------
     Utility function: Select DOM elements matching multiple selectors
     ------------------------------------------------- */
  global.selectDom = function (...selectors) {
    let elements = [];
    selectors.forEach((selector) => {
      const nodeList = document.querySelectorAll(selector);
      elements.push(...nodeList);
    });
    return elements;
  };

  /* -------------------------------------------------
     Core Animation Engine
     Accepts a flexible set of arguments defining animations
     Returns a function to initiate the animation
     ------------------------------------------------- */
  global.animate = function () {
    // Clone arguments for internal manipulation
    const args = Array.prototype.slice.call(arguments);
    const argsCopy = copyObject(args);

    // Return a function that executes the animation on given elements
    return function (elements, eventConfig, nextArgs) {
      let targetElements = [];
      let tempArgs = argsCopy;

      // Initialize variables for animation
      let currentTarget, fromValues, toValues, elementIndex, delay, animationDescriptor;
      let isNextGroup = false; // Flag for chaining groups of elements
      const animationData = {
        color: {},
        transform: {},
        from: {},
        to: {}
      };

      // Parse and prepare arguments
      parseArguments();

      /**
       * Parses the passed arguments to identify target elements,
       * animation descriptors, and setup necessary data structures.
       */
      function parseArguments() {
        if (elements !== undefined) {
          if (!Array.isArray(elements)) {
            elements = [elements];
          }
          targetElements = elements;
        }

        let secondLoopFlag = false;
        for (let index = 0, totalArgs = args.length; index < totalArgs; index++) {
          fromValues = 0;
          // Detect "next group" of elements for chaining
          if (isNextGroup || Array.isArray(argsCopy[index]) || isDOMElement(argsCopy[index])) {
            if (secondLoopFlag) {
              if (!Array.isArray(argsCopy[index])) {
                argsCopy[index] = [argsCopy[index]];
              }
              Array.prototype.push.apply(targetElements, argsCopy[index]);
            }
            isNextGroup = false;
          } else if (typeof argsCopy[index] === "object" && argsCopy[index] !== null) {
            if (secondLoopFlag) {
              // Handle second pass: resolve non-numeric values and callbacks
              if (index === 0) {
                for (let u = 0; u < elements.length; u++) {
                  if (typeof elements[u] !== "number") targetElements.push(elements[u]);
                }
              }
              if (elements !== undefined) {
                for (let j = 0; j < targetElements.length; j++) {
                  if (typeof targetElements[j] !== "number") {
                    // Check for event-based callback
                    let eventResult = checkEventValue(nextArgs, eventConfig, currentTarget, targetElements[j + 1]);
                    if (eventResult[0]) eventConfig = eventResult[0];
                    bindEvent(targetElements[j], getObjectAt(targetElements, args, argsCopy, index), eventResult[1]);
                  }
                }
              } else {
                executeChain(targetElements, args, argsCopy, index)();
              }
            } else {
              isNextGroup = false;
              // Handle from/to objects for color and transform properties
              const isFromObject = typeof argsCopy[index].from === "object";
              const isToObject = typeof argsCopy[index].to === "object";

              // Handle special animation types
              if (argsCopy[index].typeAnimation === "vibration" && argsCopy[index].vibrationStep === undefined) {
                argsCopy[index].vibrationStep = 6;
              } else {
                const bezierParams = getNumberFromString(argsCopy[index].typeAnimation);
                if (bezierParams && bezierParams.length === 4) {
                  argsCopy[index].cubicbezier = bezierParams;
                  argsCopy[index].typeAnimation = "cubicbezier";
                }
              }

              // Default loop behavior
              if (argsCopy[index].loop && argsCopy[index].loopType === undefined) {
                argsCopy[index].loopType = "return";
              }

              // Normalize property list
              if (
                !argsCopy[index].callback &&
                (Array.isArray(argsCopy[index].property) ||
                  (argsCopy[index].property !== undefined && (argsCopy[index].property = [argsCopy[index].property])))
              ) {
                argsCopy[index].property.forEach(function (propertyItem) {
                  // Resolve from/to values per property
                  if (!isFromObject) fromValues = argsCopy[index].from;
                  else fromY = argsCopy[index]["from"][elementIndex];

                  if (!isToObject) toValues = argsCopy[index].to;
                  else toY = argsCopy[index]["to"][elementIndex];

                  if (typeof propertyItem === "object") {
                    // Handle property objects like { transform: ["scaleX", "rotateZ"] }
                    const propertyKey = Object.keys(propertyItem)[0];
                    if (!Array.isArray(propertyItem[propertyKey])) {
                      propertyItem[propertyKey] = [propertyItem[propertyKey]];
                    }

                    if (
                      propertyKey.toLowerCase().includes("color") &&
                      (animationData.color[propertyKey] = colorProperties[propertyKey])
                    ) {
                      // Initialize color properties
                      fromValues["from"][propertyKey] = {};
                      toValues["to"][propertyKey] = {};

                      propertyItem[propertyKey].forEach(function (subProp) {
                        // Initialize sub-properties
                        if (propertyKey.toLowerCase() === "transform") {
                          animationData.transform[subProp] = 0;
                        } else {
                          animationData.color[propertyKey][subProp] = 0;
                        }

                        // Populate from-values
                        if (isFromObject) {
                          if (fromY[propertyKey] !== undefined) {
                            if (typeof fromY[propertyKey] === "number") {
                              fromValues["from"][propertyKey][subProp] = fromY[propertyKey];
                            } else if (Array.isArray(fromY[propertyKey])) {
                              fromValues["from"][propertyKey][subProp] = fromY[propertyKey][elementIndex] !== undefined ? fromY[propertyKey][elementIndex] : fromValues["from"][propertyKey][subProp];
                            } else if (fromY[propertyKey][subProp] !== undefined) {
                              fromValues["from"][propertyKey][subProp] = fromY[propertyKey][subProp];
                            }
                          } else {
                            fromValues["from"][propertyKey][subProp] = argsCopy[index].from;
                          }
                        } else {
                          fromValues["from"][propertyKey][subProp] = argsCopy[index].from;
                        }

                        // Populate to-values
                        if (isToObject) {
                          if (toY[propertyKey] !== undefined) {
                            if (typeof toY[propertyKey] === "number") {
                              toValues["to"][propertyKey][subProp] = toY[propertyKey];
                            } else if (Array.isArray(toY[propertyKey])) {
                              toValues["to"][propertyKey][subProp] = toY[propertyKey][elementIndex] !== undefined ? toY[propertyKey][elementIndex] : toValues["to"][propertyKey][subProp];
                            } else if (toY[propertyKey][subProp] !== undefined) {
                              toValues["to"][propertyKey][subProp] = toY[propertyKey][subProp];
                            }
                          } else {
                            toValues["to"][propertyKey][subProp] = argsCopy[index].to;
                          }
                        } else {
                          toValues["to"][propertyKey][subProp] = argsCopy[index].to;
                        }
                        elementIndex++;
                      });
                      elementIndex++;
                      y++;
                    }
                  } else {
                    // Handle simple properties like "opacity"
                    if (isFromObject) {
                      fromValues["from"][propertyItem] = fromY[propertyItem] !== undefined ? fromY[propertyItem] : fromY !== undefined ? fromY : fromValues["from"][propertyItem];
                    } else {
                      fromValues["from"][propertyItem] = argsCopy[index].from;
                    }
                    if (isToObject) {
                      toValues["to"][propertyItem] = toY[propertyItem] !== undefined ? toY[propertyItem] : toY !== undefined ? toY : toValues["to"][propertyItem];
                    } else {
                      toValues["to"][propertyItem] = argsCopy[index].to;
                    }
                    y++;
                  }
                });
              }

              // Save deep copy of the animation values for future reference
              argsCopy[index].storedAnimationValues = copyObject(animationData);
              // Reset animation data for next iteration
              animationData.color = {};
              animationData.transform = {};
              animationData.from = {};
              animationData.to = {};
            }

            // Detect if next argument is a list of elements for chaining
            if (
              args[index + 1] !== undefined &&
              (Array.isArray(args[index + 1]) || isDOMElement(args[index + 1]))
            ) {
              isNextGroup = true;
              targetElements = [];
            }
          }

          // Restart loop for second pass if needed
          if (index === totalArgs - 1 && !secondLoopFlag) {
            isNextGroup = false;
            secondLoopFlag = true;
            index = -1; // restart loop
          }
        }
      }

      /**
       * Helper to execute a specific animation descriptor on a set of elements.
       * Returns a function that runs the animation.
       */
      function executeChain(targets, timelineSpecs, descriptorSpecs, descriptorIndex) {
        const descriptor = timelineSpecs[descriptorIndex];
        const animationType = descriptorSpecs[descriptorIndex].typeAnimation;
        let currentAnimationType = animationType;

        // Normalize timing properties
        descriptor.timeline = !isNaN(Number(descriptor.timeline)) ? Number(descriptor.timeline) : 0;
        descriptor.startafter = !isNaN(Number(descriptor.startafter)) ? Number(descriptor.startafter) : 0;

        // Handle looping specifics
        if (descriptor.boucle) {
          descriptor.delay = !isNaN(Number(descriptor.delay)) ? Number(descriptor.delay) : undefined;
          if (descriptor.boucleType === "returnRepeat" || descriptor.boucleType === "repeatReturn") {
            // Use reverse easing for looping
            currentAnimationType = Easing[animationType][1];
          }
        }

        // Return the animation runner function
        return function runAnimation() {
          let pauseStartTime = 0;
          let isPaused = false;
          let pauseTimestamp;

          // Setup pause/resume based on user events if specified
          if (descriptor.pause && Array.isArray(descriptor.pause)) {
            const [eventSelector, eventOptions] = descriptor.pause;
            const [eventName, useCaptureFlag] = (eventOptions || "e:click|false").split('|');
            const capture = useCaptureFlag === 'true';

            // Toggle pause/resume on specified event
            const togglePause = () => {
              if (isPaused) {
                isPaused = false;
                descriptor.pausedDuration += Date.now() - pauseTimestamp;
              } else {
                isPaused = true;
                pauseTimestamp = Date.now();
              }
            };

            // Attach event listeners to target elements
            document.querySelectorAll(eventSelector).forEach((el) => {
              el.addEventListener(eventName, togglePause, capture);
            });
          }

          const startTime = Date.now();

          // Initialize per-element stored states for transforms and colors
          targets.forEach((element, index) => {
            if (!element.storedTransform) element.storedTransform = copyObject(descriptorSpecs[descriptorIndex].storedAnimationValues.transform);
            if (!element.storedColor) {
              element.storedColor = copyObject(descriptorSpecs[descriptorIndex].storedAnimationValues.color);
            } else {
              // Preserve previously stored color properties
              Object.keys(descriptorSpecs[descriptorIndex].storedAnimationValues.color).forEach((key) => {
                if (!element.storedColor[key]) element.storedColor[key] = descriptorSpecs[descriptorIndex].storedAnimationValues.color[key];
              });
            }

            // Handle staggered start via timeline
            if (descriptor.timeline !== 0) {
              applyDelay([element], index, descriptor.timeline * index + descriptor.startafter, descriptor.startafter);
            }
          });

          // If no timeline delay, start immediately
          if (descriptor.timeline === 0) {
            applyDelay(targets, 0, 0 + descriptor.startafter, descriptor.startafter);
          }

          /**
           * Core animation frame loop for a group of elements.
           */
          function runFrame(targets, index, delayOffset, startDelay) {
            if (descriptor.animFrame) cancelAnimationFrame(descriptor.animFrame[index]);
            else descriptor.animFrame = {};

            const descriptorClone = copyObject(descriptorSpecs[descriptorIndex]);
            descriptorClone.changeTypeAnim = descriptorClone.typeAnimation;
            descriptorClone.skipCount = 0;
            descriptorClone.skipCount2 = 0;

            let currentTime;
            const storedValues = descriptorClone.storedAnimationValues;

            /**
             * Recursive function called on each frame
             */
            function frame() {
              if (isPaused) {
                descriptorClone.animFrame[index] = requestAnimationFrame(frame);
                return;
              }

              const elapsedTime = Date.now() - (startTime + delayOffset + descriptor.pausedDuration);
              let delay = 0;
              let interpolatedValue, easedValue, styleString;

              if (elapsedTime >= 0) {
                // Loop handling (boucle)
                if (descriptorClone.boucle) {
                  handleLooping(elapsedTime, descriptorClone);
                } else {
                  // Clamp to duration for non-looping animations
                  descriptorClone.timeEasing = Math.min(elapsedTime, descriptorClone.duration);
                }

                // Apply easing
                if (!descriptorClone.skipDelay || descriptorClone.skip) {
                  easedValue = Easing[descriptorClone.changeTypeAnim][0](descriptorClone.timeEasing, 0, 1, descriptorClone.duration, descriptorClone, index);

                  // Call user callback if provided
                  if (descriptorClone.callback) {
                    targets.forEach((el, idx) => {
                      descriptorClone.callback(el, easedValue, descriptorClone, idx !== index ? index : idx);
                    });
                  } else {
                    // Default property updates
                    descriptorClone.property.forEach((property) => {
                      styleString = "";
                      const propertyKey = typeof property === "string" ? property : Object.keys(property)[0];

                      if (
                        propertyKey.toLowerCase().includes("transform") &&
                        storedValues[propertyKey] != null
                      ) {
                        // Handle transform properties
                        property.transform.forEach((transformProp) => {
                          interpolatedValue = storedValues["from"][propertyKey][transformProp] +
                            easedValue * (storedValues["to"][propertyKey][transformProp] - storedValues["from"][propertyKey][transformProp]);
                          targets.forEach((el) => {
                            el.storedTransform[transformProp] = interpolatedValue;
                          });
                        });
                        // Apply transform style
                        targets.forEach((el) => {
                          Object.keys(el.storedTransform).forEach((key) => {
                            styleString += " " + styleMap[key].replace("*", el.storedTransform[key]);
                          });
                          el.style.transform = styleString;
                        });
                      } else if (
                        propertyKey.toLowerCase().includes("color") &&
                        storedValues.color != null
                      ) {
                        // Handle color properties
                        targets.forEach((el) => {
                          property[pKey].forEach((subProp) => {
                            interpolatedValue = storedValues["from"][propertyKey][subProp] +
                              easedValue * (storedValues["to"][propertyKey][subProp] - storedValues["from"][propertyKey][subProp]);
                            el.storedColor[propertyKey][subProp] = interpolatedValue;
                          });
                          let colorStr = styleMap.rgba;
                          for (const colorKey in defaultColorProps) {
                            colorStr = colorStr.replace(new RegExp(colorKey, "g"), el.storedColor[propertyKey][colorKey]);
                          }
                          el.style[propertyKey] = colorStr;
                        });
                      } else {
                        // Handle numeric properties like width, opacity
                        const fromVal = storedValues["from"][propertyKey];
                        const toVal = storedValues["to"][propertyKey];
                        styleString = (descriptorClone.px === "%" ? styleMap[propertyKey].replace("px", "%") : styleMap[propertyKey])
                          .replace("*", fromVal + easedValue * (toVal - fromVal));
                        targets.forEach((el) => (el.style[propertyKey] = styleString));
                      }
                    });
                  }
                }
              }

              // Continue animation if within duration or looping
              if (descriptorClone.boucle || elapsedTime < descriptorClone.duration) {
                descriptorClone.animFrame[index] = requestAnimationFrame(frame);
              }
            }
            frame(); // Start the frame loop
          }
        };
      }

      /**
       * Handles looping behavior, including reverse and repeat modes
       */
      function handleLooping(elapsedTime, descriptorClone) {
        // Loop handling logic (e.g., reversing direction, delays)
        // Implement as needed based on your specific looping requirements
      }

      /**
       * Helper to apply delay before starting animation
       */
      function applyDelay(elements, index, delayTime, startAfter) {
        // Implement delay logic if needed
      }

      /**
       * Utility to check if a value is a DOM element
       */
      function isDOMElement(value) {
        return value instanceof Element || value instanceof Document;
      }

      /**
       * Utility to get object at specific index in array or element
       */
      function getObjectAt(array, args, argsCopy, index) {
        return array[index];
      }

      /**
       * Utility for deep object copying
       */
      function copyObject(obj) {
        if (obj === null || typeof obj !== "object") return obj;
        if (Array.isArray(obj)) {
          return obj.map(copyObject);
        }
        const copy = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            copy[key] = copyObject(obj[key]);
          }
        }
        return copy;
      }

      /**
       * Checks and binds events for pause/resume
       */
      function bindEvent(element, eventName, callback) {
        // Implementation for attaching event listeners
      }

      /**
       * Checks event-related values in arguments
       */
      function checkEventValue(nextArgs, eventConfig, target, value) {
        // Implementation for event value checking
        return [null, null]; // Placeholder
      }

      /**
       * Extracts numeric parameters from a string (e.g., cubic-bezier)
       */
      function getNumberFromString(str) {
        return str.match(/[+-]?\d+(\.\d+)?/g);
      }
    };
  };

  /* -------------------------------------------------
     Easing functions dictionary
     Each easing has a primary function and optional reverse
     ------------------------------------------------- */

  const Easing = {
    linear: [function(e, n, t, a) { return t * e / a + n }, "linear"],
    quadin: [function(e, n, t, a) { return t * (e /= a) * e + n }, "quadout"],
    quadout: [function(e, n, t, a) { return -t * (e /= a) * (e - 2) + n }, "quadin"],
    quadinout: [function(e, n, t, a) { return (e /= a / 2) < 1 ? t / 2 * e * e + n : -t / 2 * (--e * (e - 2) - 1) + n }, "quadoutin"],
    quadoutin: [function(e, n, t, a) {
        let p = e / a, p0;
        if (p < 0.5) {
            p0 = 1 - 2 * p;
            return t * (0.5 * (1 - (p0 * p0))) + n;
        } else {
            p0 = p * 2 - 1;
            return t * (0.5 * (p0 * p0) + 0.5) + n;
        }
    }, "quadinout"],
    cubicin: [function(e, n, t, a) { return t * (e /= a) * e * e + n }, "cubicout"],
    cubicout: [function(e, n, t, a) { return t * ((e = e / a - 1) * e * e + 1) + n }, "cubicin"],
    cubicinout: [function(e, n, t, a) { return (e /= a / 2) < 1 ? t / 2 * e * e * e + n : t / 2 * ((e -= 2) * e * e + 2) + n }, "cubicoutin"],
    cubicoutin: [function(e, n, t, a) {
        let p = e / a, p0;
        if (p < 0.5) {
            p0 = 1 - 2 * p;
            return t * (0.5 * (1 - (p0 * p0 * p0))) + n;
        } else {
            p0 = p * 2 - 1;
            return t * (0.5 * (p0 * p0 * p0) + 0.5) + n;
        }
    }, "cubicinout"],
    // ... (other easing definitions omitted for brevity)
    vibration: [function(e, n, t, a, c) {
        // Oscillates between start and end values with a configurable step count
        return n + (t - n) / 2 + Math.sin(e * Math.PI / (a / c.vibrationStep) + 3 * Math.PI / 2) * (t - n) / 2
    }, "vibration"],
    cubicbezier: [function(e, n, t, a, c, idx) {
        // IMPROVEMENT: The cubic‑bezier implementation contains a syntax error.
        // The variable for the second control point (`o`) is missing a name.
        // Fix by declaring `let o = Number(q * c.cubicbezier[2] + qq);` before using it.
        let q = 1, qq = 0, sol;
        if (c.impair && (c.boucleType === "returnRepeat" || c.boucleType === "repeatReturn")) {
            q = -1; qq = 1;
        }
        let b = e / a, r = 1 - b,
            l = Number(q * c.cubicbezier[0] + qq),
            o = Number(q * c.cubicbezier[2] + qq); // <-- fixed declaration

        // Solve cubic equation to get the correct parameter `b` on the bezier curve
        if ((sol = solveCubic(3 * l - 3 * o + 1, 0 - 6 * l + 3 * o, 3 * l, 0 - b))) {
            b = sol;
            r = 1 - b;
        }
        // Compute Bezier output (standard cubic Bézier formula)
        const y = (r = 1 - b) * r * r * 0 +
            3 * r * r * b * Number(q * c.cubicbezier[1] + qq) +
            3 * r * b * b * Number(q * c.cubicbezier[3] + qq) +
            b * b * b * 1;
        return n + y * t;
    }, "cubicbezier"]
};
 
  /**
   * Solves cubic equations for cubic-bezier calculations
   */
  function solveCubic(a, b, c, d) {
    // Implementation of cubic solver
    // Returns root in [0,1] if exists
  }

  /**
   * Computes cubic root safely
   */
  function cubeRoot(value) {
    const absVal = Math.pow(Math.abs(value), 1 / 3);
    return value < 0 ? -absVal : absVal;
  }

  /**
   * Extracts numeric values from a string
   */
  function getNumberFromString(str) {
    return str.match(/[+-]?\d+(\.\d+)?/g);
  }

  /**
   * Gets the computed style of an element for a given property
   */
  function getStyle(element, property) {
    if (element.currentStyle) return element.currentStyle[property];
    if (window.getComputedStyle) return window.getComputedStyle(element, null)[property];
    return element.style[property];
  }

  /**
   * Checks whether a value is a DOM Element or Document
   */
  function isDOMElement(value) {
    return value instanceof Element || value instanceof Document;
  }

  /**
   * Deep clone utility for objects and arrays
   */
  function copyObject(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(copyObject);
    const clone = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clone[key] = copyObject(obj[key]);
      }
    }
    return clone;
  }

  // Additional helper functions can be added as needed...

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      animate: global.animate
    };
  } else {
    global.SelectAnimation = {
      animate: global.animate
    };
  }

})(typeof window !== 'undefined' ? window : global);