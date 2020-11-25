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

/* eslint-disable @typescript-eslint/unbound-method */
import * as C from './Common';
import { IMessenger } from '../Messengers';
import * as E from './Errors';

export type Writable<T> = { -readonly [P in keyof T]: T[P]; };

class TimeoutPromise implements C.IPromiseHandle {

    private _timer?: NodeJS.Timeout;

    public readonly expiringAt: number;

    public promise: Promise<any>;

    private _resolve!: (v: any) => void;

    private _reject!: (e: any) => void;

    public constructor(
        timeout: number,
        private _slots: Record<string, C.IPromiseHandle>,
        public id: C.TPromiseIdentity = C.ANONYMOUS_PROMISE,
        private _msger?: IMessenger,
        private _target?: string,
        private _issuer?: string
    ) {

        this.promise = new Promise((resolve, reject) => {

            this._resolve = resolve;
            this._reject = reject;
        });

        this.expiringAt = Date.now() + timeout;

        this._timer = setTimeout(() => {

            delete this._timer;

            if (this.id !== C.ANONYMOUS_PROMISE) {

                delete this._slots[this.id as string];
            }

            this._reject(new E.E_TIMEOUT());

        }, timeout);

        this.reject = this.reject.bind(this);
        this.resolve = this.resolve.bind(this);
    }

    public get timeout(): boolean {

        return !this._timer;
    }

    public reject(e: any): void {

        if (!this._timer) {

            this._msger?.publish<C.ISubjectTimeoutResult>(
                'promise:timeout_result',
                false,
                e,
                this._target,
                this._issuer
            );
            return;
        }

        clearTimeout(this._timer);

        delete this._timer;

        if (this.id !== C.ANONYMOUS_PROMISE) {

            delete this._slots[this.id as string];
        }

        this._reject(e);
    }

    public resolve(e: any): void {

        if (!this._timer) {

            this._msger?.publish<C.ISubjectTimeoutResult>(
                'promise:timeout_result',
                true,
                e,
                this._target,
                this._issuer
            );
            return;
        }

        clearTimeout(this._timer);

        delete this._timer;

        if (this.id !== C.ANONYMOUS_PROMISE) {

            delete this._slots[this.id as string];
        }

        this._resolve(e);
    }
}

class PromiseFactory implements C.IPromiseFactory {

    private _uniquePromises: Record<string, C.IPromiseHandle> = {};

    public constructor(
        private _msger: IMessenger
    ) {}

    public findPromise(id: C.TPromiseIdentity): C.IPromiseHandle | null {

        return this._uniquePromises[id as string] || null;
    }

    public createPromise(opts?: C.IPromiseOptions): C.IPromiseHandle {

        const ret: C.IPromiseHandle = { id: opts?.id ?? C.ANONYMOUS_PROMISE } as any;

        if (opts?.id) {

            const id = opts.id || C.ANONYMOUS_PROMISE;

            if (this._uniquePromises[id as string]) {

                throw new E.E_DUP_PROMISE({ metadata: { id } });
            }

            ret.promise = new Promise((resolve, reject) => {

                ret.reject = (e: any) => {

                    delete this._uniquePromises[id as string];
                    reject(e);
                };

                ret.resolve = (v: any) => {

                    delete this._uniquePromises[id as string];
                    resolve(v);
                };
            });

            this._uniquePromises[id as string] = ret;

            return ret;
        }

        ret.promise = new Promise((resolve, reject) => {

            ret.reject = reject;
            ret.resolve = resolve;
        });

        return ret;
    }

    public createTimeoutPromise(opts: C.ITimeoutPromiseOptions): C.IPromiseHandle {

        const ret = new TimeoutPromise(
            opts.timeout,
            this._uniquePromises,
            opts.id,
            this._msger,
            opts.target,
            opts.issuer
        );

        if (opts.id) {

            this._uniquePromises[opts.id as string] = ret;
        }

        return ret;
    }
}

export function createPromiseFactory(messenger: IMessenger): C.IPromiseFactory {

    return new PromiseFactory(messenger);
}
