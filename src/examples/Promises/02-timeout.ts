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
import { Promises, Messengers } from '../../lib';

Messengers.getGlobalMessenger().subscribe<Promises.ISubjectTimeoutResult>(
    'promise:timeout_result',
    'promises.demos.timeout',
    async (success, result, target, issuer) => {

        if (success) {

            console.info(`Request ${issuer} -> ${target} succeed with result ${result} `);
        }
        else {

            console.error(`Request ${issuer} -> ${target} failed with result ${result} `);
        }
    }
);

function test1(timeout: number): Promise<number> {

    const prFactory = Promises.getGlobalFactory();

    let pr = prFactory.findPromise<number>('test1');

    if (pr) {

        console.warn('Aggregated');
        return pr.promise;
    }

    pr = prFactory.createTimeoutPromise<number>({
        id: 'test1',
        timeout,
        issuer: 'test1',
        target: 'unknown'
    });

    setTimeout(pr.resolve, 1000, 123);

    return pr.promise;
}

(async () => {

    (async () => {
        try {

            console.log(await test1(500));
        }
        catch (e) {

            if (e instanceof Promises.E_TIMEOUT) {

                console.error('Timeout!');
            }
        }
    })().catch((e) => console.error(e));

    (async () => {

        try {

            console.log(await test1(500));
        }
        catch (e) {

            if (e instanceof Promises.E_TIMEOUT) {

                console.error('Timeout!');
            }
        }
    })().catch((e) => console.error(e));

    try {

        console.log(await test1(500));
    }
    catch (e) {

        if (e instanceof Promises.E_TIMEOUT) {

            console.error('Timeout!');
        }
    }

    console.log(await test1(2000));

    console.log(await test1(2000));
})().catch((e) => console.error(e));
