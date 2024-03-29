/* Partytown 0.4.5 - MIT builder.io */
(window => {
    const isPromise = v => "object" == typeof v && v && v.then;
    const noop = () => {};
    const len = obj => obj.length;
    const getConstructorName = obj => {
        try {
            return obj.constructor.name;
        } catch (e) {}
        return "";
    };
    const startsWith = (str, val) => str.startsWith(val);
    const isValidMemberName = memberName => !(startsWith(memberName, "webkit") || startsWith(memberName, "toJSON") || startsWith(memberName, "constructor") || startsWith(memberName, "toString") || startsWith(memberName, "_"));
    const randomId = () => Math.round(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
    const htmlConstructorTags = {
        Anchor: "a",
        DList: "dl",
        Image: "img",
        OList: "ol",
        Paragraph: "p",
        Quote: "q",
        TableCaption: "caption",
        TableCell: "td",
        TableCol: "colgroup",
        TableRow: "tr",
        TableSection: "tbody",
        UList: "ul"
    };
    const svgConstructorTags = {
        Graphics: "g",
        SVG: "svg"
    };
    const InstanceIdKey = Symbol();
    const CreatedKey = Symbol();
    const instances = new Map;
    const mainRefs = new Map;
    const winCtxs = {};
    const windowIds = new WeakMap;
    const getAndSetInstanceId = (instance, instanceId) => {
        if (instance) {
            if (instanceId = windowIds.get(instance)) {
                return instanceId;
            }
            (instanceId = instance[InstanceIdKey]) || setInstanceId(instance, instanceId = randomId());
            return instanceId;
        }
    };
    const getInstance = (winId, instanceId, win, doc, docId) => {
        if ((win = winCtxs[winId]) && win.$window$) {
            if (winId === instanceId) {
                return win.$window$;
            }
            doc = win.$window$.document;
            docId = instanceId.split(".").pop();
            if ("d" === docId) {
                return doc;
            }
            if ("e" === docId) {
                return doc.documentElement;
            }
            if ("h" === docId) {
                return doc.head;
            }
            if ("b" === docId) {
                return doc.body;
            }
        }
        return instances.get(instanceId);
    };
    const setInstanceId = (instance, instanceId, now) => {
        if (instance) {
            instances.set(instanceId, instance);
            instance[InstanceIdKey] = instanceId;
            instance[CreatedKey] = now = Date.now();
            if (now > lastCleanup + 5e3) {
                instances.forEach(((storedInstance, instanceId) => {
                    storedInstance[CreatedKey] < lastCleanup && storedInstance.nodeType && !storedInstance.isConnected && instances.delete(instanceId);
                }));
                lastCleanup = now;
            }
        }
    };
    let lastCleanup = 0;
    const mainWindow = window.parent;
    const doc = document;
    const config = mainWindow.partytown || {};
    const libPath = (config.lib || "/~partytown/") + "debug/";
    const logMain = msg => {
        console.debug.apply(console, [ "%cMain 🌎", "background: #717171; color: white; padding: 2px 3px; border-radius: 2px; font-size: 0.8em;", msg ]);
    };
    const winIds = [];
    const normalizedWinId = winId => {
        winIds.includes(winId) || winIds.push(winId);
        return winIds.indexOf(winId) + 1;
    };
    const serializeForWorker = ($winId$, value, added, type, cstrName) => void 0 !== value && (type = typeof value) ? "string" === type || "number" === type || "boolean" === type || null == value ? [ 0, value ] : "function" === type ? [ 6 ] : (added = added || new Set) && Array.isArray(value) ? added.has(value) ? [ 1, [] ] : added.add(value) && [ 1, value.map((v => serializeForWorker($winId$, v, added))) ] : "object" === type ? "" === (cstrName = getConstructorName(value)) ? [ 2, {} ] : "Window" === cstrName ? [ 3, [ $winId$, $winId$ ] ] : "HTMLCollection" === cstrName || "NodeList" === cstrName ? [ 7, Array.from(value).map((v => serializeForWorker($winId$, v, added)[1])) ] : cstrName.endsWith("Event") ? [ 5, serializeObjectForWorker($winId$, value, added) ] : "CSSRuleList" === cstrName ? [ 12, Array.from(value).map(serializeCssRuleForWorker) ] : startsWith(cstrName, "CSS") && cstrName.endsWith("Rule") ? [ 11, serializeCssRuleForWorker(value) ] : "CSSStyleDeclaration" === cstrName ? [ 13, serializeObjectForWorker($winId$, value, added) ] : "Attr" === cstrName ? [ 10, [ value.name, value.value ] ] : value.nodeType ? [ 3, [ $winId$, getAndSetInstanceId(value), value.nodeName ] ] : [ 2, serializeObjectForWorker($winId$, value, added, true, true) ] : void 0 : value;
    const serializeObjectForWorker = (winId, obj, added, includeFunctions, includeEmptyStrings, serializedObj, propName, propValue) => {
        serializedObj = {};
        if (!added.has(obj)) {
            added.add(obj);
            for (propName in obj) {
                if (isValidMemberName(propName)) {
                    propValue = obj[propName];
                    (includeFunctions || "function" != typeof propValue) && (includeEmptyStrings || "" !== propValue) && (serializedObj[propName] = serializeForWorker(winId, propValue, added));
                }
            }
        }
        return serializedObj;
    };
    const serializeCssRuleForWorker = cssRule => {
        let obj = {};
        let key;
        for (key in cssRule) {
            validCssRuleProps.includes(key) && (obj[key] = String(cssRule[key]));
        }
        return obj;
    };
    const deserializeFromWorker = (worker, serializedTransfer, serializedType, serializedValue) => {
        if (serializedTransfer) {
            serializedType = serializedTransfer[0];
            serializedValue = serializedTransfer[1];
            return 0 === serializedType ? serializedValue : 4 === serializedType ? deserializeRefFromWorker(worker, serializedValue) : 1 === serializedType ? serializedValue.map((v => deserializeFromWorker(worker, v))) : 3 === serializedType ? getInstance(serializedValue[0], serializedValue[1]) : 5 === serializedType ? constructEvent(deserializeObjectFromWorker(worker, serializedValue)) : 2 === serializedType ? deserializeObjectFromWorker(worker, serializedValue) : 8 === serializedType ? serializedValue : 9 === serializedType ? new window[serializedTransfer[2]](serializedValue) : void 0;
        }
    };
    const deserializeRefFromWorker = (worker, {$winId$: $winId$, $instanceId$: $instanceId$, $refId$: $refId$}, ref) => {
        ref = mainRefs.get($refId$);
        if (!ref) {
            ref = function(...args) {
                worker.postMessage([ 7, {
                    $winId$: $winId$,
                    $instanceId$: $instanceId$,
                    $refId$: $refId$,
                    $thisArg$: serializeForWorker($winId$, this),
                    $args$: serializeForWorker($winId$, args)
                } ]);
            };
            mainRefs.set($refId$, ref);
        }
        return ref;
    };
    const constructEvent = eventProps => new ("detail" in eventProps ? CustomEvent : Event)(eventProps.type, eventProps);
    const deserializeObjectFromWorker = (worker, serializedValue, obj, key) => {
        obj = {};
        for (key in serializedValue) {
            obj[key] = deserializeFromWorker(worker, serializedValue[key]);
        }
        return obj;
    };
    const validCssRuleProps = "cssText,selectorText,href,media,namespaceURI,prefix,name,conditionText".split(",");
    const mainAccessHandler = async (worker, accessReq) => {
        let accessRsp = {
            $msgId$: accessReq.$msgId$
        };
        let totalTasks = len(accessReq.$tasks$);
        let i = 0;
        let task;
        let winId;
        let applyPath;
        let instance;
        let rtnValue;
        let isLast;
        for (;i < totalTasks; i++) {
            try {
                isLast = i === totalTasks - 1;
                task = accessReq.$tasks$[i];
                winId = task.$winId$;
                applyPath = task.$applyPath$;
                !winCtxs[winId] && winId.startsWith("f_") && await new Promise((resolve => {
                    let check = 0;
                    let callback = () => {
                        winCtxs[winId] || check++ > 1e3 ? resolve() : requestAnimationFrame(callback);
                    };
                    callback();
                }));
                if (1 === applyPath[0] && applyPath[1] in winCtxs[winId].$window$) {
                    setInstanceId(new winCtxs[winId].$window$[applyPath[1]](...deserializeFromWorker(worker, applyPath[2])), task.$instanceId$);
                } else {
                    instance = getInstance(winId, task.$instanceId$);
                    if (instance) {
                        rtnValue = applyToInstance(worker, instance, applyPath, isLast, task.$groupedGetters$);
                        task.$assignInstanceId$ && ("string" == typeof task.$assignInstanceId$ ? setInstanceId(rtnValue, task.$assignInstanceId$) : winCtxs[task.$assignInstanceId$.$winId$] = {
                            $winId$: task.$assignInstanceId$.$winId$,
                            $window$: {
                                document: rtnValue
                            }
                        });
                        if (isPromise(rtnValue)) {
                            rtnValue = await rtnValue;
                            accessRsp.$isPromise$ = true;
                        }
                        accessRsp.$rtnValue$ = serializeForWorker(winId, rtnValue);
                    } else {
                        accessRsp.$error$ = `Error finding instance "${task.$instanceId$}" on window ${normalizedWinId(winId)}`;
                        console.error(accessRsp.$error$, task);
                    }
                }
            } catch (e) {
                isLast ? accessRsp.$error$ = String(e.stack || e) : console.error(e);
            }
        }
        return accessRsp;
    };
    const applyToInstance = (worker, instance, applyPath, isLast, groupedGetters) => {
        let i = 0;
        let l = len(applyPath);
        let next;
        let current;
        let previous;
        let args;
        let groupedRtnValues;
        for (;i < l; i++) {
            current = applyPath[i];
            next = applyPath[i + 1];
            previous = applyPath[i - 1];
            try {
                if (!Array.isArray(next)) {
                    if ("string" == typeof current || "number" == typeof current) {
                        if (i + 1 === l && groupedGetters) {
                            groupedRtnValues = {};
                            groupedGetters.map((propName => groupedRtnValues[propName] = instance[propName]));
                            return groupedRtnValues;
                        }
                        instance = instance[current];
                    } else {
                        if (0 === next) {
                            instance[previous] = deserializeFromWorker(worker, current);
                            return;
                        }
                        if ("function" == typeof instance[previous]) {
                            args = deserializeFromWorker(worker, current);
                            "insertRule" === previous && args[1] > len(instance.cssRules) && (args[1] = len(instance.cssRules));
                            instance = instance[previous].apply(instance, args);
                            if ("play" === previous) {
                                return Promise.resolve();
                            }
                        }
                    }
                }
            } catch (err) {
                if (isLast) {
                    throw err;
                }
                console.debug("Non-blocking setter error:", err);
            }
        }
        return instance;
    };
    const registerWindow = (worker, $winId$, $window$) => {
        if (!windowIds.has($window$)) {
            windowIds.set($window$, $winId$);
            const doc = $window$.document;
            const history = $window$.history;
            const $parentWinId$ = windowIds.get($window$.parent);
            const sendInitEnvData = () => worker.postMessage([ 3, {
                $winId$: $winId$,
                $parentWinId$: $parentWinId$,
                $url$: doc.baseURI,
                $visibilityState$: doc.visibilityState
            } ]);
            const pushState = history.pushState.bind(history);
            const replaceState = history.replaceState.bind(history);
            const onLocationChange = () => setTimeout((() => worker.postMessage([ 11, $winId$, doc.baseURI ])));
            history.pushState = (data, _, url) => {
                pushState(data, _, url);
                onLocationChange();
            };
            history.replaceState = (data, _, url) => {
                replaceState(data, _, url);
                onLocationChange();
            };
            $window$.addEventListener("popstate", onLocationChange);
            $window$.addEventListener("hashchange", onLocationChange);
            doc.addEventListener("visibilitychange", (() => worker.postMessage([ 12, $winId$, doc.visibilityState ])));
            winCtxs[$winId$] = {
                $winId$: $winId$,
                $window$: $window$
            };
            winCtxs[$winId$].$startTime$ = performance.now();
            {
                const winType = $winId$ === $parentWinId$ ? "top" : "iframe";
                logMain(`Registered ${winType} window ${normalizedWinId($winId$)}`);
            }
            "complete" === doc.readyState ? sendInitEnvData() : $window$.addEventListener("load", sendInitEnvData);
        }
    };
    const readNextScript = (worker, winCtx) => {
        let $winId$ = winCtx.$winId$;
        let win = winCtx.$window$;
        let doc = win.document;
        let scriptSelector = 'script[type="text/partytown"]:not([data-ptid]):not([data-pterror])';
        let scriptElm;
        let $instanceId$;
        let scriptData;
        if (doc && doc.body) {
            scriptElm = doc.querySelector('script[type="text/partytown"]:not([data-ptid]):not([data-pterror]):not([async]):not([defer])');
            scriptElm || (scriptElm = doc.querySelector(scriptSelector));
            if (scriptElm) {
                scriptElm.dataset.ptid = $instanceId$ = getAndSetInstanceId(scriptElm, $winId$);
                scriptData = {
                    $winId$: $winId$,
                    $instanceId$: $instanceId$
                };
                if (scriptElm.src) {
                    scriptData.$url$ = scriptElm.src;
                    scriptData.$orgUrl$ = scriptElm.dataset.ptsrc || scriptElm.src;
                } else {
                    scriptData.$content$ = scriptElm.innerHTML;
                }
                worker.postMessage([ 5, scriptData ]);
            } else {
                if (!winCtx.$isInitialized$) {
                    winCtx.$isInitialized$ = 1;
                    ((worker, $winId$, win) => {
                        let queuedForwardCalls = win._ptf;
                        let forwards = (win.partytown || {}).forward || [];
                        let i;
                        let mainForwardFn;
                        let forwardCall = ($forward$, args) => worker.postMessage([ 8, {
                            $winId$: $winId$,
                            $forward$: $forward$,
                            $args$: serializeForWorker($winId$, Array.from(args))
                        } ]);
                        win._ptf = void 0;
                        forwards.map((forwardProps => {
                            mainForwardFn = win;
                            forwardProps.split(".").map(((_, i, arr) => {
                                mainForwardFn = mainForwardFn[arr[i]] = i + 1 < len(arr) ? mainForwardFn[arr[i]] || ("push" === arr[i + 1] ? [] : {}) : (...args) => forwardCall(arr, args);
                            }));
                        }));
                        if (queuedForwardCalls) {
                            for (i = 0; i < len(queuedForwardCalls); i += 2) {
                                forwardCall(queuedForwardCalls[i], queuedForwardCalls[i + 1]);
                            }
                        }
                    })(worker, $winId$, win);
                    doc.dispatchEvent(new CustomEvent("pt0"));
                    {
                        const winType = win === win.top ? "top" : "iframe";
                        logMain(`Executed ${winType} window ${normalizedWinId($winId$)} environment scripts in ${(performance.now() - winCtx.$startTime$).toFixed(1)}ms`);
                    }
                }
                worker.postMessage([ 6, $winId$ ]);
            }
        } else {
            requestAnimationFrame((() => readNextScript(worker, winCtx)));
        }
    };
    const onMessageFromWebWorker = (worker, msg, winCtx) => {
        if (2 === msg[0]) {
            registerWindow(worker, randomId(), mainWindow);
        } else {
            winCtx = winCtxs[msg[1]];
            winCtx && (5 === msg[0] ? requestAnimationFrame((() => readNextScript(worker, winCtx))) : 4 === msg[0] && ((worker, winCtx, instanceId, errorMsg, scriptElm) => {
                scriptElm = winCtx.$window$.document.querySelector(`[data-ptid="${instanceId}"]`);
                if (scriptElm) {
                    errorMsg ? scriptElm.dataset.pterror = errorMsg : scriptElm.type += "-x";
                    delete scriptElm.dataset.ptid;
                }
                readNextScript(worker, winCtx);
            })(worker, winCtx, msg[2], msg[3]));
        }
    };
    const readMainPlatform = () => {
        const startTime = performance.now();
        const docImpl = doc.implementation.createHTMLDocument();
        const elm = docImpl.createElement("i");
        const textNode = docImpl.createTextNode("");
        const comment = docImpl.createComment("");
        const frag = docImpl.createDocumentFragment();
        const intersectionObserver = getGlobalConstructor(mainWindow, "IntersectionObserver");
        const mutationObserver = getGlobalConstructor(mainWindow, "MutationObserver");
        const resizeObserver = getGlobalConstructor(mainWindow, "ResizeObserver");
        const perf = mainWindow.performance;
        const screen = mainWindow.screen;
        const elms = Object.getOwnPropertyNames(mainWindow).map((interfaceName => ((doc, interfaceName, r, tag) => {
            r = interfaceName.match(/^(HTML|SVG)(.+)Element$/);
            if (r) {
                tag = r[2];
                return "S" == interfaceName[0] ? doc.createElementNS("http://www.w3.org/2000/svg", svgConstructorTags[tag] || tag.slice(0, 2).toLowerCase() + tag.slice(2)) : doc.createElement(htmlConstructorTags[tag] || tag);
            }
        })(docImpl, interfaceName))).filter((elm => elm)).map((elm => [ elm ]));
        const impls = [ [ mainWindow.history ], [ perf ], [ perf.navigation ], [ perf.timing ], [ screen ], [ screen.orientation ], [ mainWindow.visualViewport ], [ intersectionObserver, 12 ], [ mutationObserver, 12 ], [ resizeObserver, 12 ], [ textNode ], [ comment ], [ frag ], [ elm ], [ elm.attributes ], [ elm.classList ], [ elm.dataset ], [ elm.style ], [ docImpl ], [ docImpl.doctype ], ...elms ].filter((implData => implData[0])).map((implData => {
            const impl = implData[0];
            const interfaceType = implData[1];
            const cstrName = getConstructorName(impl);
            const CstrPrototype = mainWindow[cstrName].prototype;
            return [ cstrName, CstrPrototype, impl, interfaceType ];
        }));
        const $interfaces$ = [ readImplementation("Window", mainWindow), readImplementation("Node", textNode) ];
        const $config$ = JSON.stringify(config, ((k, v) => {
            if ("function" == typeof v) {
                v = String(v);
                v.startsWith(k + "(") && (v = "function " + v);
            }
            return v;
        }));
        const initWebWorkerData = {
            $config$: $config$,
            $libPath$: new URL(libPath, mainWindow.location) + "",
            $interfaces$: $interfaces$,
            $origin$: origin,
            $localStorage$: readStorage("localStorage"),
            $sessionStorage$: readStorage("sessionStorage")
        };
        impls.map((([cstrName, CstrPrototype, impl, intefaceType]) => readOwnImplementation($interfaces$, cstrName, CstrPrototype, impl, intefaceType)));
        addGlobalConstructorUsingPrototype($interfaces$, mainWindow, "IntersectionObserverEntry");
        logMain(`Read ${$interfaces$.length} interfaces in ${(performance.now() - startTime).toFixed(1)}ms`);
        return initWebWorkerData;
    };
    const readImplementation = (cstrName, impl, memberName) => {
        let interfaceMembers = [];
        let interfaceInfo = [ cstrName, "Object", interfaceMembers ];
        for (memberName in impl) {
            readImplementationMember(interfaceMembers, impl, memberName);
        }
        return interfaceInfo;
    };
    const readOwnImplementation = (interfaces, cstrName, CstrPrototype, impl, interfaceType) => {
        if ("Object" !== cstrName && !interfaces.some((i => i[0] === cstrName))) {
            const SuperCstr = Object.getPrototypeOf(CstrPrototype);
            const superCstrName = getConstructorName(SuperCstr);
            const interfaceMembers = [];
            readOwnImplementation(interfaces, superCstrName, SuperCstr, impl, interfaceType);
            Object.keys(Object.getOwnPropertyDescriptors(CstrPrototype)).map((memberName => readImplementationMember(interfaceMembers, impl, memberName)));
            interfaces.push([ cstrName, superCstrName, interfaceMembers, interfaceType, impl.nodeName ]);
        }
    };
    const readImplementationMember = (interfaceMembers, implementation, memberName, value, memberType, cstrName) => {
        try {
            if (isValidMemberName(memberName) && isNaN(memberName[0]) && "all" !== memberName) {
                value = implementation[memberName];
                memberType = typeof value;
                if ("function" === memberType) {
                    (String(value).includes("[native") || Object.getPrototypeOf(implementation)[memberName]) && interfaceMembers.push([ memberName, 5 ]);
                } else if ("object" === memberType && null != value) {
                    cstrName = getConstructorName(value);
                    "Object" !== cstrName && self[cstrName] && interfaceMembers.push([ memberName, value.nodeType || cstrName ]);
                } else {
                    "symbol" !== memberType && (memberName.toUpperCase() === memberName ? interfaceMembers.push([ memberName, 6, value ]) : interfaceMembers.push([ memberName, 6 ]));
                }
            }
        } catch (e) {
            console.warn(e);
        }
    };
    const readStorage = storageName => {
        let items = [];
        let i = 0;
        let l = len(mainWindow[storageName]);
        let key;
        for (;i < l; i++) {
            key = mainWindow[storageName].key(i);
            items.push([ key, mainWindow[storageName].getItem(key) ]);
        }
        return items;
    };
    const getGlobalConstructor = (mainWindow, cstrName) => void 0 !== mainWindow[cstrName] ? new mainWindow[cstrName](noop) : 0;
    const addGlobalConstructorUsingPrototype = ($interfaces$, mainWindow, cstrName) => {
        void 0 !== mainWindow[cstrName] && $interfaces$.push([ cstrName, "Object", Object.keys(mainWindow[cstrName].prototype).map((propName => [ propName, 6 ])), 12 ]);
    };
    let worker;
    (receiveMessage => {
        const swContainer = window.navigator.serviceWorker;
        return swContainer.getRegistration().then((swRegistration => {
            swContainer.addEventListener("message", (ev => receiveMessage(ev.data, (accessRsp => swRegistration.active && swRegistration.active.postMessage(accessRsp)))));
            return (worker, msg) => {
                0 === msg[0] ? worker.postMessage([ 1, readMainPlatform() ]) : onMessageFromWebWorker(worker, msg);
            };
        }));
    })(((accessReq, responseCallback) => mainAccessHandler(worker, accessReq).then(responseCallback))).then((onMessageHandler => {
        if (onMessageHandler) {
            worker = new Worker(libPath + "partytown-ww-sw.js?v=0.4.5", {
                name: "Partytown 🎉"
            });
            worker.onmessage = ev => {
                const msg = ev.data;
                10 === msg[0] ? mainAccessHandler(worker, msg[1]) : onMessageHandler(worker, msg);
            };
            logMain("Created Partytown web worker (0.4.5)");
            worker.onerror = ev => console.error("Web Worker Error", ev);
            mainWindow.addEventListener("pt1", (ev => registerWindow(worker, getAndSetInstanceId(ev.detail.frameElement), ev.detail)));
        }
    }));
})(window);
