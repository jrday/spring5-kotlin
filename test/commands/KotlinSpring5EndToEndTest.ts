/*
 * Copyright © 2017 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "mocha";
import * as assert from "power-assert";
import { CommandResult, runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { Project } from "@atomist/automation-client/project/Project";
import { GishPath } from "./springBootStructureInferenceTest";
import { LocalProject } from "@atomist/automation-client/project/local/LocalProject";
import { TestGenerator } from "./TestGenerator";

describe("Kotlin Spring5 generator end to end", () => {

    it("edits and persists", done => {
        generate()
            .then(verifyAndCompile)
            .then(cr => {
                    console.log(cr.stdout);
                    done();
                }
            ).catch(done);
    }).timeout(200000);

    function generate(): Promise<LocalProject> {
        const kgen = new TestGenerator();
        kgen.artifactId = "my-custom";
        kgen.groupId = "atomist";
        kgen.rootPackage = "com.the.smiths";
        return kgen.handle(null, kgen)
            .then(hr => {
                assert(hr.code === 0);
                return kgen.created;
            });
    }

    function verifyAndCompile(p: LocalProject): Promise<CommandResult> {
        verify(p);
        return compile(p);
    }

    function verify(p: Project): void {
        assert(!p.findFileSync(GishPath));
        const f = p.findFileSync("src/main/kotlin/com/the/smiths/MyCustomApplication.kt");
        assert(f);
        const content = f.getContentSync();
        assert(content.includes("class MyCustom"));
    }

    function compile(p: LocalProject): Promise<CommandResult> {
        return runCommand("mvn compile", {cwd: p.baseDir})
            .catch(err => {
                console.log(err);
                throw err;
            });
    }

});

