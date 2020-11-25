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

export type TPromiseIdentity = string | symbol;

export const ANONYMOUS_PROMISE = Symbol('anonymous_promise');

export interface ISubjectTimeoutResult {

    subject: 'promise:timeout_result';

    callback(
        success: boolean,
        result: any,
        target?: string,
        issuer?: string
    ): Promise<void>;
}

export interface IPromiseHandle<T = any, TE = any> {

    readonly id: TPromiseIdentity;

    readonly expiringAt: number;

    readonly timeout: boolean;

    resolve(value?: T): void;

    reject(error: TE): void;

    promise: Promise<T>;
}

export interface IPromiseOptions {

    /**
     * The unique identity of the promise.
     */
    'id'?: TPromiseIdentity;
}

export interface ITimeoutPromiseOptions extends IPromiseOptions {

    /**
     * How long will the result return because of timeout, in milliseconds.
     */
    'timeout': number;

    /**
     * The producer of the promise.
     *
     * If timeout, a message will be broadcasted with this issuer when the
     * result comes out.
     */
    'issuer'?: string;

    /**
     * The target of this promise.
     *
     * If timeout, a message will be broadcasted with this target when the
     * result comes out.
     */
    'target'?: string;
}

export interface IPromiseFactory {

    createPromise<T = any, TE = any>(opts?: IPromiseOptions): IPromiseHandle<T, TE>;

    createTimeoutPromise<T = any, TE = any>(opts: ITimeoutPromiseOptions): IPromiseHandle<T, TE>;

    findPromise<T = any, TE = any>(id: TPromiseIdentity): IPromiseHandle<T, TE> | null;
}
