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
import { Promises } from '../../lib';

function test1(): Promise<number> {

    const prFactory = Promises.getGlobalFactory();

    let pr = prFactory.findPromise<number>('test1');

    if (pr) {

        console.warn('Aggregated');
        return pr.promise;
    }

    pr = prFactory.createPromise<number>({
        id: 'test1'
    });

    setTimeout(pr.resolve, 1000, 123);

    return pr.promise;
}

(async () => {

    (async () => {

        console.log(await test1());
    })().catch((e) => console.error(e));

    (async () => {

        console.log(await test1());
    })().catch((e) => console.error(e));

    (async () => {

        console.log(await test1());
    })().catch((e) => console.error(e));

})().catch((e) => console.error(e));
