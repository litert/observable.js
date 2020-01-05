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
import * as E from "./Errors";
import * as Events from "../Events";

export interface ILocalMessengerEvents extends Events.ICallbackDefinitions {

    missing_subscriber(subject: string, ...args: any[]): void;

    new_subscriber(subject: string, key: string): void;

    subscriber_error(error: any, subject: string, key: string, ...args: any[]): void;
}

export interface ILocalMessenger extends C.IMessenger, Events.EventEmitter<ILocalMessengerEvents> {}

type TMessageCallbackFn = (...args: any[]) => Promise<void>;

class LocalMessenger
extends Events.EventEmitter<ILocalMessengerEvents>
implements ILocalMessenger {

    private _subjects: Record<string, Record<string, TMessageCallbackFn>> = {};

    public constructor() {

        super();
    }

    public subscribe(
        subject: string | string[],
        key: string,
        callback: (...args: any[]) => Promise<void>
    ): this {

        if (!Array.isArray(subject)) {

            subject = [subject];
        }

        for (const s of subject) {

            if (!this._subjects[s]) {

                this._subjects[s] = {};
            }

            if (this._subjects[s][key]) {

                throw new E.E_DUP_SUBSCRIBER({ metadata: { subject: s, key } });
            }

            this._subjects[s][key] = callback;

            this.emit("new_subscriber", s, key);
        }

        return this;
    }

    public unsubscribe(
        subject: string,
        key: string
    ): this {

        if (!this._subjects[subject]) {

            return this;
        }

        delete this._subjects[subject][key];

        return this;
    }

    public unsubscribeAll(subject: string): this {

        delete this._subjects[subject];

        return this;
    }

    public publish(subject: string, ...args: any[]): void {

        this.publishBlocking(subject, ...args).catch(() => 0);
    }

    public async publishBlocking(subject: string, ...args: any[]): Promise<void> {

        const callbacks = this._subjects[subject];

        if (!callbacks) {

            this.emit("missing_subscriber", subject, ...args);

            return;
        }

        for (const key in callbacks) {

            try {

                await callbacks[key](...args);
            }
            catch (e) {

                this.emit("subscriber_error", e, subject, key, ...args);

                continue;
            }
        }
    }

    public getSubjectList(): Array<string | symbol> {

        return [
            ...Object.getOwnPropertySymbols(this._subjects),
            ...Object.getOwnPropertyNames(this._subjects)
        ];
    }

    public getSubscriberList(subject: string): Array<string | symbol> {

        return [
            ...Object.getOwnPropertySymbols(this._subjects[subject] || {}),
            ...Object.getOwnPropertyNames(this._subjects[subject] || {})
        ];
    }
}

export function createLocalMessenger(): ILocalMessenger {

    return new LocalMessenger();
}
