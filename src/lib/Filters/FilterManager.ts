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

type TFilterFn = (value: any, ...args: any[]) => Promise<void>;

class FilterManager
implements C.IFilterManager {

    private _filters: Record<string, Record<string, TFilterFn>> = {};

    public register(
        name: string | string[],
        key: string,
        callback: (...args: any[]) => Promise<void>
    ): this {

        if (!Array.isArray(name)) {

            name = [name];
        }

        for (const s of name) {

            if (!this._filters[s]) {

                this._filters[s] = {};
            }

            if (this._filters[s][key]) {

                throw new E.E_DUP_FILTER_FUNCTION({ metadata: { name: s, key } });
            }

            this._filters[s][key] = callback;
        }

        return this;
    }

    public unregister(
        name: string,
        key: string
    ): this {

        if (!this._filters[name]) {

            return this;
        }

        delete this._filters[name][key];

        return this;
    }

    public unregisterAll(name: string): this {

        delete this._filters[name];

        return this;
    }

    public async filter(name: string, value: any, ...args: any[]): Promise<any> {

        const callbacks = this._filters[name];

        if (!callbacks) {

            return value;
        }

        for (const key in callbacks) {

            const v = callbacks[key](value, ...args);

            value = v instanceof Promise ? await v : v;
        }

        return value;
    }

    public getFilterList(): Array<string | symbol> {

        return [
            ...Object.getOwnPropertySymbols(this._filters),
            ...Object.getOwnPropertyNames(this._filters)
        ];
    }

    public getFunctionList(name: string): Array<string | symbol> {

        return [
            ...Object.getOwnPropertySymbols(this._filters[name] || {}),
            ...Object.getOwnPropertyNames(this._filters[name] || {})
        ];
    }
}

export function createFilterManager(): C.IFilterManager {

    return new FilterManager();
}
