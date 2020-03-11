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

import { Messengers } from '../../lib';

interface ISubjectHello extends Messengers.ISubjectTemplate {

    subject: 'hello';

    callback(name: string): Promise<void> | void;
}

const subjectGo = Symbol('go');

interface ISubjectGo extends Messengers.ISubjectTemplate {

    subject: typeof subjectGo;

    callback(name: string): Promise<void> | void;
}

const lm = Messengers.createLocalMessenger();

lm.subscribe<ISubjectHello>('hello', 'Sarah', (name) => {

    console.info(`Sarah: Received hello from "${name}".`);

}).subscribe<ISubjectHello>('hello', 'John', async (name) => {

    console.info(`John: Received hello from "${name}".`);

}).subscribe<ISubjectGo>(subjectGo, 'John', async (name) => {

    console.info(`${name} went away.`);
});

lm.on('missing_subscriber', function(subject, ...args) {

    console.warn('Received a message that no one subscribed:');
    console.warn(`Subject: ${subject}`);
    console.warn(`Arguments: ${args.join(',')}`);
});

lm.publish<ISubjectHello>('hello', 'Angus');

lm.publish('hi', 'Angus');

lm.publish<ISubjectGo>(subjectGo, 'Edith');
