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

import * as C from './Common';
import * as Errors from './Errors';

const PRIV_PROP_EVENT_SLOTS = Symbol('events:slots');

const PRIV_PROP_CONFIG = Symbol('events:config');

class ListenerInfo<T extends (...args: any[]) => any> {

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

class EventInfo<T extends (...args: any[]) => any> {

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

    [E in keyof T]: EventInfo<T[E]>;
};

export class EventEmitter<T extends C.ICallbackDefinitions>
implements C.IEmitter<T> {

    private [PRIV_PROP_CONFIG]: C.IConfiguration;

    private [PRIV_PROP_EVENT_SLOTS]: EventSlot<T>;

    public constructor(config?: Partial<C.IConfiguration>) {

        this[PRIV_PROP_EVENT_SLOTS] = {} as any;
        this[PRIV_PROP_CONFIG] = { ...DEFAULT_CONFIGURATION, ...config };
    }

    public addListener<TEvent extends keyof T>(
        event: TEvent,
        callback: T[TEvent]
    ): this {

        return this.on<TEvent>(event, callback);
    }

    public on<TEvent extends keyof T>(
        event: TEvent,
        callback: T[TEvent]
    ): this {

        let ev = this[PRIV_PROP_EVENT_SLOTS][event];

        if (!ev) {

            ev = this[PRIV_PROP_EVENT_SLOTS][event] = new EventInfo(
                this[PRIV_PROP_CONFIG]
            );
        }

        if (ev.config.maxListeners === ev.listeners.length) {

            throw new Errors.E_EXCEED_MAX_LISTENERS();
        }

        ev.listeners.push(new ListenerInfo(callback, false));

        return this;
    }

    public addOnceListener<TEvent extends keyof T>(
        event: TEvent,
        callback: T[TEvent]
    ): this {

        return this.once<TEvent>(event, callback);
    }

    public once<TEvent extends keyof T>(
        event: TEvent,
        callback: T[TEvent]
    ): this {

        let ev = this[PRIV_PROP_EVENT_SLOTS][event];

        if (!ev) {

            ev = this[PRIV_PROP_EVENT_SLOTS][event] = new EventInfo(
                this[PRIV_PROP_CONFIG]
            );
        }

        if (ev.config.maxListeners === ev.listeners.length) {

            throw new Errors.E_EXCEED_MAX_LISTENERS();
        }

        ev.listeners.push(new ListenerInfo(callback, true));

        return this;
    }

    public eventNames(): Array<keyof T> {

        return Object.keys(this[PRIV_PROP_EVENT_SLOTS]);
    }

    public hasListener<TEvent extends keyof T>(
        event: TEvent,
        callback: T[TEvent]
    ): boolean {

        const ev = this[PRIV_PROP_EVENT_SLOTS][event];

        if (!ev) {

            return false;
        }

        return ev.listeners.filter((x) => x.callback === callback).length > 0;
    }

    public listeners<TEvent extends keyof T>(event: TEvent): Array<T[TEvent]> {

        const ev = this[PRIV_PROP_EVENT_SLOTS][event];

        return ev ? ev.listeners.map((x) => x.callback) : [];
    }

    public listenerCount<TEvent extends keyof T>(event: TEvent): number {

        const ev = this[PRIV_PROP_EVENT_SLOTS][event];

        return ev ? ev.listeners.length : 0;
    }

    public off<TEvent extends keyof T>(
        event: TEvent,
        callback?: T[TEvent]
    ): number {

        const ev = this[PRIV_PROP_EVENT_SLOTS][event];

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

    public removeListener<TEvent extends keyof T>(
        event: TEvent,
        callback?: T[TEvent]
    ): number {

        return this.off<TEvent>(event, callback);
    }

    public configEvent(
        ...args: [keyof T, Partial<C.IConfiguration>] | [Partial<C.IConfiguration>]
    ): this {

        if (args.length === 2) {

            const ev = this[PRIV_PROP_EVENT_SLOTS][args[0]];

            if (ev) {

                ev.config = { ...ev.config, ...args[1] };
            }
            else {

                this[PRIV_PROP_EVENT_SLOTS][args[0]] = new EventInfo(
                    { ...this[PRIV_PROP_CONFIG], ...args[1] }
                );
            }
        }
        else {

            this[PRIV_PROP_CONFIG] = { ...this[PRIV_PROP_CONFIG], ...args[0] };
        }

        return this;
    }

    public emit<TEvent extends keyof T>(
        event: TEvent,
        ...args: Parameters<T[TEvent]>
    ): boolean {

        const ev = this[PRIV_PROP_EVENT_SLOTS][event];

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

                if (event === 'error') {

                    throw e;
                }

                // @ts-ignore
                this.emit('error', e);

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
