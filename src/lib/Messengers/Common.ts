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

export interface ISubjectTemplate {

    subject: string | symbol;

    callback(...args: any[]): Promise<void> | void;
}

export type AsyncResult<IsAsync extends boolean, T, F> = IsAsync extends true ? Promise<T> : F;

/**
 * @param {boolean} IsAsync Tell if the messenger itself is async.
 */
export interface IMessenger<IsAsync extends boolean = false> {

    /**
     * Register a new subscriber for a subject.
     *
     * @param subject   The subject of message.
     * @param key       The key of subscriber.
     * @param callback  The callback of subscriber.
     */
    subscribe<T extends ISubjectTemplate = ISubjectTemplate>(
        subject: T["subject"] | Array<T["subject"]>,
        key: string | symbol,
        callback: T["callback"]
    ): AsyncResult<IsAsync, void, this>;

    /**
     * Unregister an existing subscriber from a subject.
     *
     * @param subject   The subject of message.
     * @param key       The key of subscriber.
     */
    unsubscribe(subject: string | symbol, key: string | symbol): AsyncResult<IsAsync, void, this>;

    /**
     * Unregister all subscribers of an existing subject.
     *
     * @param subject   The subject of message.
     */
    unsubscribeAll(subject: string): AsyncResult<IsAsync, void, this>;

    /**
     * Publish a message to determined subject.
     *
     * @param subject   The subject of message.
     * @param args      The arguments of message.
     */
    publish<T extends ISubjectTemplate = ISubjectTemplate>(
        subject: T["subject"],
        ...args: Parameters<T["callback"]>
    ): void;

    /**
     * Publish a message and wait for processing.
     *
     * @param subject   The subject of message.
     * @param args      The arguments of message.
     */
    publishBlocking<T extends ISubjectTemplate = ISubjectTemplate>(
        subject: T["subject"],
        ...args: Parameters<T["callback"]>
    ): Promise<void>;

    /**
     * Get the name list of registered subjects.
     */
    getSubjectList(): AsyncResult<IsAsync, string[], Array<string | symbol>>;

    /**
     * Get the key list of registered subscribers in determined subject.
     *
     * @param subject   The subject to be listed.
     */
    getSubscriberList(subject: string | symbol): AsyncResult<IsAsync, string[], Array<string | symbol>>;
}
