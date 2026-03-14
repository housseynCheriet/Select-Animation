/* -------------------------------------------------------------------------
 * Select-Animation: A High-Performance JavaScript Animation Engine
 * Designed for fluid motion and organic UI transitions.
 * Version: v1
 * Author: Housseyn Cheriet
 * Copyright: ©2026 Housseyn Cheriet
 * License: MIT
 * ------------------------------------------------------------------------- */


 (function (global) {
    "use strict";

    // -----------------------------
    // requestAnimationFrame polyfill
    // Ensures consistent animation frame behavior across older browsers.
    // -----------------------------
    let _lastTime = 0;
    const _vendors = ["ms", "moz", "webkit", "o"];
    for (let i = 0; i < _vendors.length && !global.requestAnimationFrame; ++i) {
        global.requestAnimationFrame = global[_vendors[i] + "RequestAnimationFrame"];
        global.cancelAnimationFrame = global[_vendors[i] + "CancelAnimationFrame"] || global[_vendors[i] + "CancelRequestAnimationFrame"];
    }

    if (!global.requestAnimationFrame) {
        global.requestAnimationFrame = function (callback) {
            const currTime = new Date().getTime();
            const timeToCall = Math.max(0, 16 - (currTime - _lastTime));
            const id = global.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            _lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!global.cancelAnimationFrame) {
        global.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }

    // -----------------------------
    // Internal defaults and mappings
    // Color defaults and map from logical property -> CSS format.
    // -----------------------------
    const COLOR_DEFAULTS = { rgbR: 255, rgbG: 255, rgbB: 255, rgbA: 1 };

    const COLOR_PROPERTIES = {
        color: COLOR_DEFAULTS,
        background: COLOR_DEFAULTS,
        backgroundColor: COLOR_DEFAULTS,
        borderColor: COLOR_DEFAULTS
    };

    const PROPERTY_FORMAT_MAP = {
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
        rgba: "rgba(rgbR,rgbG,rgbB,rgbA)"
    };

    // -----------------------------
    // select: simple DOM selector utility
    // Returns flat array of matched elements given one or more selectors
    // Usage: select('.class', '#id')
    // -----------------------------
    const selectDom = function(...selectors) {
        const all = [];
        selectors.forEach(selector => {
            const nodeList = document.querySelectorAll(selector);
            all.push(...nodeList);
        });
        return all;
    };

    // -----------------------------
    // animate: animation factory
    // Accepts animation definitions and returns a runner function to start animations on targets.
    // -----------------------------
    const animate = function () {
        const definitions = arguments;
        const defsCopy = copyObj(definitions);

        return function (targets, primaryParam, runtimeContext) {
            let currentTargets, eventCheckResult, tmp, i, propIndex, fromItem, toItem, valFrom, valTo, t;
            let grouped = [];
            let runtimeGrouped = [];
            let expectNextGroup = false;
            let staging = { color: {}, transform: {}, from: {}, to: {} };

            buildPlan();

            function buildPlan() {
                if (targets !== undefined) {
                    if (!Array.isArray(targets)) targets = [targets];
                    runtimeGrouped = targets;
                }

                let secondPass = false;

                for (let c = 0, total = definitions.length; c < total; c++) {
                    propIndex = 0;
                    if (expectNextGroup || Array.isArray(defsCopy[c]) || isElement(defsCopy[c])) {
                        if (secondPass) {
                            Array.isArray(defsCopy[c]) || (defsCopy[c] = [defsCopy[c]]);
                            Array.prototype.push.apply(grouped, defsCopy[c]);
                        }
                        expectNextGroup = false;
                    } else if (typeof defsCopy[c] === 'object' && defsCopy[c] !== null) {
                        if (secondPass) {
                            if (c === 0) {
                                for (let u = 0; void 0 !== targets[u]; u++) {
                                    if (typeof targets[u] !== "number") grouped.push(targets[u]);
                                }
                            }
                            if (targets !== undefined) {
                                for (let j = 0; void 0 !== runtimeGrouped[j]; j++) {
                                    if (typeof runtimeGrouped[j] !== "number") {
                                        eventCheckResult = checkValEvent(runtimeContext, primaryParam, currentTargets, runtimeGrouped[j + 1]);
                                        if (eventCheckResult[0]) currentTargets = eventCheckResult[0];
                                        bindEvent(runtimeGrouped[j], runner(grouped, definitions, defsCopy, c), eventCheckResult[1]);
                                    }
                                }
                            } else {
                                runner(grouped, definitions, defsCopy, c)();
                            }
                        } else {
                            expectNextGroup = false;
                            const fromIsObject = typeof defsCopy[c].from === "object";
                            const toIsObject = typeof defsCopy[c].to === "object";

                            if (defsCopy[c].typeAnimation === "vibration" && defsCopy[c].vibrationStep === undefined) {
                                defsCopy[c].vibrationStep = 6;
                            } else {
                                t = getNumber(defsCopy[c].typeAnimation);
                                if (t && t.length === 4) {
                                    defsCopy[c].cubicbezier = t;
                                    defsCopy[c].typeAnimation = "cubicbezier";
                                }
                            }

                            if (defsCopy[c].boucle && defsCopy[c].boucleType === undefined) {
                                defsCopy[c].boucleType = "return";
                            }

                            if (!defsCopy[c].callback &&
                                (Array.isArray(defsCopy[c].property) || (defsCopy[c].property !== undefined && (defsCopy[c].property = [defsCopy[c].property])))) {
                                
                                defsCopy[c].property.forEach(function (propItem) {
                                    if (!fromIsObject) valFrom = defsCopy[c].from;
                                    else fromItem = defsCopy[c]["from"][propIndex];

                                    if (!toIsObject) valTo = defsCopy[c].to;
                                    else toItem = defsCopy[c]["to"][propIndex];

                                    if (typeof propItem === "object") {
                                        let propName = Object.keys(propItem)[0];
                                        if (!Array.isArray(propItem[propName])) propItem[propName] = [propItem[propName]];

                                        if ((propName.toLowerCase().indexOf("color") !== -1 && (staging.color[propName] = COLOR_PROPERTIES[propName])) ||
                                            propName.toLowerCase().indexOf("transform") !== -1) {
                                            
                                            let inner = 0;
                                            staging["from"][propName] = {};
                                            staging["to"][propName] = {};

                                            propItem[propName].forEach(function (innerProp) {
                                                if (propName.toLowerCase() === "transform") staging[propName][innerProp] = 0;
                                                else staging.color[propName][innerProp] = 0;

                                                if (fromIsObject) {
                                                    if (fromItem[propName] !== undefined) {
                                                        if (typeof fromItem[propName] === "number") {
                                                            valFrom = staging["from"][propName][innerProp] = fromItem[propName];
                                                        } else if (Array.isArray(fromItem[propName])) {
                                                            valFrom = staging["from"][propName][innerProp] = fromItem[propName][inner] !== undefined ? fromItem[propName][inner] : valFrom;
                                                        } else if (fromItem[propName][innerProp] !== undefined) {
                                                            valFrom = staging["from"][propName][innerProp] = fromItem[propName][innerProp];
                                                        }
                                                    } else {
                                                        staging["from"][propName][innerProp] = valFrom;
                                                    }
                                                } else {
                                                    staging["from"][propName][innerProp] = defsCopy[c].from;
                                                }

                                                if (toIsObject) {
                                                    if (toItem[propName] !== undefined) {
                                                        if (typeof toItem[propName] === "number") {
                                                            valTo = staging["to"][propName][innerProp] = toItem[propName];
                                                        } else if (Array.isArray(toItem[propName])) {
                                                            valTo = staging["to"][propName][innerProp] = toItem[propName][inner] !== undefined ? toItem[propName][inner] : valTo;
                                                        } else if (toItem[propName][innerProp] !== undefined) {
                                                            valTo = staging["to"][propName][innerProp] = toItem[propName][innerProp];
                                                        }
                                                    } else {
                                                        staging["to"][propName][innerProp] = valTo;
                                                    }
                                                } else {
                                                    staging["to"][propName][innerProp] = defsCopy[c].to;
                                                }
                                                inner++;
                                            });
                                            propIndex++;
                                        }
                                    } else {
                                        if (fromIsObject) {
                                            valFrom = staging["from"][propItem] = fromItem[propItem] !== undefined ? fromItem[propItem] : (fromItem !== undefined ? fromItem : valFrom);
                                        } else {
                                            staging["from"][propItem] = defsCopy[c].from;
                                        }

                                        if (toIsObject) {
                                            valTo = staging["to"][propItem] = toItem[propItem] !== undefined ? toItem[propItem] : (toItem !== undefined ? toItem : valTo);
                                        } else {
                                            staging["to"][propItem] = defsCopy[c].to;
                                        }
                                        propIndex++;
                                    }
                                });
                            }
                            defsCopy[c].storeValueAnim = copyObj(staging);
                            staging = { color: {}, transform: {}, from: {}, to: {} };
                        }
                        if (definitions[c + 1] !== undefined && (Array.isArray(definitions[c + 1]) || isElement(definitions[c + 1]))) {
                            expectNextGroup = true;
                            grouped = [];
                        }
                    }
                    if (c === total - 1 && !secondPass) {
                        expectNextGroup = false;
                        secondPass = true;
                        c = -1;
                    }
                }
            }

            function runner(group, defs, defsCopyLocal, configIndex) {
                const conf = defs[configIndex];
                const declaredAnim = defsCopyLocal[configIndex].typeAnimation;
                let alternateAnim = declaredAnim;

                conf.timeline = !isNaN(Number(conf.timeline)) ? Number(conf.timeline) : 0;
                conf.startafter = !isNaN(Number(conf.startafter)) ? Number(conf.startafter) : 0;

                if (conf.boucle) {
                    conf.delay = !isNaN(Number(conf.delay)) ? Number(conf.delay) : undefined;
                    if (conf.boucleType === "returnRepeat" || conf.boucleType === "repeatReturn") {
                        alternateAnim = Easing[declaredAnim][1];
                    }
                }

                return function run(indexArg) {
                    let pausedAccum = 0;
                    let isPaused = false;
                    let pauseStart;

                    if (conf.pause && Array.isArray(conf.pause)) {
                        const eventCfg = conf.pause[1] || "e:click|false";
                        const parts = eventCfg.replace('e:', '').split('|');
                        const eventName = parts[0];
                        const useCapture = parts[1] === 'true';

                        const togglePause = function (e) {
                            if (e) {
                                if (isPaused) {
                                    isPaused = false;
                                    pausedAccum += Date.now() - pauseStart;
                                } else {
                                    isPaused = true;
                                    pauseStart = Date.now();
                                }
                            }
                        };

                        const targetEls = document.querySelectorAll(conf.pause[0]);
                        targetEls.forEach(el => el.addEventListener(eventName, togglePause, useCapture));
                    }

                    const startedAt = Date.now();

                    group.forEach(function (el, idx) {
                        if (!el.storeTransform) el.storeTransform = copyObj(defsCopyLocal[configIndex].storeValueAnim.transform);
                        if (!el.storeColor) {
                            el.storeColor = copyObj(defsCopyLocal[configIndex].storeValueAnim.color);
                        } else {
                            Object.keys(defsCopyLocal[configIndex].storeValueAnim.color).forEach(key => {
                                if (!el.storeColor[key]) el.storeColor[key] = defsCopyLocal[configIndex].storeValueAnim.color[key];
                            });
                        }

                        if (conf.timeline !== 0) {
                            frameRunner([el], idx, conf.timeline * idx + conf.startafter, conf.startafter);
                        }
                    });

                    if (conf.timeline === 0) {
                        frameRunner(group, 0, 0 + conf.startafter, conf.startafter);
                    }

                    function frameRunner(targetArray, idx, timeOffset, startAfter) {
                        if (conf.animFram) cancelAnimationFrame(conf.animFram[idx]);
                        else conf.animFram = {};

                        const iterConf = copyObj(defsCopyLocal[configIndex]);
                        iterConf.changetypeAnim = iterConf.typeAnimation;
                        iterConf.countSkip = 0;
                        iterConf.countSkip2 = 0;

                        let skipCounter;
                        const sv = iterConf.storeValueAnim;

                        function loop() {
                            if (isPaused) {
                                conf.animFram[idx] = requestAnimationFrame(loop);
                                return;
                            }

                            let delay = 0;
                            let eased, tmpVal, css;
                            const elapsed = Date.now() - (startedAt + timeOffset + pausedAccum);

                            if (elapsed >= 0) {
                                if (iterConf.boucle) {
                                    if (iterConf.delay !== undefined) {
                                        delay = iterConf.delay;
                                        skipCounter = Math.floor((elapsed + delay) / (iterConf.duration + delay));
                                        if (skipCounter !== iterConf.countSkip) {
                                            iterConf.countSkip = skipCounter;
                                            iterConf.skip = iterConf.skipDelay = true;
                                        } else {
                                            iterConf.skip = false;
                                            if (elapsed % (iterConf.duration + delay) < iterConf.duration) {
                                                iterConf.skipDelay = false;
                                                if (iterConf.countSkip2 !== iterConf.countSkip) {
                                                    iterConf.countSkip2 = iterConf.countSkip;
                                                    iterConf.skip2 = true;
                                                } else iterConf.skip2 = false;
                                            }
                                        }
                                    } else {
                                        skipCounter = Math.floor((elapsed + delay) / (iterConf.duration + delay));
                                        if (skipCounter !== iterConf.countSkip) {
                                            iterConf.countSkip = iterConf.countSkip2 = skipCounter;
                                            iterConf.skip = iterConf.skip2 = true;
                                        } else {
                                            iterConf.skip = iterConf.skip2 = false;
                                        }
                                    }

                                    iterConf.timeEasing = elapsed % (iterConf.duration + delay);
                                    if (iterConf.skip) {
                                        iterConf.impair = !iterConf.impair;
                                        iterConf.changetypeAnim = iterConf.impair ? alternateAnim : declaredAnim;
                                        iterConf.timeEasing = (iterConf.impair || iterConf.boucleType.indexOf("repeat") === 0) ? iterConf.duration : 0;
                                    } else if (!iterConf.skipDelay) {
                                        if (iterConf.impair && iterConf.boucleType.indexOf("return") === 0) {
                                            iterConf.timeEasing = iterConf.duration - iterConf.timeEasing;
                                        }
                                    }
                                } else {
                                    iterConf.timeEasing = elapsed < iterConf.duration ? elapsed : iterConf.duration;
                                }

                                if (!iterConf.skipDelay || iterConf.skip) {
                                    eased = Easing[iterConf.changetypeAnim][0](iterConf.timeEasing, 0, 1, iterConf.duration, iterConf, idx);

                                    if (iterConf.callback) {
                                        targetArray.forEach(function (el, index) {
                                            iterConf.callback(el, eased, iterConf, idx !== index ? idx : index);
                                        });
                                    } else {
                                        iterConf.property.forEach(function (prop) {
                                            css = "";
                                            let key = typeof prop === "string" ? prop : Object.keys(prop)[0];

                                            if (key.toLowerCase() === "transform" && sv[key] != null) {
                                                prop.transform.forEach(function (tr) {
                                                    tmpVal = sv["from"][key][tr] + eased * (sv["to"][key][tr] - sv["from"][key][tr]);
                                                    targetArray.forEach(el => el.storeTransform[tr] = tmpVal);
                                                });
                                                targetArray.forEach(function (el) {
                                                    Object.keys(el.storeTransform).forEach(k => {
                                                        css += " " + PROPERTY_FORMAT_MAP[k].replace("*", el.storeTransform[k]);
                                                    });
                                                    el.style.transform = css;
                                                    css = "";
                                                });
                                            } else if (key.toLowerCase().indexOf("color") !== -1 && sv.color != null) {
                                                targetArray.forEach(function (el) {
                                                    prop[key].forEach(function (colProp) {
                                                        tmpVal = sv["from"][key][colProp] + eased * (sv["to"][key][colProp] - sv["from"][key][colProp]);
                                                        el.storeColor[key][colProp] = tmpVal;
                                                    });

                                                    let colorStr = PROPERTY_FORMAT_MAP.rgba;
                                                    for (let colKey in COLOR_DEFAULTS) {
                                                        colorStr = colorStr.replace(new RegExp(colKey, "g"), el.storeColor[key][colKey]);
                                                    }
                                                    el.style[key] = colorStr;
                                                });
                                            } else {
                                                css = (iterConf.px === "%" ? PROPERTY_FORMAT_MAP[key].replace("px", "%") : PROPERTY_FORMAT_MAP[key]).replace("*", sv["from"][key] + eased * (sv["to"][key] - sv["from"][key]));
                                                targetArray.forEach(el => el.style[key] = css);
                                            }
                                        });
                                    }
                                }
                            }

                            if (iterConf.boucle || elapsed < iterConf.duration) {
                                conf.animFram[idx] = requestAnimationFrame(loop);
                            }
                        }

                        loop();
                    }
                };
            }
        };
    };

    // -----------------------------
    // Easing functions
    // Standard easing definitions used by the animation engine.
    // -----------------------------
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
        quartin: [function(e, n, t, a) { return t * (e /= a) * e * e * e + n }, "quartout"],
        quartout: [function(e, n, t, a) { return -t * ((e = e / a - 1) * e * e * e - 1) + n }, "quartin"],
        quartinout: [function(e, n, t, a) { return (e /= a / 2) < 1 ? t / 2 * e * e * e * e + n : -t / 2 * ((e -= 2) * e * e * e - 2) + n }, "quartoutin"],
        quartoutin: [function(e, n, t, a) {
            let p = e / a, p0;
            if (p < 0.5) {
                p0 = 1 - 2 * p;
                return t * (0.5 * (1 - (p0 * p0 * p0 * p0))) + n;
            } else {
                p0 = p * 2 - 1;
                return t * (0.5 * (p0 * p0 * p0 * p0) + 0.5) + n;
            }
        }, "quartinout"],
        quintin: [function(e, n, t, a) { return t * (e /= a) * e * e * e * e + n }, "quintout"],
        quintout: [function(e, n, t, a) { return t * ((e = e / a - 1) * e * e * e * e + 1) + n }, "quintin"],
        quintinout: [function(e, n, t, a) { return (e /= a / 2) < 1 ? t / 2 * e * e * e * e * e + n : t / 2 * ((e -= 2) * e * e * e * e + 2) + n }, "quintoutin"],
        quintoutin: [function(e, n, t, a) {
            let p = e / a, p0;
            if (p < 0.5) {
                p0 = 1 - 2 * p;
                return t * (0.5 * (1 - (p0 * p0 * p0 * p0 * p0))) + n;
            } else {
                p0 = p * 2 - 1;
                return t * (0.5 * (p0 * p0 * p0 * p0 * p0) + 0.5) + n;
            }
        }, "quintinout"],
        sinein: [function(e, n, t, a) { return -t * Math.cos(e / a * (Math.PI / 2)) + t + n }, "sineout"],
        sineout: [function(e, n, t, a) { return t * Math.sin(e / a * (Math.PI / 2)) + n }, "sinein"],
        sineinout: [function(e, n, t, a) { return -t / 2 * (Math.cos(Math.PI * e / a) - 1) + n }, "sineoutin"],
        sineoutin: [function(e, n, t, a) {
            let p = e / a, p0;
            if (p < 0.5) {
                p0 = 1 - 2 * p;
                return t * (0.5 * (1 - (1 - Math.cos(p0 * Math.PI / 2)))) + n;
            } else {
                p0 = p * 2 - 1;
                return t * (0.5 * (1 - Math.cos(p0 * Math.PI / 2)) + 0.5) + n;
            }
        }, "sineinout"],
        expoin: [function(e, n, t, a) { return 0 === e ? n : t * Math.pow(2, 10 * (e / a - 1)) + n }, "expoout"],
        expoout: [function(e, n, t, a) { return e === a ? n + t : t * (1 - Math.pow(2, -10 * e / a)) + n }, "expoin"],
        expoinout: [function(e, n, t, a) { return 0 === e ? n : e === a ? n + t : (e /= a / 2) < 1 ? t / 2 * Math.pow(2, 10 * (e - 1)) + n : t / 2 * (2 - Math.pow(2, -10 * --e)) + n }, "expooutin"],
        expooutin: [function(e, n, t, a) {
            let p = e / a, p0;
            if (p === 0) return n;
            else if (p === 1) return n + t;
            else if (p < 0.5) {
                p0 = 1 - 2 * p;
                return t * (0.5 * (1 - (Math.pow(2, 10 * (p0 - 1))))) + n;
            } else {
                p0 = p * 2 - 1;
                return t * (0.5 * (Math.pow(2, 10 * (p0 - 1))) + 0.5) + n;
            }
        }, "expoinout"],
        circin: [function(e, n, t, a) { return -t * (Math.sqrt(1 - (e /= a) * e) - 1) + n }, "circout"],
        circout: [function(e, n, t, a) { return t * Math.sqrt(1 - (e = e / a - 1) * e) + n }, "circin"],
        circinout: [function(e, n, t, a) { return (e /= a / 2) < 1 ? -t / 2 * (Math.sqrt(1 - e * e) - 1) + n : t / 2 * (Math.sqrt(1 - (e -= 2) * e) + 1) + n }, "circoutin"],
        circoutin: [function(e, n, t, a) {
            let p = e / a, p0;
            if (p < 0.5) {
                p0 = 1 - 2 * p;
                return t * (0.5 * Math.sqrt(1 - p0 * p0)) + n;
            } else {
                p0 = p * 2 - 1;
                return t * (0.5 * (1 - Math.sqrt(1 - p0 * p0)) + 0.5) + n;
            }
        }, "circinout"],
        elasticin: [function(e, n, t, a) {
            let c = 1.70158, b = 0, r = t;
            return 0 === e ? n : 1 === (e /= a) ? n + t : (b = b || .3 * a, c = r < Math.abs(t) ? (r = t, b / 4) : b / (2 * Math.PI) * Math.asin(t / r), -(r * Math.pow(2, 10 * --e) * Math.sin((e * a - c) * (2 * Math.PI) / b)) + n)
        }, "elasticout"],
        elasticout: [function(e, n, t, a) {
            let c = 1.70158, b = 0, r = t;
            return 0 === e ? n : 1 === (e /= a) ? n + t : (b = b || .3 * a, c = r < Math.abs(t) ? (r = t, b / 4) : b / (2 * Math.PI) * Math.asin(t / r), r * Math.pow(2, -10 * e) * Math.sin((e * a - c) * (2 * Math.PI) / b) + t + n)
        }, "elasticin"],
        elasticinout: [function(e, n, t, a) {
            let c = 1.70158, b = 0, r = t;
            return 0 === e ? n : 2 === (e /= a / 2) ? n + t : (b = b || a * (.3 * 1.5), c = r < Math.abs(t) ? (r = t, b / 4) : b / (2 * Math.PI) * Math.asin(t / r), e < 1 ? r * Math.pow(2, 10 * --e) * Math.sin((e * a - c) * (2 * Math.PI) / b) * -.5 + n : r * Math.pow(2, -10 * --e) * Math.sin((e * a - c) * (2 * Math.PI) / b) * .5 + t + n)
        }, "elasticoutin"],
        elasticoutin: [function(e, n, t, a) {
            let p = e / a, p0;
            if (p === 0) return n;
            else if (p === 1) return t + n;
            
            if (p < 0.5) {
                p0 = 1 - 2 * p;
                return t * (0.5 * (1 - (-Math.pow(2, 8 * (p0 - 1)) * Math.sin(((p0 - 1) * 80 - 7.5) * Math.PI / 15)))) + n;
            } else {
                p0 = p * 2 - 1;
                return t * (0.5 * (-Math.pow(2, 8 * (p0 - 1)) * Math.sin(((p0 - 1) * 80 - 7.5) * Math.PI / 15)) + 0.5) + n
            }
        }, "elasticinout"],
        backin: [function(e, n, t, a) { return t * (e /= a) * e * (2.70158 * e - 1.70158) + n }, "backout"],
        backout: [function(e, n, t, a) { return t * ((e = e / a - 1) * e * (2.70158 * e + 1.70158) + 1) + n }, "backin"],
        backinout: [function(e, n, t, a) {
            let c = 1.70158;
            return (e /= a / 2) < 1 ? t / 2 * (e * e * ((1 + (c *= 1.525)) * e - c)) + n : t / 2 * ((e -= 2) * e * ((1 + (c *= 1.525)) * e + c) + 2) + n
        }, "backoutin"],
        backoutin: [function(e, n, t, a) {
            let p = e / a, p0;
            if (p < 0.5) {
                p0 = 1 - 2 * p;
                return t * (0.5 * (1 - p0 * p0 * (3 * p0 - 2))) + n;
            } else {
                p0 = p * 2 - 1;
                return t * (0.5 * p0 * p0 * (3 * p0 - 2) + 0.5) + n;
            }
        }, "backinout"],
        bouncein: [function(e, n, t, a) { return t - Easing.bounceout[0](a - e, 0, t, a) + n }, "bounceout"],
        bounceout: [function(e, n, t, a) {
            return (e /= a) < 1 / 2.75 ? t * (7.5625 * e * e) + n : e < 2 / 2.75 ? t * (7.5625 * (e -= 1.5 / 2.75) * e + .75) + n : e < 2.5 / 2.75 ? t * (7.5625 * (e -= 2.25 / 2.75) * e + .9375) + n : t * (7.5625 * (e -= 2.625 / 2.75) * e + .984375) + n
        }, "bouncein"],
        bounceinout: [function(e, n, t, a) {
            return e < a / 2 ? .5 * Easing.bouncein[0](2 * e, 0, t, a) + n : .5 * Easing.bounceout[0](2 * e - a, 0, t, a) + .5 * t + n
        }, "bounceoutin"],
        bounceoutin: [function(e, n, t, a) {
            let p = e / a, p0, pow2, bounce = 4;
            if (p < 0.5) {
                p0 = 1 - 2 * p;
                while (p0 < ((pow2 = Math.pow(2, --bounce)) - 1) / 11) {}
                return t * (0.5 * (1 - (1 / Math.pow(4, 3 - bounce) - 7.5625 * Math.pow((pow2 * 3 - 2) / 22 - p0, 2)))) + n;
            } else {
                p0 = p * 2 - 1;
                while (p0 < ((pow2 = Math.pow(2, --bounce)) - 1) / 11) {}
                return t * (0.5 * (1 / Math.pow(4, 3 - bounce) - 7.5625 * Math.pow((pow2 * 3 - 2) / 22 - p0, 2) + 0.5)) + n;
            }
        }, "bounceinout"],
        vibration: [function(e, n, t, a, c) {
            return n + (t - n) / 2 + Math.sin(e * Math.PI / (a / c.vibrationStep) + 3 * Math.PI / 2) * (t - n) / 2
        }, "vibration"],
        cubicbezier: [function(e, n, t, a, c, idx) {
            let q = 1, qq = 0, sol;
            if (c.impair && (c.boucleType === "returnRepeat" || c.boucleType === "repeatReturn")) {
                q = -1; qq = 1;
            }
            let b = e / a, r = 1 - b,
                l = Number(q * c.cubicbezier[0] + qq),
                o = Number(q * c.cubicbezier[2] + qq);
                
            if ((sol = solveCubic(3 * l - 3 * o + 1, 0 - 6 * l + 3 * o, 3 * l, 0 - b))) {
                b = sol;
                r = 1 - b;
            }
            let y = (r = 1 - b) * r * r * 0 + 3 * r * r * b * Number(q * c.cubicbezier[1] + qq) + 3 * r * b * b * Number(q * c.cubicbezier[3] + qq) + b * b * b * 1;
            return n + y * t;
        }, "cubicbezier"]
    };

    // The rest of easing functions identical to original (unchanged for correctness)
    // (For brevity in this file view we keep the full Easing object above in the same form as original.)

    // -----------------------------
    // Math helpers: cubic solver and cube root
    // -----------------------------
    function solveCubic(a, b, c, d) {
        let p = (3 * a * c - b * b) / (3 * a * a);
        let q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
        let r;

        if (Math.abs(p) < 1e-8) {
            if ((r = cubeRoot(-q) - b / (3 * a)) <= 1 && r >= 0) return r;
        } else if (Math.abs(q) < 1e-8) {
            if (((r = Math.sqrt(-p) - b / (3 * a)) <= 1 && r >= 0) || ((r = -Math.sqrt(-p) - b / (3 * a)) <= 1 && r >= 0)) return r;
            else return 0;
        } else {
            let D = q * q / 4 + p * p * p / 27;
            if (Math.abs(D) < 1e-8) {
                if (((r = -1.5 * q / p - b / (3 * a)) <= 1 && r >= 0) || ((r = 3 * q / p - b / (3 * a)) <= 1 && r >= 0)) return r;
            } else if (D > 0) {
                let u = cubeRoot(-q / 2 - Math.sqrt(D));
                if ((r = (u - p / (3 * u)) - b / (3 * a)) <= 1 && r >= 0) return r;
            } else {
                let u = 2 * Math.sqrt(-p / 3);
                let t = Math.acos(3 * q / p / u) / 3;
                let k = 2 * Math.PI / 3;
                if (((r = u * Math.cos(t) - b / (3 * a)) <= 1 && r >= 0) || ((r = u * Math.cos(t - k) - b / (3 * a)) <= 1 && r >= 0) || ((r = u * Math.cos(t - 2 * k) - b / (3 * a)) <= 1 && r >= 0)) return r;
            }
        }
    }

    function cubeRoot(v) {
        let n = Math.pow(Math.abs(v), 1 / 3);
        return v < 0 ? -n : n;
    }

    // -----------------------------
    // Utilities: getNumber, getStyle, isElement, copyObj
    // -----------------------------
    function getNumber(str) {
        return (str || '').match(/[+-]?\d+(\.\d+)?/g);
    }

    function getStyle(el, cssprop) {
        if (el.currentStyle) return el.currentStyle[cssprop];
        else if (document.defaultView && document.defaultView.getComputedStyle) return document.defaultView.getComputedStyle(el, "")[cssprop];
        else return el.style[cssprop];
    }

    function isElement(element) {
        return element instanceof Element || element instanceof HTMLDocument;
    }

    const copyObj = function(obj) {
        let ret;
        const assign = function(o, key, target) {
            let sub = Object.prototype.toString.call(o[key]);
            if (sub === "[object Object]" || sub === "[object Array]") {
                target[key] = copyObj(o[key]);
            } else {
                target[key] = o[key];
            }
        };

        if (Object.prototype.toString.call(obj) === "[object Object]") {
            ret = {};
            for (let key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    assign(obj, key, ret);
                }
            }
        } else if (Object.prototype.toString.call(obj) === "[object Array]") {
            ret = [];
            for (let i = 0; i < obj.length; i++) {
                assign(obj, i, ret);
            }
        } else {
            ret = obj;
        }
        return ret;
    };

    // Expose both for browser and Node/npm consumers
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
          animate,
          selectDom,
          copyObj
        };
    }

    if (typeof global !== 'undefined') {
        global.animate = animate;
        global.selectDom = selectDom;
        global.copyObj = copyObj;
    }

})(typeof window !== 'undefined' ? window : this);