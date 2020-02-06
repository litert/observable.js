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

export type PromiseType<T> = T extends Promise<infer P> ? P : T;

export interface IFilterTemplate {

    name: string | symbol;

    callback(value: any, ...args: any[]): Promise<any> | any;
}

export interface IFilterManager {

    /**
     * Register a new filter function of the determined name.
     *
     * @param name      The name of filter.
     * @param key       The key of filter function.
     * @param callback  The filter function.
     * @param priority  The priority of filter function (the lower would be executed earlier). [Default: 0]
     */
    register<T extends IFilterTemplate = IFilterTemplate>(
        name: T["name"] | Array<T["name"]>,
        key: string | symbol,
        callback: T["callback"],
        priority?: number
    ): this;

    /**
     * Unregister an existing filter function from a determined name.
     *
     * @param name      The name of filter.
     * @param key       The key of filter function.
     */
    unregister(name: string | symbol, key: string | symbol): this;

    /**
     * Unregister all filter functions from a determined name.
     *
     * @param name      The name of filter.
     */
    unregisterAll(name: string): this;

    /**
     * Execute a filter.
     *
     * @param name      The name of filter.
     * @param value     The initial value for filter.
     * @param args      The extra arguments of filter.
     */
    filter<T extends IFilterTemplate = IFilterTemplate>(
        name: T["name"],
        ...args: Parameters<T["callback"]>
    ): Promise<PromiseType<ReturnType<T["callback"]>>>;

    /**
     * Get the name list of registered filters.
     */
    getFilterList(): Array<string | symbol>;

    /**
     * Get the key list of registered function in determined filter.
     *
     * @param name      The name of filter to be listed.
     */
    getFunctionList(name: string | symbol): Array<string | symbol>;
}
