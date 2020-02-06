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

interface IFilterInfo {

    key: string | symbol;

    fn: TFilterFn;

    priority: number;
}

interface IPrivateData {

    filters: Record<string, IFilterInfo[]>;
}

const SECRET_DATA = new WeakMap<C.IFilterManager, IPrivateData>();

class FilterManager
implements C.IFilterManager {

    public constructor() {

        SECRET_DATA.set(this, { filters: {} });
    }

    public register(
        name: string | string[],
        key: string,
        callback: (...args: any[]) => Promise<void>,
        priority: number = 0
    ): this {

        const filters = (SECRET_DATA.get(this) as IPrivateData).filters;

        if (!Array.isArray(name)) {

            name = [name];
        }

        for (const s of name) {

            if (!filters[s]) {

                filters[s] = [];
            }

            if (filters[s].find((v) => v.key === key)) {

                throw new E.E_DUP_FILTER_FUNCTION({ metadata: { name: s, key } });
            }

            filters[s].push({
                key,
                fn: callback,
                priority
            });

            filters[s] = filters[s].sort((a, b) => a.priority - b.priority);
        }

        return this;
    }

    public unregister(
        name: string,
        key: string
    ): this {

        const filters = (SECRET_DATA.get(this) as IPrivateData).filters;

        if (!filters[name]) {

            return this;
        }

        const index =  filters[name].findIndex((v) => v.key === key);

        if (index !== -1) {

            filters[name].splice(index, 1);
        }

        return this;
    }

    public unregisterAll(name: string): this {

        const filters = (SECRET_DATA.get(this) as IPrivateData).filters;

        delete filters[name];

        return this;
    }

    public async filter(name: string, value: any, ...args: any[]): Promise<any> {

        const filters = (SECRET_DATA.get(this) as IPrivateData).filters;

        const items = filters[name];

        if (!items) {

            return value;
        }

        for (const filter of items) {

            const v = filter.fn(value, ...args);

            value = v instanceof Promise ? await v : v;
        }

        return value;
    }

    public getFilterList(): Array<string | symbol> {

        const filters = (SECRET_DATA.get(this) as IPrivateData).filters;

        return [
            ...Object.getOwnPropertySymbols(filters),
            ...Object.getOwnPropertyNames(filters)
        ];
    }

    public getFunctionList(name: string): Array<string | symbol> {

        const filters = (SECRET_DATA.get(this) as IPrivateData).filters;

        return filters[name].map((v) => v.key);
    }
}

export function createFilterManager(): C.IFilterManager {

    return new FilterManager();
}
