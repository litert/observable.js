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

// tslint:disable: no-console
import { Filters } from "../../lib";

const filters = Filters.getGlobalFilterManager();

interface IColorFilter extends Filters.IFilterTemplate {

    name: "color";

    callback(value: string): Promise<string> | string;
}

filters.register<IColorFilter>("color", "no_dark_color", (color: string) => {

    let c = color.toLowerCase();

    if (c.toLowerCase().startsWith("dark")) {

        c = c.slice(4);
    }

    switch (c) {
    case "grey":
    case "black":
        return "white";
    }

    return c;

}).register<IColorFilter>("color", "no_yellow_color", async (color: string) => {

    if (color.toLowerCase().includes("yellow")) {

        return "white";
    }

    return color;
});

(async () => {

    for (const c of [
        "red", "blue", "black", "grey",
        "white", "darkgreen", "yellow", "darkyellow"
    ]) {

        console.log(c, "->", await filters.filter<IColorFilter>("color", c));
    }
})();
