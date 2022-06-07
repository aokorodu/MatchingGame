
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Card.svelte generated by Svelte v3.48.0 */

    const { console: console_1$1 } = globals;
    const file$1 = "src/Card.svelte";

    // (61:2) {#if !selected}
    function create_if_block(ctx) {
    	let rect;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			rect = svg_element("rect");
    			attr_dev(rect, "x", -/*w*/ ctx[4] / 2);
    			attr_dev(rect, "y", -/*h*/ ctx[5] / 2);
    			attr_dev(rect, "width", /*w*/ ctx[4]);
    			attr_dev(rect, "height", /*h*/ ctx[5]);
    			attr_dev(rect, "fill", "grey");
    			attr_dev(rect, "fill-opacity", "1");
    			attr_dev(rect, "stroke", "black");
    			add_location(rect, file$1, 61, 2, 994);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, rect, anchor);

    			if (!mounted) {
    				dispose = listen_dev(rect, "click", /*clickhandler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(61:2) {#if !selected}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let g;
    	let rect;
    	let text_1;
    	let t;
    	let g_transform_value;
    	let if_block = !/*selected*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			rect = svg_element("rect");
    			text_1 = svg_element("text");
    			t = text(/*symbol*/ ctx[2]);
    			if (if_block) if_block.c();
    			attr_dev(rect, "x", -/*w*/ ctx[4] / 2);
    			attr_dev(rect, "y", -/*h*/ ctx[5] / 2);
    			attr_dev(rect, "width", /*w*/ ctx[4]);
    			attr_dev(rect, "height", /*h*/ ctx[5]);
    			attr_dev(rect, "fill", "white");
    			attr_dev(rect, "stroke", "black");
    			add_location(rect, file$1, 44, 2, 724);
    			attr_dev(text_1, "x", "0");
    			attr_dev(text_1, "y", "0");
    			attr_dev(text_1, "font-size", "25");
    			attr_dev(text_1, "font-weight", "900");
    			attr_dev(text_1, "dominant-baseline", "middle");
    			attr_dev(text_1, "text-anchor", "middle");
    			attr_dev(text_1, "class", "svelte-1nngows");
    			add_location(text_1, file$1, 52, 2, 832);
    			attr_dev(g, "transform", g_transform_value = "translate(" + (/*x*/ ctx[0] + /*w*/ ctx[4] / 2) + ", " + (/*y*/ ctx[1] + /*h*/ ctx[5] / 2) + ")");
    			add_location(g, file$1, 43, 0, 670);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, rect);
    			append_dev(g, text_1);
    			append_dev(text_1, t);
    			if (if_block) if_block.m(g, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*symbol*/ 4) set_data_dev(t, /*symbol*/ ctx[2]);

    			if (!/*selected*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(g, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*x, y*/ 3 && g_transform_value !== (g_transform_value = "translate(" + (/*x*/ ctx[0] + /*w*/ ctx[4] / 2) + ", " + (/*y*/ ctx[1] + /*h*/ ctx[5] / 2) + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Card', slots, []);
    	const dispatch = createEventDispatcher();
    	let { symbol = "A" } = $$props;
    	let { x } = $$props;
    	let { y } = $$props;
    	let { index } = $$props;
    	let w = 50;
    	let h = 50;
    	let showing = false;
    	let selected = false;

    	function position(newX, newY) {
    		$$invalidate(0, x = newX);
    		$$invalidate(1, y = newY);
    	}

    	function getSymbol() {
    		return symbol;
    	}

    	function show() {
    		$$invalidate(3, selected = true);
    	}

    	function hide() {
    		$$invalidate(3, selected = false);
    	}

    	function clickhandler(e) {
    		if (selected) return;
    		console.log("index", index);
    		dispatch('cardClick', { index, symb: symbol });
    	}

    	const writable_props = ['symbol', 'x', 'y', 'index'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('symbol' in $$props) $$invalidate(2, symbol = $$props.symbol);
    		if ('x' in $$props) $$invalidate(0, x = $$props.x);
    		if ('y' in $$props) $$invalidate(1, y = $$props.y);
    		if ('index' in $$props) $$invalidate(7, index = $$props.index);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		symbol,
    		x,
    		y,
    		index,
    		w,
    		h,
    		showing,
    		selected,
    		position,
    		getSymbol,
    		show,
    		hide,
    		clickhandler
    	});

    	$$self.$inject_state = $$props => {
    		if ('symbol' in $$props) $$invalidate(2, symbol = $$props.symbol);
    		if ('x' in $$props) $$invalidate(0, x = $$props.x);
    		if ('y' in $$props) $$invalidate(1, y = $$props.y);
    		if ('index' in $$props) $$invalidate(7, index = $$props.index);
    		if ('w' in $$props) $$invalidate(4, w = $$props.w);
    		if ('h' in $$props) $$invalidate(5, h = $$props.h);
    		if ('showing' in $$props) showing = $$props.showing;
    		if ('selected' in $$props) $$invalidate(3, selected = $$props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		x,
    		y,
    		symbol,
    		selected,
    		w,
    		h,
    		clickhandler,
    		index,
    		position,
    		getSymbol,
    		show,
    		hide
    	];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			symbol: 2,
    			x: 0,
    			y: 1,
    			index: 7,
    			position: 8,
    			getSymbol: 9,
    			show: 10,
    			hide: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*x*/ ctx[0] === undefined && !('x' in props)) {
    			console_1$1.warn("<Card> was created without expected prop 'x'");
    		}

    		if (/*y*/ ctx[1] === undefined && !('y' in props)) {
    			console_1$1.warn("<Card> was created without expected prop 'y'");
    		}

    		if (/*index*/ ctx[7] === undefined && !('index' in props)) {
    			console_1$1.warn("<Card> was created without expected prop 'index'");
    		}
    	}

    	get symbol() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set symbol(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		return this.$$.ctx[8];
    	}

    	set position(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getSymbol() {
    		return this.$$.ctx[9];
    	}

    	set getSymbol(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		return this.$$.ctx[10];
    	}

    	set show(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hide() {
    		return this.$$.ctx[11];
    	}

    	set hide(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.48.0 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	child_ctx[25] = list;
    	child_ctx[26] = i;
    	return child_ctx;
    }

    // (75:2) {#each symbols as symbol, index}
    function create_each_block(ctx) {
    	let card;
    	let index = /*index*/ ctx[26];
    	let current;
    	const assign_card = () => /*card_binding*/ ctx[12](card, index);
    	const unassign_card = () => /*card_binding*/ ctx[12](null, index);

    	let card_props = {
    		x: "0",
    		y: "0",
    		index: /*index*/ ctx[26],
    		symbol: /*symbol*/ ctx[24]
    	};

    	card = new Card({ props: card_props, $$inline: true });
    	assign_card();
    	card.$on("cardClick", /*handleCardClick*/ ctx[7]);

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (index !== /*index*/ ctx[26]) {
    				unassign_card();
    				index = /*index*/ ctx[26];
    				assign_card();
    			}

    			const card_changes = {};
    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			unassign_card();
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(75:2) {#each symbols as symbol, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let svg_1;
    	let g;
    	let current;
    	let each_value = /*symbols*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			t0 = text("matches: ");
    			t1 = text(/*matches*/ ctx[3]);
    			t2 = space();
    			svg_1 = svg_element("svg");
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(div, file, 71, 1, 1410);
    			add_location(g, file, 73, 2, 1516);
    			attr_dev(svg_1, "width", "" + (/*w*/ ctx[4] + "px"));
    			attr_dev(svg_1, "height", "" + (/*h*/ ctx[5] + "px"));
    			attr_dev(svg_1, "viewBox", "0 0 " + /*w*/ ctx[4] + " " + /*h*/ ctx[5]);
    			attr_dev(svg_1, "class", "svelte-hufhdn");
    			add_location(svg_1, file, 72, 1, 1441);
    			attr_dev(main, "class", "svelte-hufhdn");
    			add_location(main, file, 70, 0, 1402);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(main, t2);
    			append_dev(main, svg_1);
    			append_dev(svg_1, g);
    			/*g_binding*/ ctx[11](g);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svg_1, null);
    			}

    			/*svg_1_binding*/ ctx[13](svg_1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*matches*/ 8) set_data_dev(t1, /*matches*/ ctx[3]);

    			if (dirty & /*symbols, cardArray, handleCardClick*/ 196) {
    				each_value = /*symbols*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(svg_1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*g_binding*/ ctx[11](null);
    			destroy_each(each_blocks, detaching);
    			/*svg_1_binding*/ ctx[13](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let svg;
    	let cardHolder;
    	let w = 500;
    	let h = 500;
    	let cardWidth = 50;
    	let cardHeight = 50;
    	let gap = 10;
    	let { rows } = $$props;
    	let { columns } = $$props;
    	let rowWidth = columns * (cardWidth + gap) - gap;
    	let columnHeight = rows * (cardHeight + gap) - gap;
    	let totalCards = rows * columns;
    	let str = "AABBCCDDEEFFGGHHIIJJKKLLMMNNOOPP";
    	str = str.substring(0, totalCards);
    	let symbols = str.split("");
    	let cardArray = [];
    	let selectedCards = [];
    	let matches = 0;

    	function init() {
    		console.log("cards:", cardArray.length);
    		arrange();
    	}

    	function arrange() {
    		const startX = (w - rowWidth) / 2;
    		const startY = (h - columnHeight) / 2;

    		for (let r = 0; r < rows; r++) {
    			for (let c = 0; c < columns; c++) cardArray[r * rows + c].position(startX + r * 60, startY + c * 60);
    		}
    	}

    	function handleCardClick(e) {
    		if (selectedCards.length >= 2) return;
    		const index = e.detail.index;
    		const newCard = cardArray[index];
    		newCard.show();
    		selectedCards.push(newCard);

    		if (selectedCards.length == 2) {
    			if (selectedCards[0].getSymbol() == selectedCards[1].getSymbol()) {
    				console.log("match!");
    				$$invalidate(3, matches++, matches);
    			} else {
    				console.log('no match');
    				setTimeout(deselectCards, 2000);
    			}
    		}
    	}

    	function deselectCards() {
    		selectedCards.forEach(card => {
    			card.hide();
    		});

    		selectedCards = [];
    	}

    	const writable_props = ['rows', 'columns'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function g_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			cardHolder = $$value;
    			$$invalidate(1, cardHolder);
    		});
    	}

    	function card_binding($$value, index) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			cardArray[index] = $$value;
    			$$invalidate(2, cardArray);
    		});
    	}

    	function svg_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			svg = $$value;
    			$$invalidate(0, svg);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('rows' in $$props) $$invalidate(8, rows = $$props.rows);
    		if ('columns' in $$props) $$invalidate(9, columns = $$props.columns);
    	};

    	$$self.$capture_state = () => ({
    		Card,
    		svg,
    		cardHolder,
    		w,
    		h,
    		cardWidth,
    		cardHeight,
    		gap,
    		rows,
    		columns,
    		rowWidth,
    		columnHeight,
    		totalCards,
    		str,
    		symbols,
    		cardArray,
    		selectedCards,
    		matches,
    		init,
    		arrange,
    		handleCardClick,
    		deselectCards
    	});

    	$$self.$inject_state = $$props => {
    		if ('svg' in $$props) $$invalidate(0, svg = $$props.svg);
    		if ('cardHolder' in $$props) $$invalidate(1, cardHolder = $$props.cardHolder);
    		if ('w' in $$props) $$invalidate(4, w = $$props.w);
    		if ('h' in $$props) $$invalidate(5, h = $$props.h);
    		if ('cardWidth' in $$props) cardWidth = $$props.cardWidth;
    		if ('cardHeight' in $$props) cardHeight = $$props.cardHeight;
    		if ('gap' in $$props) gap = $$props.gap;
    		if ('rows' in $$props) $$invalidate(8, rows = $$props.rows);
    		if ('columns' in $$props) $$invalidate(9, columns = $$props.columns);
    		if ('rowWidth' in $$props) rowWidth = $$props.rowWidth;
    		if ('columnHeight' in $$props) columnHeight = $$props.columnHeight;
    		if ('totalCards' in $$props) totalCards = $$props.totalCards;
    		if ('str' in $$props) str = $$props.str;
    		if ('symbols' in $$props) $$invalidate(6, symbols = $$props.symbols);
    		if ('cardArray' in $$props) $$invalidate(2, cardArray = $$props.cardArray);
    		if ('selectedCards' in $$props) selectedCards = $$props.selectedCards;
    		if ('matches' in $$props) $$invalidate(3, matches = $$props.matches);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		svg,
    		cardHolder,
    		cardArray,
    		matches,
    		w,
    		h,
    		symbols,
    		handleCardClick,
    		rows,
    		columns,
    		init,
    		g_binding,
    		card_binding,
    		svg_1_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { rows: 8, columns: 9, init: 10 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*rows*/ ctx[8] === undefined && !('rows' in props)) {
    			console_1.warn("<App> was created without expected prop 'rows'");
    		}

    		if (/*columns*/ ctx[9] === undefined && !('columns' in props)) {
    			console_1.warn("<App> was created without expected prop 'columns'");
    		}
    	}

    	get rows() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rows(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get columns() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set columns(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get init() {
    		return this.$$.ctx[10];
    	}

    	set init(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		rows: 4,
    		columns: 4
    	}
    });

    app.init();

    return app;

})();
//# sourceMappingURL=bundle.js.map
