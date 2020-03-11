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

import { Events } from '../../lib';

interface IEventDefinitions extends Events.ICallbackDefinitions {

    timer(t: number): void;

    walk(a: string, g: number): void;
}

const eh: Events.IEmitter<IEventDefinitions> = new Events.EventEmitter<IEventDefinitions>();

eh
    .on('timer', function(t): void {

        console.log(new Date(t));
    })
    .on('walk', function(t, g): void {

        console.log(new Date(t), g);
    })
    .on('gg', function(): false {
        return false;
    })
    .once('timer', function(): void {

        console.log('This should be called once only.');
    });

setInterval(() => eh.emit('timer', Date.now()), 1000);

eh.emit('walk', '2019-11-11', 123);

eh.emit('gg', '2019-11-11', 123);
