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

export type ICallback = (...args: any[]) => void | false;

export interface ICallbackDefinitions {

    [k: string]: ICallback;

    error(e: unknown): void;
}

export interface IConfiguration {

    /**
     * Specify an event invoke-chain call be interrupted by returning false in
     * a callback.
     *
     * @default false
     */
    interruptable: boolean;

    /**
     * Don't stop the invoke-chain when an error insides a callbadk.
     *
     * @default false
     */
    continueOnError: boolean;

    /**
     * How many listeners could be mount on an event.
     *
     * @default 10
     */
    maxListeners: number;
}

/**
 * This is a patch to TypeScript's bug.
 *
 * @see https://github.com/Microsoft/TypeScript/issues/30889
 */
export type TRebuildFn<T extends ICallback> = (...v: Parameters<T>) => ReturnType<T>;

export interface IObservable<T extends ICallbackDefinitions> {

    /**
     * Register a listener for an event.
     *
     * @param event     The name of event to be listened.
     * @param callback  The callback of event listener.
     */
    addListener<E extends keyof T>(
        event: E,
        callback: TRebuildFn<T[E]>
    ): this;

    /**
     * Register a one-time listener for an event, adding it to the end of
     * listeners list.
     *
     * @param event     The name of event to be listened.
     * @param callback  The callback of event listener.
     */
    addOnceListener<E extends keyof T>(
        event: E,
        callback: TRebuildFn<T[E]>
    ): this;

    /**
     * The name of events that has been registered with listeners in this
     * observable container.
     */
    eventNames(): Array<keyof T>;

    /**
     * Get an array of the listeners for an event.
     *
     * @param event     The name of event.
     */
    listeners<E extends keyof T>(event: E): Array<TRebuildFn<T[E]>>;

    /**
     * Get the quantity of listeners for an event.
     *
     * @param event     The name of event.
     */
    listenerCount<E extends keyof T>(event: E): number;

    /**
     * Register a listener for an event, adding it to the end of listeners list.
     *
     * @alias addListener
     *
     * @param event     The name of event to be listened.
     * @param callback  The callback of event listener.
     */
    on<E extends keyof T>(event: E, callback: TRebuildFn<T[E]>): this;

    /**
     * Register a one-time listener for an event, adding it to the end of
     * listeners list.
     *
     * @alias addOnceListener
     *
     * @param event     The name of event to be listened.
     * @param callback  The callback of event listener.
     */
    once<E extends keyof T>(event: E, callback: TRebuildFn<T[E]>): this;

    /**
     * Check if a listener callback is bound with an event.
     *
     * @param event     The name of event to be listened.
     * @param callback  The callback of event listener.
     */
    hasListener<E extends keyof T>(
        event: E,
        callback: TRebuildFn<T[E]>
    ): boolean;

    /**
     * Remove a listener, or all listener of specific event.
     *
     * @param event     The name of event to be listened.
     * @param callback  The callback of event listener.
     *
     * @returns The number of listeners removed will be returned.
     */
    removeListener<E extends keyof T>(
        event: E,
        callback?: TRebuildFn<T[E]>
    ): number;

    /**
     * Remove a listener, or all listener of specific event.
     *
     * @alias removeListener
     *
     * @param event     The name of event to be listened.
     * @param callback  The callback of event listener.
     *
     * @returns The number of listeners removed will be returned.
     */
    off<E extends keyof T>(
        event: E,
        callback?: TRebuildFn<T[E]>
    ): number;
}

export interface IEmitter<T extends ICallbackDefinitions>
    extends IObservable<T> {

    /**
     * Emit an event, so that the listeners will be called in the order they are
     * added.
     *
     * @returns Return true if the event has any listener, or return false.
     *
     * @param event     The name of event to be emitted.
     * @param args      The arguments for the event.
     */
    emit<E extends keyof T>(event: E, ...args: Parameters<T[E]>): boolean;

    /**
     * Configure a specific event.
     *
     * @param event     The name of event to be configured.
     * @param config    The configuration.
     */
    configEvent<E extends keyof T>(
        event: E,
        config: Partial<IConfiguration>
    ): this;

    /**
     * Configure the global settings for this Event Hub.
     *
     * @param config    The configuration.
     */
    configEvent(config: Partial<IConfiguration>): this;
}
