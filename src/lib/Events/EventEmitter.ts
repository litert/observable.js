/**
 * Copyright 2020 Angus.Fenying <fenying@litert.org>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as C from "./Common";
import * as Errors from "./Errors";

const P_EVENT_SLOTS = Symbol("events:slots");

const P_CONFIG = Symbol("events:config");

class ListenerInfo<T extends Function> {

    public once: boolean;

    public callback: T;

    public constructor(callback: T, once: boolean) {

        this.callback = callback;
        this.once = once;
    }
}

const DEFAULT_CONFIGURATION: C.IConfiguration = {

    continueOnError: false,

    interruptable: false,

    maxListeners: 10
};

class EventInfo<T extends Function> {

    /**
     * The configuration of this event.
     */
    public config: C.IConfiguration;

    /**
     * The queue of listeners.
     */
    public listeners: Array<ListenerInfo<T>>;

    public constructor(config: C.IConfiguration) {

        this.config = config;
        this.listeners = [];
    }
}

type EventSlot<T extends C.ICallbackDefinitions> = {

    [E in keyof T]: EventInfo<C.TRebuildFn<T[E]>>;
};

export class EventEmitter<T extends C.ICallbackDefinitions>
implements C.IEmitter<T> {

    private [P_CONFIG]: C.IConfiguration;

    private [P_EVENT_SLOTS]: EventSlot<T>;

    public constructor(config?: Partial<C.IConfiguration>) {

        this[P_EVENT_SLOTS] = {} as any;
        this[P_CONFIG] = { ...DEFAULT_CONFIGURATION, ...config };
    }

    public addListener<E extends keyof T>(
        event: E,
        callback: C.TRebuildFn<T[E]>
    ): this {

        return this.on<E>(event, callback);
    }

    public on<E extends keyof T>(
        event: E,
        callback: C.TRebuildFn<T[E]>
    ): this {

        let ev = this[P_EVENT_SLOTS][event];

        if (!ev) {

            ev = this[P_EVENT_SLOTS][event] = new EventInfo(
                this[P_CONFIG]
            );
        }

        if (ev.config.maxListeners === ev.listeners.length) {

            throw new Errors.E_EXCEED_MAX_LISTENERS();
        }

        ev.listeners.push(new ListenerInfo(callback, false));

        return this;
    }

    public addOnceListener<E extends keyof T>(
        event: E,
        callback: C.TRebuildFn<T[E]>
    ): this {

        return this.once<E>(event, callback);
    }

    public once<E extends keyof T>(
        event: E,
        callback: C.TRebuildFn<T[E]>
    ): this {

        let ev = this[P_EVENT_SLOTS][event];

        if (!ev) {

            ev = this[P_EVENT_SLOTS][event] = new EventInfo(
                this[P_CONFIG]
            );
        }

        if (ev.config.maxListeners === ev.listeners.length) {

            throw new Errors.E_EXCEED_MAX_LISTENERS();
        }

        ev.listeners.push(new ListenerInfo(callback, true));

        return this;
    }

    public eventNames(): Array<keyof T> {

        return Object.keys(this[P_EVENT_SLOTS]);
    }

    public hasListener<E extends keyof T>(
        event: E,
        callback: C.TRebuildFn<T[E]>
    ): boolean {

        const ev = this[P_EVENT_SLOTS][event];

        if (!ev) {

            return false;
        }

        return ev.listeners.filter((x) => x.callback === callback).length > 0;
    }

    public listeners<E extends keyof T>(event: E): Array<C.TRebuildFn<T[E]>> {

        const ev = this[P_EVENT_SLOTS][event];

        return ev ? ev.listeners.map((x) => x.callback) : [];
    }

    public listenerCount<E extends keyof T>(event: E): number {

        const ev = this[P_EVENT_SLOTS][event];

        return ev ? ev.listeners.length : 0;
    }

    public off<E extends keyof T>(
        event: E,
        callback?: C.TRebuildFn<T[E]>
    ): number {

        const ev = this[P_EVENT_SLOTS][event];

        if (!ev) {

            return 0;
        }

        if (callback) {

            for (let i = 0; i < ev.listeners.length; i++) {

                if (ev.listeners[i].callback === callback) {

                    ev.listeners.splice(i--, 1);
                }
            }
        }

        return ev.listeners.splice(0).length;
    }

    public removeListener<E extends keyof T>(
        event: E,
        callback?: C.TRebuildFn<T[E]>
    ): number {

        return this.off<E>(event, callback);
    }

    public configEvent(
        ...args: [keyof T, Partial<C.IConfiguration>] | [Partial<C.IConfiguration>]
    ): this {

        if (args.length === 2) {

            const ev = this[P_EVENT_SLOTS][args[0]];

            if (ev) {

                ev.config = { ...ev.config, ...args[1] };
            }
            else {

                this[P_EVENT_SLOTS][args[0]] = new EventInfo(
                    { ...this[P_CONFIG], ...args[1] }
                );
            }
        }
        else {

            this[P_CONFIG] = { ...this[P_CONFIG], ...args[0] };
        }

        return this;
    }

    public emit<E extends keyof T>(
        event: E,
        ...args: Parameters<T[E]>
    ): boolean {

        const ev = this[P_EVENT_SLOTS][event];

        if (!ev || !ev.listeners.length) {

            return false;
        }

        const INTERRUPTABLE = ev.config.interruptable;
        const CONTINUE_ON_ERROR = ev.config.continueOnError;

        for (let i = 0; i < ev.listeners.length; i++) {

            const listener = ev.listeners[i];

            try {

                const ret = listener.callback.apply(this, args);

                if (INTERRUPTABLE && ret === false) {

                    return true;
                }
            }
            catch (e) {

                if (event === "error") {

                    throw e;
                }

                // @ts-ignore
                this.emit("error", e);

                if (!CONTINUE_ON_ERROR) {

                    return true;
                }
            }
            finally {

                if (listener.once) {

                    ev.listeners.splice(i--, 1);
                }
            }
        }

        return true;
    }
}
